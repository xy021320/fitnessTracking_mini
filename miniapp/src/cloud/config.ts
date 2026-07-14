import Taro from '@tarojs/taro'
import type { CloudAdapter } from './types'

let initialized = false

export function initCloud(): void {
  if (initialized) return
  // Omitting env lets WeChat use the environment associated with this AppID.
  // This avoids embedding a machine-specific environment ID in source control.
  Taro.cloud.init({ traceUser: true })
  initialized = true
}

export function createTaroCloudAdapter(): CloudAdapter {
  initCloud()
  const db = Taro.cloud.database()
  const normalize = (where: Record<string, any>) => Object.keys(where).reduce<Record<string, any>>((result, key) => {
    const value = where[key]
    result[key] = value && typeof value === 'object' && '$gt' in value ? db.command.gt(value.$gt) : value
    return result
  }, {})
  return {
    callFunction: (name, data) => Taro.cloud.callFunction({ name, data }) as Promise<{ result?: unknown }>,
    async list(collection, where, options) {
      const result = await db.collection(collection).where(normalize(where)).orderBy(options.orderBy[0], options.orderBy[1]).skip(options.skip).limit(options.limit).get()
      return result.data as Record<string, any>[]
    },
    async findOne(collection, where) {
      const result = await db.collection(collection).where(normalize(where)).limit(1).get()
      return (result.data?.[0] as Record<string, any>) ?? null
    },
    async add(collection, data) {
      const result = await db.collection(collection).add({ data })
      return { id: String(result._id) }
    },
    async update(collection, id, data) {
      await db.collection(collection).doc(id).update({ data })
    },
    serverDate: () => db.serverDate()
  }
}

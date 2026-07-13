import Taro from '@tarojs/taro'
import type { CloudAdapter } from './types'

let initialized = false

export function initCloud(): void {
  if (initialized) return
  const env = process.env.TARO_APP_CLOUD_ENV
  Taro.cloud.init({ ...(env ? { env } : {}), traceUser: true })
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
      const result = await db.collection(collection).where(normalize(where)).orderBy(options.orderBy[0], options.orderBy[1]).limit(options.limit).get()
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

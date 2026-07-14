import type { ExerciseDefinition, WorkoutSession } from '../domain/types'
import { fromExerciseDocument, fromSessionDocument, toExerciseDocument, toSessionDocument } from './mappers'
import type { CloudAdapter, CloudRepository, CloudUser, ExerciseDocument, SessionDocument } from './types'

const owner = { _openid: '{openid}' }

export function createCloudRepository(adapter: CloudAdapter): CloudRepository {
  const listAll = async (collection: string, where: Record<string, unknown>) => {
    const all: Record<string, any>[] = []
    const limit = 20
    while (true) {
      const page = await adapter.list(collection, where, { limit, skip: all.length, orderBy: ['updatedAt', 'desc'] })
      all.push(...page)
      if (page.length < limit) return all
    }
  }

  return {
    async bootstrapUser() {
      const response = await adapter.callFunction('bootstrapUser')
      const user = (response.result as { user?: CloudUser } | undefined)?.user
      if (!user?.id) throw new Error('微信登录失败，请重新尝试')
      return user
    },
    async getUser() {
      const doc = await adapter.findOne('users', owner)
      if (!doc) return null
      return { id: doc._id, nickname: doc.nickname || '微信用户', avatarFileId: doc.avatarFileId ?? null, preferences: doc.preferences, lastLoginAt: doc.lastLoginAt }
    },
    async updateProfile(userId, data) {
      await adapter.update('users', userId, { ...data, updatedAt: adapter.serverDate() })
    },
    async listExercises(options = {}) {
      const where: Record<string, unknown> = { ...owner, deletedAt: null }
      if (options.since) where.updatedAt = { $gt: options.since }
      const docs = await listAll('exercise_library', where)
      return docs.map((doc) => fromExerciseDocument(doc as ExerciseDocument))
    },
    async saveExercise(exercise) {
      const existing = await adapter.findOne('exercise_library', { ...owner, clientExerciseId: exercise.id })
      const now = adapter.serverDate()
      if (existing?._id) await adapter.update('exercise_library', existing._id, { ...toExerciseDocument(exercise, now), createdAt: existing.createdAt })
      else await adapter.add('exercise_library', toExerciseDocument(exercise, now) as unknown as Record<string, unknown>)
    },
    async listSessions(options = {}) {
      const where: Record<string, unknown> = { ...owner, deletedAt: null }
      if (options.since) where.updatedAt = { $gt: options.since }
      const docs = await listAll('workout_sessions', where)
      return docs.map((doc) => fromSessionDocument(doc as SessionDocument))
    },
    async saveSession(session) {
      const existing = await adapter.findOne('workout_sessions', { ...owner, clientSessionId: session.id })
      const now = adapter.serverDate()
      if (existing?._id) await adapter.update('workout_sessions', existing._id, { ...toSessionDocument(session, now), createdAt: existing.createdAt })
      else await adapter.add('workout_sessions', toSessionDocument(session, now) as unknown as Record<string, unknown>)
    }
  }
}

import type { ExerciseDefinition, UserPreferences, WorkoutSession } from '../domain/types'

export interface CloudUser {
  id: string
  nickname: string
  avatarFileId: string | null
  preferences: UserPreferences
  lastLoginAt?: number
}

export interface SessionDocument {
  _id?: string
  _openid?: string
  clientSessionId: string
  date: string
  duration: number
  entries: WorkoutSession['entries']
  summary: { totalVolume: number; totalDistance: number; totalReps: number; completedSets: number }
  createdAt: unknown
  updatedAt: unknown
  deletedAt: null
  schemaVersion: 1
}

export interface ExerciseDocument extends ExerciseDefinition {
  _id?: string
  _openid?: string
  clientExerciseId: string
  createdAt: unknown
  updatedAt: unknown
  deletedAt: null | unknown
  schemaVersion: 1
}

export interface CloudAdapter {
  callFunction(name: string, data?: Record<string, unknown>): Promise<{ result?: unknown }>
  list(collection: string, where: Record<string, unknown>, options: { limit: number; skip: number; orderBy: [string, 'asc' | 'desc'] }): Promise<Record<string, any>[]>
  findOne(collection: string, where: Record<string, unknown>): Promise<Record<string, any> | null>
  add(collection: string, data: Record<string, unknown>): Promise<{ id?: string }>
  update(collection: string, id: string, data: Record<string, unknown>): Promise<void>
  serverDate(): unknown
}

export interface CloudRepository {
  bootstrapUser(): Promise<CloudUser>
  getUser(): Promise<CloudUser | null>
  updateProfile(userId: string, data: Partial<Pick<CloudUser, 'nickname' | 'avatarFileId' | 'preferences'>>): Promise<void>
  listExercises(options?: { since?: number }): Promise<ExerciseDefinition[]>
  saveExercise(exercise: ExerciseDefinition): Promise<void>
  deleteExercise(exerciseId: string): Promise<void>
  listSessions(options?: { since?: number }): Promise<WorkoutSession[]>
  saveSession(session: WorkoutSession): Promise<void>
}

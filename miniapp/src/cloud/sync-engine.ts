import type { BodyWeightRecord, ExerciseDefinition, WorkoutSession } from '../domain/types'

interface SyncStorage {
  get(key: string): unknown
  set(key: string, value: unknown): void
}

interface SessionRepository {
  saveSession(session: WorkoutSession): Promise<void>
  saveExercise?(exercise: ExerciseDefinition): Promise<void>
  deleteExercise?(exerciseId: string): Promise<void>
  saveWeightRecord?(record: BodyWeightRecord): Promise<void>
}

interface ExerciseDeletePayload { id: string }
type PendingPayload = WorkoutSession | ExerciseDefinition | ExerciseDeletePayload | BodyWeightRecord

interface PendingOperation {
  id: string
  type: 'session' | 'exercise' | 'exercise-delete' | 'weight'
  payload: PendingPayload
  attempts: number
  createdAt: number
}

function isPendingOperation(value: unknown): value is PendingOperation {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PendingOperation>
  return (candidate.type === 'session' || candidate.type === 'exercise' || candidate.type === 'exercise-delete' || candidate.type === 'weight') && typeof candidate.id === 'string' && !!candidate.payload
}

export function createSyncEngine(repository: SessionRepository, storage: SyncStorage, userId: string) {
  const storageKey = `zhu-li-pending-sync-v1:${userId}`
  const inFlight = new Set<Promise<unknown>>()
  let paused = false

  const readQueue = (): PendingOperation[] => {
    const stored = storage.get(storageKey)
    return Array.isArray(stored) ? stored.filter(isPendingOperation) : []
  }

  const writeQueue = (queue: PendingOperation[]) => storage.set(storageKey, queue)

  const queueOperation = (type: PendingOperation['type'], payload: PendingPayload) => {
    const queue = readQueue()
    const existing = queue.findIndex((item) => item.type === type && item.id === payload.id)
    if (existing >= 0) {
      queue[existing] = { ...queue[existing], payload, attempts: 0 }
      writeQueue(queue)
    } else {
      queue.push({ id: payload.id, type, payload, attempts: 0, createdAt: Date.now() })
      writeQueue(queue)
    }
  }

  const removeOperation = (type: PendingOperation['type'], id: string) => {
    const next = readQueue().filter((item) => item.type !== type || item.id !== id)
    writeQueue(next)
  }

  const track = <T,>(operation: () => Promise<T>): Promise<T> => {
    const promise = operation()
    inFlight.add(promise)
    void promise.then(() => inFlight.delete(promise), () => inFlight.delete(promise))
    return promise
  }

  return {
    async pushSession(session: WorkoutSession) {
      if (paused) { queueOperation('session', session); return false }
      try {
        await track(() => repository.saveSession(session))
        removeOperation('session', session.id)
        return true
      } catch {
        queueOperation('session', session)
        return false
      }
    },
    async pushExercise(exercise: ExerciseDefinition) {
      if (!repository.saveExercise) return
      if (paused) { queueOperation('exercise', exercise); return false }
      try {
        await track(() => repository.saveExercise!(exercise))
        removeOperation('exercise', exercise.id)
        return true
      } catch {
        queueOperation('exercise', exercise)
        return false
      }
    },
    async pushExerciseDelete(exerciseId: string) {
      if (!repository.deleteExercise) return
      if (paused) { queueOperation('exercise-delete', { id: exerciseId }); return false }
      try {
        await track(() => repository.deleteExercise!(exerciseId))
        removeOperation('exercise-delete', exerciseId)
        return true
      } catch {
        queueOperation('exercise-delete', { id: exerciseId })
        return false
      }
    },
    async pushWeightRecord(record: BodyWeightRecord) {
      if (!repository.saveWeightRecord) return
      if (paused) { queueOperation('weight', record); return false }
      try {
        await track(() => repository.saveWeightRecord!(record))
        removeOperation('weight', record.id)
        return true
      } catch {
        queueOperation('weight', record)
        return false
      }
    },
    async flush() {
      if (paused) return readQueue().length
      return track(async () => {
        const remaining: PendingOperation[] = []
        for (const operation of readQueue()) {
          try {
            if (operation.type === 'session') await repository.saveSession(operation.payload as WorkoutSession)
            else if (operation.type === 'exercise' && repository.saveExercise) await repository.saveExercise(operation.payload as ExerciseDefinition)
            else if (operation.type === 'exercise-delete' && repository.deleteExercise) await repository.deleteExercise((operation.payload as ExerciseDeletePayload).id)
            else if (operation.type === 'weight' && repository.saveWeightRecord) await repository.saveWeightRecord(operation.payload as BodyWeightRecord)
          } catch {
            remaining.push({ ...operation, attempts: operation.attempts + 1 })
          }
        }
        writeQueue(remaining)
        return remaining.length
      })
    },
    pendingCount() {
      return readQueue().length
    },
    async pauseAndDrain() {
      paused = true
      await Promise.all([...inFlight].map((promise) => promise.catch(() => undefined)))
      return () => { paused = false }
    }
  }
}

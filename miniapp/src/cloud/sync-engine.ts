import type { ExerciseDefinition, WorkoutSession } from '../domain/types'

interface SyncStorage {
  get(key: string): unknown
  set(key: string, value: unknown): void
}

interface SessionRepository {
  saveSession(session: WorkoutSession): Promise<void>
  saveExercise?(exercise: ExerciseDefinition): Promise<void>
}

type PendingPayload = WorkoutSession | ExerciseDefinition

interface PendingOperation {
  id: string
  type: 'session' | 'exercise'
  payload: PendingPayload
  attempts: number
  createdAt: number
}

function isPendingOperation(value: unknown): value is PendingOperation {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PendingOperation>
  return (candidate.type === 'session' || candidate.type === 'exercise') && typeof candidate.id === 'string' && !!candidate.payload
}

export function createSyncEngine(repository: SessionRepository, storage: SyncStorage, userId: string) {
  const storageKey = `zhu-li-pending-sync-v1:${userId}`

  const readQueue = (): PendingOperation[] => {
    const stored = storage.get(storageKey)
    return Array.isArray(stored) ? stored.filter(isPendingOperation) : []
  }

  const writeQueue = (queue: PendingOperation[]) => storage.set(storageKey, queue)

  const queueOperation = (type: PendingOperation['type'], payload: PendingPayload) => {
    const queue = readQueue()
    if (!queue.some((item) => item.type === type && item.id === payload.id)) {
      queue.push({ id: payload.id, type, payload, attempts: 0, createdAt: Date.now() })
      writeQueue(queue)
    }
  }

  return {
    async pushSession(session: WorkoutSession) {
      try {
        await repository.saveSession(session)
        return true
      } catch {
        queueOperation('session', session)
        return false
      }
    },
    async pushExercise(exercise: ExerciseDefinition) {
      if (!repository.saveExercise) return
      try {
        await repository.saveExercise(exercise)
        return true
      } catch {
        queueOperation('exercise', exercise)
        return false
      }
    },
    async flush() {
      const remaining: PendingOperation[] = []
      for (const operation of readQueue()) {
        try {
          if (operation.type === 'session') await repository.saveSession(operation.payload as WorkoutSession)
          else if (repository.saveExercise) await repository.saveExercise(operation.payload as ExerciseDefinition)
        } catch {
          remaining.push({ ...operation, attempts: operation.attempts + 1 })
        }
      }
      writeQueue(remaining)
      return remaining.length
    },
    pendingCount() {
      return readQueue().length
    }
  }
}

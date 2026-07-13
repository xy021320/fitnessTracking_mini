import { sanitizeNumber } from '../domain/exercises'
import type { ExerciseDefinition, WorkoutSession } from '../domain/types'
import type { ExerciseDocument, SessionDocument } from './types'

export function toSessionDocument(session: WorkoutSession, timestamp: unknown): SessionDocument {
  let totalVolume = 0
  let totalDistance = 0
  let totalReps = 0
  let completedSets = 0
  session.entries.forEach((entry) => {
    totalDistance += sanitizeNumber(entry.distance)
    totalReps += sanitizeNumber(entry.reps)
    ;(entry.sets ?? []).forEach((set) => {
      if (!set.completed) return
      completedSets += 1
      totalReps += sanitizeNumber(set.reps)
      totalVolume += sanitizeNumber(set.weight) * sanitizeNumber(set.reps)
    })
  })
  return {
    clientSessionId: session.id,
    date: session.date,
    duration: sanitizeNumber(session.duration),
    entries: session.entries.map((entry) => ({ ...entry, sets: entry.sets?.map((set) => ({ ...set })) })),
    summary: { totalVolume, totalDistance, totalReps, completedSets },
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    schemaVersion: 1
  }
}

export function fromSessionDocument(document: SessionDocument): WorkoutSession {
  return { id: document.clientSessionId, date: document.date, duration: document.duration, entries: document.entries }
}

export function toExerciseDocument(exercise: ExerciseDefinition, timestamp: unknown): ExerciseDocument {
  return { ...exercise, clientExerciseId: exercise.id, createdAt: timestamp, updatedAt: timestamp, deletedAt: null, schemaVersion: 1 }
}

export function fromExerciseDocument(document: ExerciseDocument): ExerciseDefinition {
  return { id: document.clientExerciseId, name: document.name, category: document.category, metrics: document.metrics, custom: document.custom }
}

import { sanitizeNumber } from './exercises'
import type { CurrentExercise, WorkoutEntry, WorkoutSession } from './types'

function toEntry(exercise: CurrentExercise): WorkoutEntry | null {
  const completedSets = (exercise.sets ?? []).filter((set) => set.completed)
  const values = exercise.values ?? {}
  const hasValues = exercise.completed === true
    && exercise.metrics.some((metric) => metric !== 'sets' && sanitizeNumber(values[metric]) > 0)
  if (completedSets.length === 0 && !hasValues) return null
  return {
    id: exercise.id, name: exercise.name, category: exercise.category,
    metrics: [...exercise.metrics], custom: exercise.custom,
    ...(completedSets.length ? { sets: completedSets.map((set) => ({ ...set })) } : {}),
    ...(sanitizeNumber(values.weight) ? { weight: sanitizeNumber(values.weight) } : {}),
    ...(sanitizeNumber(values.reps) ? { reps: sanitizeNumber(values.reps) } : {}),
    ...(sanitizeNumber(values.sets) ? { setsCount: sanitizeNumber(values.sets) } : {}),
    ...(sanitizeNumber(values.duration) ? { duration: sanitizeNumber(values.duration) } : {}),
    ...(sanitizeNumber(values.distance) ? { distance: sanitizeNumber(values.distance) } : {}),
    completed: true
  }
}

export function buildSession(state: { currentExercises: CurrentExercise[] }, date: string, duration: number, calories?: number, caloriesEstimated?: boolean): WorkoutSession {
  return {
    id: `session-${date}-${Date.now()}`,
    date,
    duration: sanitizeNumber(duration),
    entries: state.currentExercises.map(toEntry).filter((entry): entry is WorkoutEntry => Boolean(entry)),
    ...(calories == null ? {} : { calories: sanitizeNumber(calories), caloriesEstimated: caloriesEstimated !== false })
  }
}

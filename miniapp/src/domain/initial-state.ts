import { presetExercises } from './exercises'
import type { AppState } from './types'

export const initialAppState: AppState = {
  activeTab: 'home',
  workoutStarted: false,
  workoutStartedAt: null,
  exerciseLibrary: presetExercises,
  currentExercises: [
    { ...presetExercises[0], sets: [
      { weight: 60, reps: 10, completed: true },
      { weight: 80, reps: 8, completed: true },
      { weight: 80, reps: 8, completed: false }
    ] },
    { id: 'dumbbell-incline', name: '上斜哑铃卧推', category: 'strength', metrics: ['weight', 'reps', 'sets'], custom: false, sets: [
      { weight: 22.5, reps: 10, completed: false },
      { weight: 22.5, reps: 10, completed: false }
    ] }
  ],
  sessions: [
    { id: 'seed-strength', date: '2026-07-11', duration: 64, entries: [
      { ...presetExercises[0], sets: [
        { weight: 80, reps: 8, completed: true },
        { weight: 80, reps: 8, completed: true },
        { weight: 82.5, reps: 6, completed: true }
      ] }
    ] },
    { id: 'seed-run', date: '2026-07-09', duration: 30, entries: [
      { ...presetExercises[2], distance: 5, duration: 30, completed: true }
    ] },
    { id: 'seed-rope', date: '2026-07-07', duration: 18, entries: [
      { ...presetExercises[1], reps: 1200, duration: 12, completed: true }
    ] }
  ],
  weightRecords: [],
  preferences: { weightUnit: 'kg', distanceUnit: 'km', weeklyGoal: 4 }
}

export function createEmptyUserState(): AppState {
  return {
    activeTab: 'home',
    workoutStarted: false,
    workoutStartedAt: null,
    exerciseLibrary: presetExercises.map((exercise) => ({ ...exercise, metrics: [...exercise.metrics] })),
    currentExercises: [
      { ...presetExercises[0], metrics: [...presetExercises[0].metrics], sets: [{ weight: 0, reps: 0, completed: false }] }
    ],
    sessions: [],
    weightRecords: [],
    preferences: { weightUnit: 'kg', distanceUnit: 'km', weeklyGoal: 4 }
  }
}

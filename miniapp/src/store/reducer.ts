import { sanitizeNumber } from '../domain/exercises'
import { buildSession } from '../domain/sessions'
import type { AppState, ExerciseDefinition, MetricKey, WorkoutSession } from '../domain/types'

export type AppAction =
  | { type: 'START_WORKOUT'; startedAt: number }
  | { type: 'SELECT_TAB'; tab: AppState['activeTab'] }
  | { type: 'ADD_EXERCISE'; exercise: ExerciseDefinition }
  | { type: 'UPDATE_ENTRY_VALUE'; exerciseId: string; metric: MetricKey; value: number }
  | { type: 'ADD_SET'; exerciseId: string }
  | { type: 'UPDATE_SET'; exerciseId: string; setIndex: number; field: 'weight' | 'reps'; value: number }
  | { type: 'COMPLETE_SET'; exerciseId: string; setIndex: number }
  | { type: 'TOGGLE_EXERCISE_COMPLETE'; exerciseId: string }
  | { type: 'REMOVE_EXERCISE'; exerciseId: string }
  | { type: 'COMPLETE_WORKOUT'; date: string; duration: number; session?: WorkoutSession }
  | { type: 'UPDATE_PREFERENCES'; weeklyGoal: number }
  | { type: 'HYDRATE'; state: AppState }

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START_WORKOUT':
      return {
        ...state,
        activeTab: 'training',
        workoutStarted: true,
        workoutStartedAt: state.workoutStartedAt ?? action.startedAt
      }
    case 'SELECT_TAB':
      return { ...state, activeTab: action.tab }
    case 'ADD_EXERCISE': {
      const exists = state.exerciseLibrary.some((item) => item.id === action.exercise.id)
      return {
        ...state,
        exerciseLibrary: exists ? state.exerciseLibrary : [...state.exerciseLibrary, action.exercise],
        currentExercises: [...state.currentExercises, {
          ...action.exercise,
          ...(action.exercise.metrics.includes('sets') && action.exercise.metrics.includes('reps')
            ? { sets: [{ weight: 0, reps: 0, completed: false }] }
            : { values: {}, completed: false })
        }]
      }
    }
    case 'UPDATE_ENTRY_VALUE':
      return { ...state, currentExercises: state.currentExercises.map((exercise) => exercise.id === action.exerciseId
        ? { ...exercise, values: { ...exercise.values, [action.metric]: sanitizeNumber(action.value) } }
        : exercise) }
    case 'ADD_SET':
      return { ...state, currentExercises: state.currentExercises.map((exercise) => exercise.id === action.exerciseId
        ? { ...exercise, sets: [...(exercise.sets ?? []), { weight: 0, reps: 0, completed: false }] }
        : exercise) }
    case 'UPDATE_SET':
      return { ...state, currentExercises: state.currentExercises.map((exercise) => exercise.id === action.exerciseId
        ? { ...exercise, sets: (exercise.sets ?? []).map((set, index) => index === action.setIndex ? { ...set, [action.field]: sanitizeNumber(action.value) } : set) }
        : exercise) }
    case 'COMPLETE_SET':
      return { ...state, currentExercises: state.currentExercises.map((exercise) => exercise.id === action.exerciseId
        ? { ...exercise, sets: (exercise.sets ?? []).map((set, index) => index === action.setIndex ? { ...set, completed: !set.completed } : set) }
        : exercise) }
    case 'TOGGLE_EXERCISE_COMPLETE':
      return { ...state, currentExercises: state.currentExercises.map((exercise) => exercise.id === action.exerciseId && !exercise.sets
        ? { ...exercise, completed: !exercise.completed }
        : exercise) }
    case 'REMOVE_EXERCISE':
      return { ...state, currentExercises: state.currentExercises.filter((exercise) => exercise.id !== action.exerciseId) }
    case 'COMPLETE_WORKOUT': {
      const session = action.session ?? buildSession(state, action.date, action.duration)
      if (session.entries.length === 0) return state
      return { ...state, activeTab: 'data', workoutStarted: false, workoutStartedAt: null, sessions: [...state.sessions, session] }
    }
    case 'UPDATE_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, weeklyGoal: Math.max(1, Math.round(action.weeklyGoal)) } }
    case 'HYDRATE':
      return action.state
    default:
      return state
  }
}

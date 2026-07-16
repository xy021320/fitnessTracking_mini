export type MetricKey = 'weight' | 'reps' | 'sets' | 'duration' | 'distance'
export type ExerciseCategory = 'strength' | 'cardio' | 'conditioning' | 'mobility' | 'custom'

export interface ExerciseDefinition {
  id: string
  name: string
  category: ExerciseCategory
  metrics: MetricKey[]
  custom: boolean
}

export interface ExerciseSet {
  weight: number
  reps: number
  completed: boolean
}

export interface CurrentExercise extends ExerciseDefinition {
  sets?: ExerciseSet[]
  values?: Partial<Record<MetricKey, number>>
  completed?: boolean
}

export interface WorkoutEntry extends ExerciseDefinition {
  sets?: ExerciseSet[]
  weight?: number
  reps?: number
  setsCount?: number
  duration?: number
  distance?: number
  completed?: boolean
}

export interface WorkoutSession {
  id: string
  date: string
  duration: number
  entries: WorkoutEntry[]
}

export interface ProjectAnalytics {
  id: string
  name: string
  category: ExerciseCategory
  sessions: number
  volume: number
  distance: number
  duration: number
  reps: number
  maxWeight: number
  latestDate: string
}

export interface AnalyticsResult {
  sessionCount: number
  totalDuration: number
  totalVolume: number
  totalDistance: number
  averagePace: number
  projects: ProjectAnalytics[]
  trend: Array<{ date: string; volume: number; distance: number }>
}

export interface AppState {
  activeTab: 'home' | 'training' | 'data' | 'profile'
  workoutStarted: boolean
  workoutStartedAt: number | null
  exerciseLibrary: ExerciseDefinition[]
  currentExercises: CurrentExercise[]
  sessions: WorkoutSession[]
  preferences: { weightUnit: 'kg'; distanceUnit: 'km'; weeklyGoal: number }
}

import type { ExerciseCategory, ExerciseDefinition, MetricKey } from './types'

const allowedMetrics = new Set<MetricKey>(['weight', 'reps', 'sets', 'duration', 'distance'])

export const metricLabels: Record<MetricKey, string> = {
  weight: '重量', reps: '次数', sets: '组数', duration: '时长', distance: '距离'
}

export const presetExercises: ExerciseDefinition[] = [
  { id: 'barbell-bench', name: '杠铃卧推', category: 'strength', metrics: ['weight', 'reps', 'sets'], custom: false },
  { id: 'jump-rope', name: '跳绳', category: 'cardio', metrics: ['reps', 'duration'], custom: false },
  { id: 'outdoor-run', name: '户外跑步', category: 'cardio', metrics: ['distance', 'duration'], custom: false },
  { id: 'plank', name: '平板支撑', category: 'conditioning', metrics: ['duration', 'sets'], custom: false }
]

interface CreateExerciseInput {
  id?: string
  name: string
  category?: ExerciseCategory
  metrics: MetricKey[]
  custom?: boolean
}

export function sanitizeNumber(value: unknown): number {
  return Math.max(0, Number(value) || 0)
}

export function createExercise(input: CreateExerciseInput): ExerciseDefinition {
  const name = input.name?.trim()
  if (!name) throw new Error('请输入项目名称')
  const metrics = [...new Set(input.metrics ?? [])].filter((metric) => allowedMetrics.has(metric))
  if (metrics.length === 0) throw new Error('请至少选择一个记录指标')
  return {
    id: input.id ?? `custom-${Date.now()}`,
    name,
    category: input.category ?? 'custom',
    metrics,
    custom: input.custom ?? !input.id
  }
}

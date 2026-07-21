import { sanitizeNumber } from './exercises'
import type { BodyWeightRecord, ExerciseCategory } from './types'

const MET: Record<ExerciseCategory, number> = {
  strength: 6,
  cardio: 8,
  conditioning: 7,
  mobility: 3,
  custom: 5
}

export function estimateCalories(input: { duration: number; weightKg: number; entries: Array<{ category: ExerciseCategory }> }): number {
  const mets = input.entries.map((entry) => MET[entry.category] ?? MET.custom)
  const averageMet = mets.length ? mets.reduce((sum, value) => sum + value, 0) / mets.length : MET.custom
  return Math.round(averageMet * 3.5 * sanitizeNumber(input.weightKg) / 200 * sanitizeNumber(input.duration))
}

export function weightForDate(records: BodyWeightRecord[] = [], date: string): { weightKg: number; fallback: boolean } {
  const record = [...records]
    .filter((item) => item.date <= date && item.weightKg > 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  return record ? { weightKg: record.weightKg, fallback: false } : { weightKg: 70, fallback: true }
}

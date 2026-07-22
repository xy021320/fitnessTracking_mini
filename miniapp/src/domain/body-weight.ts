import type { BodyWeightRecord } from './types'

export function normalizeWeightKg(value: unknown): number {
  const weight = Math.round(Number(value) * 10) / 10
  if (!(weight > 0 && weight <= 500)) throw new Error('请输入有效体重')
  return weight
}

export function bodyWeightSummary(records: BodyWeightRecord[]) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted.length ? sorted[sorted.length - 1] : null
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null
  const first = sorted[0] ?? null
  const difference = (from: BodyWeightRecord | null, to: BodyWeightRecord | null) => from && to
    ? Math.round((to.weightKg - from.weightKg) * 10) / 10
    : null
  return {
    latest,
    previousChange: difference(previous, latest),
    totalChange: difference(first, latest),
    records: sorted
  }
}

export function kgToDisplay(weightKg: number, unit: 'kg' | 'lb'): number {
  return Math.round((unit === 'lb' ? weightKg * 2.2046226218 : weightKg) * 10) / 10
}

export function displayToKg(value: unknown, unit: 'kg' | 'lb'): number {
  return normalizeWeightKg(Number(value) / (unit === 'lb' ? 2.2046226218 : 1))
}

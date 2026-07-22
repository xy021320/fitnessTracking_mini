import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { createExercise, sanitizeNumber } = require('../dist-test/domain/exercises.js')
const { deriveAnalytics } = require('../dist-test/domain/analytics.js')
const { buildSession } = require('../dist-test/domain/sessions.js')
const { estimateCalories, weightForDate } = require('../dist-test/domain/calories.js')
const { bodyWeightSummary, normalizeWeightKg } = require('../dist-test/domain/body-weight.js')
const { localDateString } = require('../dist-test/domain/date.js')

test('calories use category MET body weight and duration', () => {
  assert.equal(estimateCalories({ duration: 30, weightKg: 70, entries: [{ category: 'strength' }] }), 221)
  assert.equal(estimateCalories({ duration: 30, weightKg: 70, entries: [{ category: 'cardio' }] }), 294)
})

test('mixed workouts average category MET values', () => {
  assert.equal(estimateCalories({ duration: 30, weightKg: 70, entries: [{ category: 'strength' }, { category: 'cardio' }] }), 257)
})

test('weight lookup uses latest record on or before date then fallback', () => {
  const records = [{ id: 'w1', date: '2026-07-10', weightKg: 80 }, { id: 'w2', date: '2026-07-12', weightKg: 79 }]
  assert.deepEqual(weightForDate(records, '2026-07-11'), { weightKg: 80, fallback: false })
  assert.deepEqual(weightForDate([], '2026-07-11'), { weightKg: 70, fallback: true })
})

test('weight summary reports previous and total change', () => {
  const summary = bodyWeightSummary([
    { id: 'a', date: '2026-07-01', weightKg: 82 },
    { id: 'b', date: '2026-07-10', weightKg: 81 },
    { id: 'c', date: '2026-07-20', weightKg: 80.5 }
  ])
  assert.equal(summary.latest.weightKg, 80.5)
  assert.equal(summary.previousChange, -0.5)
  assert.equal(summary.totalChange, -1.5)
  assert.equal(normalizeWeightKg(79.56), 79.6)
  assert.throws(() => normalizeWeightKg(501), /请输入有效体重/)
})

test('local training date does not use UTC day', () => {
  const date = new Date(2026, 6, 21, 0, 30)
  assert.equal(localDateString(date), '2026-07-21')
})

test('exercise metrics are composable and validated', () => {
  assert.deepEqual(createExercise({ name: '  壶铃摆动  ', metrics: ['weight', 'reps', 'reps'] }).metrics, ['weight', 'reps'])
  assert.throws(() => createExercise({ name: '', metrics: ['reps'] }), /请输入项目名称/)
  assert.throws(() => createExercise({ name: '划船机', metrics: [] }), /至少选择一个记录指标/)
  assert.equal(sanitizeNumber(-3), 0)
})

test('analytics only counts completed values', () => {
  const result = deriveAnalytics([{ id: 's1', date: '2026-07-13', duration: 30, entries: [
    { id: 'bench', name: '卧推', category: 'strength', metrics: ['weight', 'reps', 'sets'], sets: [
      { weight: 80, reps: 8, completed: true },
      { weight: 90, reps: 5, completed: false }
    ] },
    { id: 'run', name: '跑步', category: 'cardio', metrics: ['distance', 'duration'], distance: 5, duration: 25, completed: true }
  ] }])
  assert.equal(result.totalVolume, 640)
  assert.equal(result.totalDistance, 5)
  assert.equal(result.averagePace, 5)
})

test('session builder keeps completed entries as snapshots', () => {
  const session = buildSession({ currentExercises: [
    { id: 'rope', name: '跳绳', category: 'cardio', metrics: ['reps', 'duration'], custom: false, values: { reps: 600, duration: 8 }, completed: true }
  ] }, '2026-07-13', 18)
  assert.equal(session.entries[0].reps, 600)
  assert.equal(session.duration, 18)
})

test('session excludes unfinished value-based exercises', () => {
  const exercise = {
    id: 'run', name: '跑步', category: 'cardio', metrics: ['distance'], custom: true,
    values: { distance: 5 }, completed: false
  }
  assert.equal(buildSession({ currentExercises: [exercise] }, '2026-07-16', 30).entries.length, 0)
  assert.equal(buildSession({ currentExercises: [{ ...exercise, completed: true }] }, '2026-07-16', 30).entries.length, 1)
})

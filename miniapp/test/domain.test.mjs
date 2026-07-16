import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { createExercise, sanitizeNumber } = require('../dist-test/domain/exercises.js')
const { deriveAnalytics } = require('../dist-test/domain/analytics.js')
const { buildSession } = require('../dist-test/domain/sessions.js')

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

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { loadState, loadUserState, saveState, saveUserState, STORAGE_KEY } = require('../dist-test/store/storage.js')
const { appReducer } = require('../dist-test/store/reducer.js')
const { createEmptyUserState, initialAppState } = require('../dist-test/domain/initial-state.js')
const { elapsedMinutes, formatElapsed } = require('../dist-test/domain/workout-timer.js')

test('invalid persisted state falls back safely', () => {
  assert.deepEqual(loadState({ getStorageSync: () => ({ bad: true }) }, initialAppState), initialAppState)
})

test('storage writes the versioned key and swallows platform errors', () => {
  let key = ''
  saveState({ setStorageSync: (nextKey) => { key = nextKey } }, initialAppState)
  assert.equal(key, STORAGE_KEY)
  assert.doesNotThrow(() => saveState({ setStorageSync: () => { throw new Error('full') } }, initialAppState))
})

test('cloud users have isolated local caches', () => {
  const values = new Map()
  const storage = {
    getStorageSync: (key) => values.get(key),
    setStorageSync: (key, value) => values.set(key, value)
  }
  saveUserState(storage, 'user-a', initialAppState)
  assert.equal(loadUserState(storage, 'user-a', { ...initialAppState, sessions: [] }).sessions.length, initialAppState.sessions.length)
  assert.equal(loadUserState(storage, 'user-b', { ...initialAppState, sessions: [] }).sessions.length, 0)
})

test('completing workout appends a snapshot and selects data', () => {
  const next = appReducer(initialAppState, { type: 'COMPLETE_WORKOUT', date: '2026-07-13', duration: 18 })
  assert.equal(next.activeTab, 'data')
  assert.equal(next.sessions.at(-1).date, '2026-07-13')
})

test('formats real workout elapsed time and rounds completed duration up', () => {
  assert.equal(formatElapsed(1_000, 66_000), '01:05')
  assert.equal(elapsedMinutes(1_000, 66_000), 2)
})

test('starting twice preserves the original timestamp', () => {
  const started = appReducer(createEmptyUserState(), { type: 'START_WORKOUT', startedAt: 1_000 })
  const resumed = appReducer(started, { type: 'START_WORKOUT', startedAt: 5_000 })
  assert.equal(resumed.workoutStartedAt, 1_000)
})

test('removing an exercise keeps the timer and exercise library', () => {
  const state = { ...createEmptyUserState(), workoutStartedAt: 1_000 }
  const exerciseId = state.currentExercises[0].id
  const next = appReducer(state, { type: 'REMOVE_EXERCISE', exerciseId })
  assert.equal(next.currentExercises.some((item) => item.id === exerciseId), false)
  assert.equal(next.exerciseLibrary.some((item) => item.id === exerciseId), true)
  assert.equal(next.workoutStartedAt, 1_000)
})

test('value-based exercise completion can be toggled', () => {
  const state = appReducer(createEmptyUserState(), {
    type: 'ADD_EXERCISE',
    exercise: { id: 'run', name: '跑步', category: 'cardio', metrics: ['distance', 'duration'], custom: true }
  })
  const done = appReducer(state, { type: 'TOGGLE_EXERCISE_COMPLETE', exerciseId: 'run' })
  assert.equal(done.currentExercises.find((item) => item.id === 'run').completed, true)
  const undone = appReducer(done, { type: 'TOGGLE_EXERCISE_COMPLETE', exerciseId: 'run' })
  assert.equal(undone.currentExercises.find((item) => item.id === 'run').completed, false)
})

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { loadState, saveState, STORAGE_KEY } = require('../dist-test/store/storage.js')
const { appReducer } = require('../dist-test/store/reducer.js')
const { initialAppState } = require('../dist-test/domain/initial-state.js')

test('invalid persisted state falls back safely', () => {
  assert.deepEqual(loadState({ getStorageSync: () => ({ bad: true }) }, initialAppState), initialAppState)
})

test('storage writes the versioned key and swallows platform errors', () => {
  let key = ''
  saveState({ setStorageSync: (nextKey) => { key = nextKey } }, initialAppState)
  assert.equal(key, STORAGE_KEY)
  assert.doesNotThrow(() => saveState({ setStorageSync: () => { throw new Error('full') } }, initialAppState))
})

test('completing workout appends a snapshot and selects data', () => {
  const next = appReducer(initialAppState, { type: 'COMPLETE_WORKOUT', date: '2026-07-13', duration: 18 })
  assert.equal(next.activeTab, 'data')
  assert.equal(next.sessions.at(-1).date, '2026-07-13')
})

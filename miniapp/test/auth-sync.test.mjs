import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { authReducer, initialAuthState } = require('../dist-test/auth/auth-reducer.js')
const { createSyncEngine } = require('../dist-test/cloud/sync-engine.js')

test('auth starts locked and becomes authenticated after bootstrap', () => {
  const ready = authReducer(initialAuthState, { type: 'INIT_READY' })
  const loading = authReducer(ready, { type: 'LOGIN_START' })
  const authenticated = authReducer(loading, { type: 'LOGIN_SUCCESS', user: { id: 'u1', nickname: '微信用户', avatarFileId: null, preferences: { weeklyGoal: 4, weightUnit: 'kg', distanceUnit: 'km' } } })
  assert.equal(ready.status, 'anonymous')
  assert.equal(loading.status, 'authenticating')
  assert.equal(authenticated.status, 'authenticated')
  assert.equal(authenticated.user.id, 'u1')
})

test('failed session write is queued and retried once', async () => {
  const values = new Map()
  const storage = { get: (key) => values.get(key), set: (key, value) => values.set(key, value) }
  let offline = true
  const repository = { saveSession: async () => { if (offline) throw new Error('offline') } }
  const engine = createSyncEngine(repository, storage, 'u1')
  const session = { id: 'session-1', date: '2026-07-13', duration: 20, entries: [] }
  assert.equal(await engine.pushSession(session), false)
  assert.equal(engine.pendingCount(), 1)
  offline = false
  await engine.flush()
  assert.equal(engine.pendingCount(), 0)
})

test('pending queues are isolated by cloud user id', async () => {
  const values = new Map()
  const storage = { get: (key) => values.get(key), set: (key, value) => values.set(key, value) }
  const repository = { saveSession: async () => { throw new Error('offline') } }
  await createSyncEngine(repository, storage, 'user-a').pushSession({ id: 'a', date: '', duration: 0, entries: [] })
  assert.equal(createSyncEngine(repository, storage, 'user-b').pendingCount(), 0)
})

test('failed weight write is queued and retried', async () => {
  const values = new Map()
  const storage = { get: (key) => values.get(key), set: (key, value) => values.set(key, value) }
  let offline = true
  const repository = {
    saveSession: async () => undefined,
    saveWeightRecord: async () => { if (offline) throw new Error('offline') }
  }
  const engine = createSyncEngine(repository, storage, 'u1')
  assert.equal(await engine.pushWeightRecord({ id: 'weight-2026-07-21', date: '2026-07-21', weightKg: 80 }), false)
  offline = false
  await engine.flush()
  assert.equal(engine.pendingCount(), 0)
})

test('queued daily weight uses latest value and successful push clears stale queue', async () => {
  const values = new Map()
  const storage = { get: (key) => values.get(key), set: (key, value) => values.set(key, value) }
  let offline = true
  const saved = []
  const repository = {
    saveSession: async () => undefined,
    saveWeightRecord: async (record) => { if (offline) throw new Error('offline'); saved.push(record) }
  }
  const engine = createSyncEngine(repository, storage, 'u1')
  await engine.pushWeightRecord({ id: 'weight-2026-07-21', date: '2026-07-21', weightKg: 80 })
  await engine.pushWeightRecord({ id: 'weight-2026-07-21', date: '2026-07-21', weightKg: 79 })
  offline = false
  await engine.flush()
  assert.equal(saved[0].weightKg, 79)
  assert.equal(engine.pendingCount(), 0)
})

test('deletion barrier waits for in-flight writes and pauses new writes', async () => {
  let finish
  let calls = 0
  const repository = { saveSession: () => { calls += 1; return new Promise((resolve) => { finish = resolve }) } }
  const storage = { get: () => [], set: () => undefined }
  const engine = createSyncEngine(repository, storage, 'u1')
  const pushing = engine.pushSession({ id: 's1', date: '2026-07-21', duration: 10, entries: [] })
  let drained = false
  const barrier = engine.pauseAndDrain().then(() => { drained = true })
  await Promise.resolve()
  assert.equal(drained, false)
  finish()
  await pushing
  await barrier
  await engine.pushSession({ id: 's2', date: '2026-07-21', duration: 10, entries: [] })
  assert.equal(calls, 1)
})

test('deletion barrier waits for an in-flight offline queue flush', async () => {
  let finish
  const values = new Map([['zhu-li-pending-sync-v1:u1', [{
    id: 's1', type: 'session', payload: { id: 's1', date: '2026-07-21', duration: 10, entries: [] }, attempts: 0, createdAt: 1
  }]]])
  const storage = { get: (key) => values.get(key), set: (key, value) => values.set(key, value) }
  const repository = { saveSession: () => new Promise((resolve) => { finish = resolve }) }
  const engine = createSyncEngine(repository, storage, 'u1')
  const flushing = engine.flush()
  let drained = false
  const barrier = engine.pauseAndDrain().then(() => { drained = true })
  await Promise.resolve()
  assert.equal(drained, false)
  finish()
  await flushing
  await barrier
  assert.equal(engine.pendingCount(), 0)
})

test('account deletion keeps user until success then returns anonymous', () => {
  const user = { id: 'u1', nickname: '微信用户', avatarFileId: null, preferences: { weeklyGoal: 4, weightUnit: 'kg', distanceUnit: 'km' } }
  const authenticated = authReducer(initialAuthState, { type: 'LOGIN_SUCCESS', user })
  const deleting = authReducer(authenticated, { type: 'DELETE_ACCOUNT_START' })
  assert.equal(deleting.user.id, 'u1')
  assert.equal(deleting.deletingAccount, true)
  const deleted = authReducer(deleting, { type: 'DELETE_ACCOUNT_SUCCESS' })
  assert.equal(deleted.status, 'anonymous')
  assert.equal(deleted.user, null)
})

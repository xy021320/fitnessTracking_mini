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

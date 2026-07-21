import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { toSessionDocument, fromSessionDocument } = require('../dist-test/cloud/mappers.js')
const { createCloudRepository } = require('../dist-test/cloud/repository.js')

const session = {
  id: 'session-client-1', date: '2026-07-13', duration: 30,
  entries: [{ id: 'bench', name: '卧推', category: 'strength', custom: false, metrics: ['weight', 'reps', 'sets'], sets: [
    { weight: 80, reps: 8, completed: true },
    { weight: 90, reps: 5, completed: false }
  ] }]
}

test('session documents contain summaries and client identity', () => {
  const doc = toSessionDocument(session, 123)
  assert.equal(doc.clientSessionId, session.id)
  assert.equal(doc.summary.totalVolume, 640)
  assert.equal(doc.summary.completedSets, 1)
  assert.equal(doc.schemaVersion, 1)
  assert.equal(fromSessionDocument({ ...doc, _id: 'cloud-1' }).id, session.id)
})

test('repository queries only the current user and paginates by 20', async () => {
  const calls = []
  const adapter = {
    callFunction: async () => ({ result: { user: { id: 'u1', nickname: '微信用户' } } }),
    list: async (collection, where, options) => { calls.push({ collection, where, options }); return [] },
    findOne: async () => null,
    add: async () => ({ id: 'new' }), update: async () => undefined,
    serverDate: () => ({ $date: true })
  }
  const repository = createCloudRepository(adapter)
  await repository.listSessions({ since: 1000 })
  assert.deepEqual(calls[0], {
    collection: 'workout_sessions',
    where: { _openid: '{openid}', updatedAt: { $gt: 1000 }, deletedAt: null },
    options: { limit: 20, skip: 0, orderBy: ['updatedAt', 'desc'] }
  })
})

test('repository loads every 20-document page', async () => {
  const calls = []
  const docs = Array.from({ length: 20 }, (_, index) => ({
    clientSessionId: `s-${index}`, date: '2026-07-13', duration: 1, entries: []
  }))
  const adapter = {
    callFunction: async () => ({ result: {} }),
    list: async (_collection, _where, options) => { calls.push(options); return options.skip === 0 ? docs : [] },
    findOne: async () => null, add: async () => ({}), update: async () => undefined, serverDate: () => 1
  }
  const sessions = await createCloudRepository(adapter).listSessions()
  assert.equal(sessions.length, 20)
  assert.deepEqual(calls.map((call) => call.skip), [0, 20])
})

test('repository de-duplicates sessions by clientSessionId', async () => {
  let adds = 0
  const adapter = {
    callFunction: async () => ({ result: {} }), list: async () => [],
    findOne: async () => ({ _id: 'existing' }), add: async () => { adds += 1 },
    update: async () => undefined, serverDate: () => 123
  }
  await createCloudRepository(adapter).saveSession(session)
  assert.equal(adds, 0)
})

test('repository soft deletes an exercise document', async () => {
  const updates = []
  const adapter = {
    callFunction: async () => ({ result: {} }), list: async () => [],
    findOne: async () => ({ _id: 'cloud-exercise' }),
    add: async () => ({}),
    update: async (...args) => { updates.push(args) },
    serverDate: () => 123
  }
  await createCloudRepository(adapter).deleteExercise('custom-1')
  assert.deepEqual(updates[0], ['exercise_library', 'cloud-exercise', { deletedAt: 123, updatedAt: 123 }])
})

test('repository delegates weight upsert to owner-scoped cloud function', async () => {
  const calls = []
  const adapter = {
    callFunction: async (...args) => { calls.push(args); return { result: { saved: true } } }, list: async () => [],
    findOne: async () => null, add: async () => ({}), update: async () => undefined, serverDate: () => 123
  }
  await createCloudRepository(adapter).saveWeightRecord({ id: 'weight-2026-07-21', date: '2026-07-21', weightKg: 79.5 })
  assert.deepEqual(calls[0], ['upsertWeightRecord', { record: { id: 'weight-2026-07-21', date: '2026-07-21', weightKg: 79.5 } }])
})

test('repository de-duplicates legacy weight documents using latest client update', async () => {
  const adapter = {
    callFunction: async () => ({ result: {} }),
    list: async (collection) => collection === 'body_weight_records' ? [
      { clientWeightId: 'old', date: '2026-07-21', weightKg: 80, clientUpdatedAt: 1 },
      { clientWeightId: 'new', date: '2026-07-21', weightKg: 79, clientUpdatedAt: 2 }
    ] : [],
    findOne: async () => null, add: async () => ({}), update: async () => undefined, serverDate: () => 123
  }
  const records = await createCloudRepository(adapter).listWeightRecords()
  assert.equal(records.length, 1)
  assert.equal(records[0].weightKg, 79)
})

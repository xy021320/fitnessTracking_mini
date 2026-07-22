import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { upsertWeightRecord } = require('../cloudfunctions/upsertWeightRecord/index.js')

test('weight upsert derives deterministic owner/date document id from OPENID', async () => {
  const writes = []
  await upsertWeightRecord({ record: { id: 'weight-2026-07-21', date: '2026-07-21', weightKg: 79.5, updatedAt: 123 } }, {}, {
    getWXContext: () => ({ OPENID: 'owner-1' }),
    documentId: (openid, date) => `${openid}:${date}`,
    upsertWeight: async (id, data) => { writes.push([id, data]); return true },
    deleteLegacy: async () => undefined,
    now: () => 456
  })
  assert.equal(writes[0][0], 'owner-1:2026-07-21')
  assert.equal(writes[0][1]._openid, 'owner-1')
  assert.equal(writes[0][1].clientUpdatedAt, 123)
})

test('older cross-device weight cannot overwrite a newer cloud value', async () => {
  let applied
  const result = await upsertWeightRecord({ record: { id: 'old', date: '2026-07-21', weightKg: 80, updatedAt: 100 } }, {}, {
    getWXContext: () => ({ OPENID: 'owner-1' }), documentId: () => 'doc-1', now: () => 200,
    upsertWeight: async (_id, data) => { applied = data.clientUpdatedAt > 150; return applied },
    deleteLegacy: async () => undefined
  })
  assert.equal(applied, false)
  assert.equal(result.applied, false)
})

test('newer legacy weight wins over an older offline request during migration', async () => {
  let written
  await upsertWeightRecord({ record: { id: 'old-offline', date: '2026-07-21', weightKg: 80, updatedAt: 100 } }, {}, {
    getWXContext: () => ({ OPENID: 'owner-1' }), documentId: () => 'stable-doc', now: () => 300,
    listWeights: async () => [{ _id: 'legacy-doc', date: '2026-07-21', weightKg: 79, clientUpdatedAt: 200, clientWeightId: 'newer-legacy' }],
    upsertWeight: async (_id, data) => { written = data; return true },
    deleteLegacy: async () => undefined
  })
  assert.equal(written.weightKg, 79)
  assert.equal(written.clientUpdatedAt, 200)
  assert.equal(written.clientWeightId, 'newer-legacy')
})

test('weight upsert rejects invalid input before writing', async () => {
  await assert.rejects(() => upsertWeightRecord({ record: { date: 'bad', weightKg: 800 } }, {}, {
    getWXContext: () => ({ OPENID: 'owner-1' })
  }), /体重记录无效/)
})

test('weight upsert rejects impossible calendar dates', async () => {
  await assert.rejects(() => upsertWeightRecord({ record: { date: '2026-99-99', weightKg: 80 } }, {}, {
    getWXContext: () => ({ OPENID: 'owner-1' })
  }), /体重记录无效/)
})

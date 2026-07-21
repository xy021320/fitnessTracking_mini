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
    setWeight: async (id, data) => writes.push([id, data]),
    now: () => 456
  })
  assert.equal(writes[0][0], 'owner-1:2026-07-21')
  assert.equal(writes[0][1]._openid, 'owner-1')
  assert.equal(writes[0][1].clientUpdatedAt, 123)
})

test('weight upsert rejects invalid input before writing', async () => {
  await assert.rejects(() => upsertWeightRecord({ record: { date: 'bad', weightKg: 800 } }, {}, {
    getWXContext: () => ({ OPENID: 'owner-1' })
  }), /体重记录无效/)
})

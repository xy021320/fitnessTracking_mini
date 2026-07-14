import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { bootstrap } = require('../cloudfunctions/bootstrapUser/index.js')

test('bootstrap creates one owner-scoped user without exposing openid', async () => {
  const rows = []
  const result = await bootstrap({}, {}, {
    getWXContext: () => ({ OPENID: 'openid-1' }),
    now: () => 123,
    findUser: async () => rows[0] ?? null,
    addUser: async (data) => { rows.push({ _id: 'user-1', ...data }); return 'user-1' },
    updateUser: async () => {}
  })
  assert.equal(rows[0]._openid, 'openid-1')
  assert.equal(result.user.id, 'user-1')
  assert.equal('openid' in result.user, false)
  assert.equal(result.user.preferences.weeklyGoal, 4)
})

test('bootstrap reuses the current WeChat user', async () => {
  let adds = 0
  const existing = { _id: 'user-1', nickname: '训练者', avatarFileId: null, preferences: { weeklyGoal: 5, weightUnit: 'kg', distanceUnit: 'km' } }
  const result = await bootstrap({}, {}, {
    getWXContext: () => ({ OPENID: 'openid-1' }),
    now: () => 456,
    findUser: async () => existing,
    addUser: async () => { adds += 1; return 'other' },
    updateUser: async () => {}
  })
  assert.equal(adds, 0)
  assert.equal(result.user.nickname, '训练者')
})

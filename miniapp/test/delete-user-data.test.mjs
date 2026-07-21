import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { deleteUserData } = require('../cloudfunctions/deleteUserData/index.js')

test('delete user data scopes every collection to OPENID', async () => {
  const calls = []
  const result = await deleteUserData({}, {}, {
    getWXContext: () => ({ OPENID: 'owner-1' }),
    findUser: async (openid) => ({ _id: 'u1', _openid: openid, avatarFileId: null }),
    deleteOwned: async (collection, openid) => calls.push([collection, openid]),
    deleteUser: async (id) => calls.push(['users', id]),
    deleteFiles: async () => undefined
  })
  assert.deepEqual(calls.slice(0, 3), [
    ['workout_sessions', 'owner-1'],
    ['exercise_library', 'owner-1'],
    ['body_weight_records', 'owner-1']
  ])
  assert.equal(result.deleted, true)
})

test('missing OPENID is rejected before any deletion', async () => {
  await assert.rejects(() => deleteUserData({}, {}, { getWXContext: () => ({}) }), /无法识别当前微信用户/)
})

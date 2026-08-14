import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { contentSecurityCheck } = require('../cloudfunctions/contentSecurityCheck/index.js')

test('text security passes current openid scene and trimmed content to WeChat API', async () => {
  const calls = []
  const result = await contentSecurityCheck({ type: 'text', content: '  壶铃摆动  ' }, {}, {
    getWXContext: () => ({ OPENID: 'openid-1' }),
    openapi: { security: { msgSecCheck: async (payload) => { calls.push(payload); return { errCode: 0 } } } }
  })

  assert.deepEqual(calls[0], { openid: 'openid-1', scene: 2, version: 2, content: '壶铃摆动' })
  assert.deepEqual(result, { pass: true, checked: true, errCode: 0 })
})

test('image security downloads the uploaded file and reports unsafe content', async () => {
  const calls = []
  const result = await contentSecurityCheck({ type: 'image', fileID: 'cloud://avatar.png' }, {}, {
    getWXContext: () => ({ OPENID: 'openid-1' }),
    downloadFile: async ({ fileID }) => {
      assert.equal(fileID, 'cloud://avatar.png')
      return { fileContent: Buffer.from('image-bytes') }
    },
    openapi: { security: { imgSecCheck: async (payload) => { calls.push(payload); return { errCode: 87014 } } } }
  })

  assert.equal(calls[0].media.contentType, 'image/png')
  assert.deepEqual(calls[0].media.value, Buffer.from('image-bytes'))
  assert.equal(result.pass, false)
  assert.equal(result.errCode, 87014)
})

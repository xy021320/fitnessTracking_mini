import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('project config targets the confirmed WeChat app', () => {
  const config = JSON.parse(readFileSync(new URL('../project.config.json', import.meta.url)))
  assert.equal(config.appid, 'wxcbad07e3fb2b6b8e')
  assert.equal(config.miniprogramRoot, 'dist/')
})

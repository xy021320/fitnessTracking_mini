import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('production output is importable by WeChat DevTools', () => {
  const config = JSON.parse(readFileSync(new URL('../dist/project.config.json', import.meta.url)))
  const app = JSON.parse(readFileSync(new URL('../dist/app.json', import.meta.url)))
  assert.equal(config.appid, 'wxcbad07e3fb2b6b8e')
  assert.deepEqual(app.pages, ['pages/home/index', 'pages/training/index', 'pages/data/index', 'pages/profile/index'])
  assert.equal(app.tabBar.list.length, 4)
})

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

test('project config targets the confirmed WeChat app', () => {
  const config = JSON.parse(readFileSync(new URL('../project.config.json', import.meta.url)))
  assert.equal(config.appid, 'wxcbad07e3fb2b6b8e')
  assert.equal(config.miniprogramRoot, 'dist/')
})

test('all native tabs have default and selected icons', () => {
  const config = readFileSync(new URL('../src/app.config.ts', import.meta.url), 'utf8')
  for (const name of ['home', 'training', 'data', 'profile']) {
    assert.match(config, new RegExp(`assets/tabbar/${name}\\.png`))
    assert.match(config, new RegExp(`assets/tabbar/${name}-active\\.png`))
    assert.equal(existsSync(new URL(`../src/assets/tabbar/${name}.png`, import.meta.url)), true)
    assert.equal(existsSync(new URL(`../src/assets/tabbar/${name}-active.png`, import.meta.url)), true)
  }
})

test('secondary profile pages are registered', () => {
  const config = readFileSync(new URL('../src/app.config.ts', import.meta.url), 'utf8')
  assert.match(config, /pages\/custom-projects\/index/)
  assert.match(config, /pages\/privacy\/index/)
})

test('privacy checks and official contract entry are enabled', () => {
  const config = readFileSync(new URL('../src/app.config.ts', import.meta.url), 'utf8')
  const gate = readFileSync(new URL('../src/components/auth-gate/index.tsx', import.meta.url), 'utf8')
  assert.match(config, /__usePrivacyCheck__/)
  assert.match(gate, /Taro\.openPrivacyContract/)
  assert.match(gate, /agreePrivacyAuthorization/)
  assert.match(gate, /请先阅读并同意隐私保护指引/)
})

test('component code is injected on demand', () => {
  const config = readFileSync(new URL('../src/app.config.ts', import.meta.url), 'utf8')
  assert.match(config, /lazyCodeLoading:\s*['"]requiredComponents['"]/)
})

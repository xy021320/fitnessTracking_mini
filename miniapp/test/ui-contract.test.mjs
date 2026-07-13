import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('training page keeps confirmed actions and removes rest timer', () => {
  const source = read('src/pages/training/index.tsx')
  assert.match(source, /添加项目/)
  assert.match(source, /完成训练/)
  assert.doesNotMatch(source, /休息|跳过/)
})

test('four confirmed pages expose their primary content', () => {
  assert.match(read('src/pages/home/index.tsx'), /开始训练/)
  assert.match(read('src/pages/data/index.tsx'), /总训练量|总距离/)
  assert.match(read('src/pages/profile/index.tsx'), /训练目标|单位偏好|自定义项目/)
})

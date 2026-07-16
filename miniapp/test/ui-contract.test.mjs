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

test('login gate and first-training empty state are present', () => {
  const auth = read('src/components/auth-gate/index.tsx')
  assert.match(auth, /微信登录/)
  assert.match(auth, /训练数据仅本人可见/)
  assert.match(auth, /重新尝试/)
  assert.match(read('src/pages/home/index.tsx'), /开始第一次训练/)
  assert.doesNotMatch(read('src/pages/home/index.tsx'), /7月 · 第3周/)
})

test('training actions are safe-area fixed and exercises are removable', () => {
  const page = read('src/pages/training/index.tsx')
  const logger = read('src/components/exercise-logger/index.tsx')
  const styles = read('src/pages/training/index.scss')
  assert.match(page, /formatElapsed/)
  assert.match(page, /showModal/)
  assert.match(page, /training-actions/)
  assert.match(logger, /删除/)
  assert.match(styles, /safe-area-inset-bottom/)
})

test('preset projects use explicit card content wrappers', () => {
  const sheet = read('src/components/add-exercise-sheet/index.tsx')
  assert.match(sheet, /preset-name/)
  assert.match(sheet, /preset-metrics/)
})

test('metric exercises expose project completion', () => {
  const logger = read('src/components/exercise-logger/index.tsx')
  assert.match(logger, /TOGGLE_EXERCISE_COMPLETE/)
  assert.match(logger, /完成本项目/)
  assert.match(logger, /已完成/)
})

test('both training actions share the fixed action bar', () => {
  const page = read('src/pages/training/index.tsx')
  const actions = page.slice(page.indexOf("className='training-actions'"))
  assert.match(actions, /添加项目/)
  assert.match(actions, /完成训练/)
  assert.match(read('src/pages/training/index.scss'), /--training-action-height/)
})

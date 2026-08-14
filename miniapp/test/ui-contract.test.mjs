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
  const home = read('src/pages/home/index.tsx')
  assert.match(auth, /微信登录/)
  assert.match(auth, /训练数据仅本人可见/)
  assert.match(auth, /重新尝试/)
  assert.match(home, /开始第一次训练/)
  assert.match(home, /先浏览功能/)
  assert.doesNotMatch(home, /<AuthGate>/)
  assert.doesNotMatch(home, /7月 · 第3周/)
})

test('user generated content is checked before saving', () => {
  assert.match(read('src/components/add-exercise-sheet/index.tsx'), /checkTextSecurity/)
  assert.match(read('src/components/exercise-editor/index.tsx'), /checkTextSecurity/)
  assert.match(read('src/components/profile-editor/index.tsx'), /checkTextSecurity/)
  assert.match(read('src/components/profile-editor/index.tsx'), /checkImageSecurity/)
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

test('profile editing uses explicit WeChat nickname and avatar controls', () => {
  const editor = read('src/components/profile-editor/index.tsx')
  assert.match(editor, /type='nickname'/)
  assert.match(editor, /openType='chooseAvatar'/)
  assert.match(editor, /cloud\.uploadFile/)
  assert.match(read('src/pages/profile/index.tsx'), /完善资料/)
})

test('profile menu rows have click actions', () => {
  const source = read('src/pages/profile/index.tsx')
  assert.match(source, /openSetting/)
  assert.match(source, /navigateTo/)
  assert.match(source, /训练提醒功能需要/)
})

test('profile secondary pages expose project management and privacy content', () => {
  const projects = read('src/pages/custom-projects/index.tsx')
  const privacy = read('src/pages/privacy/index.tsx')
  assert.match(projects, /自定义项目/)
  assert.match(projects, /DELETE_LIBRARY_EXERCISE/)
  assert.match(privacy, /身份与可见范围/)
  assert.match(privacy, /云端保存内容/)
})

test('app shell controls native tabbar from auth status', () => {
  const app = read('src/app.tsx')
  assert.match(app, /hideTabBar/)
  assert.match(app, /showTabBar/)
  assert.match(app, /authenticated.*offline/s)
})

test('workout completion exposes editable calories and data retains volume', () => {
  const training = read('src/pages/training/index.tsx')
  const data = read('src/pages/data/index.tsx')
  assert.match(training, /WorkoutSummary/)
  assert.match(training, /estimatedCalories/)
  assert.match(data, /总消耗/)
  assert.match(data, /总训练量/)
})

test('data page supports daily weight entry and trend', () => {
  const data = read('src/pages/data/index.tsx')
  assert.match(data, /WeightEntrySheet/)
  assert.match(data, /WeightTrend/)
  assert.match(data, /记录体重/)
})

test('privacy page provides official contract and permanent deletion', () => {
  const privacy = read('src/pages/privacy/index.tsx')
  assert.match(privacy, /Taro\.openPrivacyContract/)
  assert.match(privacy, /永久删除个人数据/)
  assert.match(privacy, /showModal/)
  assert.match(privacy, /deleteUserData/)
})

test('account deletion resets memory and drains sync before cloud deletion', () => {
  const store = read('src/store/app-store.tsx')
  const auth = read('src/auth/auth-store.tsx')
  assert.match(store, /loadedUserId/)
  assert.match(store, /!auth\.user.*return/s)
  assert.match(store, /registerDeleteBarrier/)
  assert.match(auth, /deleteBarrierRef\.current/)
})

test('workout summary freezes local date duration and calories at completion', () => {
  const training = read('src/pages/training/index.tsx')
  assert.match(training, /localDateString/)
  assert.match(training, /setCompletion/)
  assert.doesNotMatch(training, /toISOString/)
})

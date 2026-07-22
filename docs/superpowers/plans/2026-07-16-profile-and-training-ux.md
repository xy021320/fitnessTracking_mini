# Profile and Training UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-confirmed WeChat profile data, project-level completion, an overlap-free training action bar, and functional profile settings and management destinations.

**Architecture:** Keep workout completion and preference changes in the existing reducer so local persistence and cloud hydration remain consistent. Add focused Taro components for profile editing and quick settings, while complex custom-project and privacy content becomes registered secondary pages. Extend the existing repository and queued sync engine for custom-project edits and soft deletion.

**Tech Stack:** Taro 4.2.0, React 18.3.1, TypeScript 5.8.3, WeChat Cloud Development, Node test runner, SCSS.

## Global Constraints

- WeChat login must not claim to read a nickname automatically; nickname and avatar require an explicit user action.
- New runtime dependencies are not allowed.
- Training reminder remains informational and must not imply that notifications are active.
- Deleting a library project must not modify historical session snapshots or the current workout draft.
- Existing user-generated `miniapp/package-lock.json` and `miniapp/project.config.json` changes must not be included in commits.
- Every behavior change follows red-green-refactor and each task ends in a focused commit.

---

### Task 1: Project-level Completion and Session Filtering

**Files:**
- Modify: `miniapp/src/domain/types.ts`
- Modify: `miniapp/src/store/reducer.ts`
- Modify: `miniapp/src/domain/sessions.ts`
- Modify: `miniapp/test/reducer.test.mjs`
- Modify: `miniapp/test/domain.test.mjs`

**Interfaces:**
- Produces: `CurrentExercise.completed?: boolean`.
- Produces: `AppAction` variant `{ type: 'TOGGLE_EXERCISE_COMPLETE'; exerciseId: string }`.
- Produces: `buildSession()` behavior that includes value-based entries only when `completed === true`.
- Consumes: existing `sanitizeNumber()`, `COMPLETE_SET`, and `buildSession()`.

- [ ] **Step 1: Write failing reducer and session tests**

Add focused tests:

```js
test('value-based exercise completion can be toggled', () => {
  const state = appReducer(createEmptyUserState(), {
    type: 'ADD_EXERCISE',
    exercise: { id: 'run', name: '跑步', category: 'cardio', metrics: ['distance', 'duration'], custom: true }
  })
  const done = appReducer(state, { type: 'TOGGLE_EXERCISE_COMPLETE', exerciseId: 'run' })
  assert.equal(done.currentExercises.find((item) => item.id === 'run').completed, true)
  const undone = appReducer(done, { type: 'TOGGLE_EXERCISE_COMPLETE', exerciseId: 'run' })
  assert.equal(undone.currentExercises.find((item) => item.id === 'run').completed, false)
})

test('session excludes unfinished value-based exercises', () => {
  const base = {
    currentExercises: [{
      id: 'run', name: '跑步', category: 'cardio', metrics: ['distance'], custom: true,
      values: { distance: 5 }, completed: false
    }]
  }
  assert.equal(buildSession(base, '2026-07-16', 30).entries.length, 0)
  assert.equal(buildSession({
    currentExercises: [{ ...base.currentExercises[0], completed: true }]
  }, '2026-07-16', 30).entries.length, 1)
})
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
cd miniapp
npm test -- --test-name-pattern="value-based exercise|session excludes"
```

Expected: compilation or assertion failure because `TOGGLE_EXERCISE_COMPLETE` and the completion filter do not exist.

- [ ] **Step 3: Implement the minimal domain behavior**

Add the optional field:

```ts
export interface CurrentExercise extends ExerciseDefinition {
  sets?: ExerciseSet[]
  values?: Partial<Record<MetricKey, number>>
  completed?: boolean
}
```

Initialize value-based projects with `completed: false`, add the action, and toggle only non-set projects:

```ts
case 'TOGGLE_EXERCISE_COMPLETE':
  return {
    ...state,
    currentExercises: state.currentExercises.map((exercise) =>
      exercise.id === action.exerciseId && !exercise.sets
        ? { ...exercise, completed: !exercise.completed }
        : exercise
    )
  }
```

Require explicit completion for value entries in `toEntry()`:

```ts
const hasValues = exercise.completed === true
  && exercise.metrics.some((metric) => metric !== 'sets' && sanitizeNumber(values[metric]) > 0)
```

- [ ] **Step 4: Run the targeted tests and full miniapp suite**

Run:

```bash
cd miniapp
npm test
```

Expected: all tests pass with no TypeScript compilation errors.

- [ ] **Step 5: Commit**

```bash
git add miniapp/src/domain/types.ts miniapp/src/store/reducer.ts miniapp/src/domain/sessions.ts miniapp/test/reducer.test.mjs miniapp/test/domain.test.mjs
git commit -m "feat: add project completion state"
```

---

### Task 2: Training Buttons and Scroll Clearance

**Files:**
- Modify: `miniapp/src/components/exercise-logger/index.tsx`
- Modify: `miniapp/src/components/exercise-logger/index.scss`
- Modify: `miniapp/src/pages/training/index.tsx`
- Modify: `miniapp/src/pages/training/index.scss`
- Modify: `miniapp/test/ui-contract.test.mjs`

**Interfaces:**
- Consumes: `TOGGLE_EXERCISE_COMPLETE`.
- Produces: metric logger button `.exercise-done`.
- Produces: fixed `.training-actions` containing `.add-exercise` and `.finish-workout`.

- [ ] **Step 1: Write failing UI contract tests**

```js
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
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
cd miniapp
npm test -- --test-name-pattern="metric exercises|both training actions"
```

Expected: assertions fail because the metric completion button and combined action bar are absent.

- [ ] **Step 3: Add metric completion interaction**

After `.metric-grid`, render:

```tsx
<Button
  className={exercise.completed ? 'exercise-done active' : 'exercise-done'}
  onClick={() => {
    const hasValue = Object.values(exercise.values ?? {}).some((value) => Number(value) > 0)
    if (!hasValue) return void Taro.showToast({ title: '请先填写训练数据', icon: 'none' })
    dispatch({ type: 'TOGGLE_EXERCISE_COMPLETE', exerciseId: exercise.id })
  }}
>
  {exercise.completed ? '✓ 已完成' : '完成本项目'}
</Button>
```

Import `Taro` and style `.exercise-done` as an 88rpx full-width outlined button with a blue active state.

- [ ] **Step 4: Combine the bottom actions and reserve exact space**

Replace the in-scroll add button with:

```tsx
<ScrollView scrollY className='exercise-scroll'>
  {state.currentExercises.map((exercise) => (
    <ExerciseLogger
      key={exercise.id}
      exercise={exercise}
      dispatch={dispatch}
      onRemove={(exerciseId) => void removeExercise(exerciseId, exercise.name)}
    />
  ))}
</ScrollView>
<View className='training-actions'>
  <Button className='add-exercise' onClick={() => setOpen(true)}>＋ 添加项目</Button>
  <Button className='finish-workout' onClick={complete}>完成训练</Button>
</View>
```

Use shared dimensions:

```scss
.training-page {
  --training-action-height: 132rpx;
  height: 100vh;
  overflow: hidden;
}
.exercise-scroll {
  height: calc(100vh - 420rpx);
  box-sizing: border-box;
  padding-bottom: calc(var(--training-action-height) + 32rpx + env(safe-area-inset-bottom));
}
.training-actions {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 18rpx;
  min-height: var(--training-action-height);
}
```

Reset old `.add-exercise` margins and give the add button an outlined style.

- [ ] **Step 5: Run tests and build**

Run:

```bash
cd miniapp
npm test
npx tsc --noEmit
npm run build:weapp
```

Expected: tests, type check, and production build pass.

- [ ] **Step 6: Commit**

```bash
git add miniapp/src/components/exercise-logger miniapp/src/pages/training miniapp/test/ui-contract.test.mjs
git commit -m "feat: improve training completion controls"
```

---

### Task 3: User-confirmed Nickname and Avatar

**Files:**
- Create: `miniapp/src/components/profile-editor/index.tsx`
- Create: `miniapp/src/components/profile-editor/index.scss`
- Modify: `miniapp/src/pages/profile/index.tsx`
- Modify: `miniapp/src/pages/profile/index.scss`
- Modify: `miniapp/test/ui-contract.test.mjs`

**Interfaces:**
- Consumes: `useAuth().updateProfile(data)`.
- Produces: `<ProfileEditor open user onClose onSave />`.
- Produces: WeChat `Input type='nickname'` and `Button openType='chooseAvatar'`.

- [ ] **Step 1: Write a failing UI contract test**

```js
test('profile editing uses explicit WeChat nickname and avatar controls', () => {
  const editor = read('src/components/profile-editor/index.tsx')
  assert.match(editor, /type='nickname'/)
  assert.match(editor, /openType='chooseAvatar'/)
  assert.match(editor, /cloud\\.uploadFile/)
  assert.match(read('src/pages/profile/index.tsx'), /完善资料/)
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
cd miniapp
npm test -- --test-name-pattern="profile editing"
```

Expected: test fails because `profile-editor/index.tsx` does not exist.

- [ ] **Step 3: Implement the focused editor**

The component owns draft state and uploads only a newly selected local avatar:

```tsx
const save = async () => {
  const cleanName = nickname.trim()
  if (!cleanName) return setError('请输入昵称')
  setSaving(true)
  setError('')
  try {
    let avatarFileId = user.avatarFileId
    if (avatarUrl && avatarUrl !== user.avatarFileId) {
      const suffix = avatarUrl.includes('.') ? avatarUrl.slice(avatarUrl.lastIndexOf('.')) : '.png'
      const upload = await Taro.cloud.uploadFile({
        cloudPath: `avatars/${user.id}/${Date.now()}${suffix}`,
        filePath: avatarUrl
      })
      avatarFileId = upload.fileID
    }
    await onSave({ nickname: cleanName, avatarFileId })
    onClose()
  } catch (reason) {
    setError(reason instanceof Error ? reason.message : '资料保存失败，请稍后重试')
  } finally {
    setSaving(false)
  }
}
```

Use `onChooseAvatar` to store `event.detail.avatarUrl`, render a mask/sheet, and keep the user’s input when saving fails.

- [ ] **Step 4: Wire the profile card**

Add `editingProfile` state. Clicking `.profile-card` opens the editor. For default users render:

```tsx
<Text className='profile-hint'>{nickname === '微信用户' ? '完善资料' : '编辑资料'}</Text>
```

Render an `<Image>` when `avatarFileId` exists and the first nickname character fallback otherwise. Pass:

```tsx
<ProfileEditor
  open={editingProfile}
  user={auth.user!}
  onClose={() => setEditingProfile(false)}
  onSave={auth.updateProfile}
/>
```

- [ ] **Step 5: Run tests, type check, and build**

Run:

```bash
cd miniapp
npm test
npx tsc --noEmit
npm run build:weapp
```

Expected: all commands pass.

- [ ] **Step 6: Commit**

```bash
git add miniapp/src/components/profile-editor miniapp/src/pages/profile miniapp/test/ui-contract.test.mjs
git commit -m "feat: add user-confirmed WeChat profile"
```

---

### Task 4: Profile Quick Settings and Menu Actions

**Files:**
- Create: `miniapp/src/components/profile-setting-sheet/index.tsx`
- Create: `miniapp/src/components/profile-setting-sheet/index.scss`
- Modify: `miniapp/src/domain/types.ts`
- Modify: `miniapp/src/cloud/types.ts`
- Modify: `miniapp/src/store/reducer.ts`
- Modify: `miniapp/src/pages/profile/index.tsx`
- Modify: `miniapp/test/reducer.test.mjs`
- Modify: `miniapp/test/ui-contract.test.mjs`

**Interfaces:**
- Produces: `WeightUnit = 'kg' | 'lb'` and `DistanceUnit = 'km' | 'mi'`.
- Replaces: `UPDATE_PREFERENCES` payload with `{ preferences: Partial<AppState['preferences']> }`.
- Produces: `<ProfileSettingSheet mode='goal' | 'units' ... />`.
- Consumes: `auth.updateProfile({ preferences })` and store `dispatch`.

- [ ] **Step 1: Write failing preference tests**

```js
test('preferences can update goal and units together', () => {
  const next = appReducer(createEmptyUserState(), {
    type: 'UPDATE_PREFERENCES',
    preferences: { weeklyGoal: 6, weightUnit: 'lb', distanceUnit: 'mi' }
  })
  assert.deepEqual(next.preferences, { weeklyGoal: 6, weightUnit: 'lb', distanceUnit: 'mi' })
})

test('profile menu rows have click actions', () => {
  const source = read('src/pages/profile/index.tsx')
  assert.match(source, /openSetting/)
  assert.match(source, /navigateTo/)
  assert.match(source, /训练提醒功能需要/)
})
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
cd miniapp
npm test -- --test-name-pattern="preferences can update|profile menu rows"
```

Expected: reducer payload and menu-action assertions fail.

- [ ] **Step 3: Expand and update preferences**

Define:

```ts
export type WeightUnit = 'kg' | 'lb'
export type DistanceUnit = 'km' | 'mi'

export interface UserPreferences {
  weightUnit: WeightUnit
  distanceUnit: DistanceUnit
  weeklyGoal: number
}
```

Update `AppState.preferences`, `CloudUser.preferences`, and reducer:

```ts
case 'UPDATE_PREFERENCES':
  return {
    ...state,
    preferences: {
      ...state.preferences,
      ...action.preferences,
      ...(action.preferences.weeklyGoal == null
        ? {}
        : { weeklyGoal: Math.min(7, Math.max(1, Math.round(action.preferences.weeklyGoal))) })
    }
  }
```

- [ ] **Step 4: Implement quick setting sheet**

For goal mode render buttons 1 through 7. For unit mode render `kg/lb` and `km/mi`. On save, call:

```tsx
const savePreferences = async (next: AppState['preferences']) => {
  await auth.updateProfile({ preferences: next })
  dispatch({ type: 'UPDATE_PREFERENCES', preferences: next })
}
```

If saving fails, keep the sheet open and show “设置保存失败，请稍后重试”.

- [ ] **Step 5: Wire every profile menu**

Use title-based actions:

```ts
const openMenu = (title: string) => {
  if (title === '训练目标') return openSetting('goal')
  if (title === '单位偏好') return openSetting('units')
  if (title === '自定义项目') return void Taro.navigateTo({ url: '/pages/custom-projects/index' })
  if (title === '数据与隐私') return void Taro.navigateTo({ url: '/pages/privacy/index' })
  return void Taro.showModal({
    title: '训练提醒',
    content: '训练提醒功能需要你主动订阅微信消息。当前版本尚未启用，后续开启时会再次征求你的授权。',
    showCancel: false,
    confirmText: '我知道了'
  })
}
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
cd miniapp
npm test
npx tsc --noEmit
```

Expected: all tests and type checking pass.

Commit:

```bash
git add miniapp/src/components/profile-setting-sheet miniapp/src/domain/types.ts miniapp/src/store/reducer.ts miniapp/src/pages/profile/index.tsx miniapp/test/reducer.test.mjs miniapp/test/ui-contract.test.mjs
git commit -m "feat: add profile settings interactions"
```

---

### Task 5: Custom Project Management and Privacy Pages

**Files:**
- Create: `miniapp/src/pages/custom-projects/index.tsx`
- Create: `miniapp/src/pages/custom-projects/index.scss`
- Create: `miniapp/src/pages/custom-projects/index.config.ts`
- Create: `miniapp/src/pages/privacy/index.tsx`
- Create: `miniapp/src/pages/privacy/index.scss`
- Create: `miniapp/src/pages/privacy/index.config.ts`
- Create: `miniapp/src/components/exercise-editor/index.tsx`
- Create: `miniapp/src/components/exercise-editor/index.scss`
- Modify: `miniapp/src/app.config.ts`
- Modify: `miniapp/src/store/reducer.ts`
- Modify: `miniapp/src/store/app-store.tsx`
- Modify: `miniapp/src/cloud/types.ts`
- Modify: `miniapp/src/cloud/config.ts`
- Modify: `miniapp/src/cloud/repository.ts`
- Modify: `miniapp/src/cloud/sync-engine.ts`
- Modify: `miniapp/test/reducer.test.mjs`
- Modify: `miniapp/test/cloud-repository.test.mjs`
- Modify: `miniapp/test/config.test.mjs`
- Modify: `miniapp/test/ui-contract.test.mjs`

**Interfaces:**
- Produces: `SAVE_LIBRARY_EXERCISE` and `DELETE_LIBRARY_EXERCISE`.
- Produces: `CloudRepository.deleteExercise(exerciseId)`.
- Produces: sync engine `pushExerciseDelete(exerciseId)`.
- Produces: registered routes `pages/custom-projects/index` and `pages/privacy/index`.

- [ ] **Step 1: Write failing domain, repository, and route tests**

```js
test('deleting a library exercise preserves current draft and history', () => {
  const custom = { id: 'custom-1', name: '划船机', category: 'custom', metrics: ['duration'], custom: true }
  const base = {
    ...createEmptyUserState(),
    exerciseLibrary: [...createEmptyUserState().exerciseLibrary, custom],
    currentExercises: [{ ...custom, values: { duration: 10 }, completed: true }],
    sessions: [{ id: 's1', date: '2026-07-16', duration: 10, entries: [{ ...custom, duration: 10 }] }]
  }
  const next = appReducer(base, { type: 'DELETE_LIBRARY_EXERCISE', exerciseId: custom.id })
  assert.equal(next.exerciseLibrary.some((item) => item.id === custom.id), false)
  assert.equal(next.currentExercises.length, 1)
  assert.equal(next.sessions[0].entries.length, 1)
})

test('repository soft deletes an exercise document', async () => {
  const updates = []
  const adapter = {
    callFunction: async () => ({ result: {} }), list: async () => [],
    findOne: async () => ({ _id: 'cloud-exercise' }),
    add: async () => ({}),
    update: async (...args) => updates.push(args),
    serverDate: () => 123
  }
  await createCloudRepository(adapter).deleteExercise('custom-1')
  assert.deepEqual(updates[0], ['exercise_library', 'cloud-exercise', { deletedAt: 123, updatedAt: 123 }])
})

test('secondary profile pages are registered', () => {
  const config = readFileSync(new URL('../src/app.config.ts', import.meta.url), 'utf8')
  assert.match(config, /pages\\/custom-projects\\/index/)
  assert.match(config, /pages\\/privacy\\/index/)
})
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
cd miniapp
npm test -- --test-name-pattern="deleting a library|soft deletes|secondary profile pages"
```

Expected: failures for missing actions, repository method, and pages.

- [ ] **Step 3: Add library-only reducer actions**

```ts
case 'SAVE_LIBRARY_EXERCISE': {
  const exists = state.exerciseLibrary.some((item) => item.id === action.exercise.id)
  return {
    ...state,
    exerciseLibrary: exists
      ? state.exerciseLibrary.map((item) => item.id === action.exercise.id ? action.exercise : item)
      : [...state.exerciseLibrary, action.exercise]
  }
}
case 'DELETE_LIBRARY_EXERCISE':
  return {
    ...state,
    exerciseLibrary: state.exerciseLibrary.filter((item) => item.id !== action.exerciseId)
  }
```

Do not touch `currentExercises` or `sessions`.

- [ ] **Step 4: Extend repository and queued sync**

Implement soft deletion:

```ts
async deleteExercise(exerciseId) {
  const existing = await adapter.findOne('exercise_library', {
    ...owner,
    clientExerciseId: exerciseId
  })
  if (!existing?._id) return
  const now = adapter.serverDate()
  await adapter.update('exercise_library', existing._id, { deletedAt: now, updatedAt: now })
}
```

Add `exercise-delete` to `PendingOperation`, extend `PendingPayload` with a focused delete payload, queue it, flush through `repository.deleteExercise`, and expose:

```ts
interface ExerciseDeletePayload {
  id: string
}

type PendingPayload = WorkoutSession | ExerciseDefinition | ExerciseDeletePayload

async pushExerciseDelete(exerciseId: string) {
  try {
    await repository.deleteExercise?.(exerciseId)
    return true
  } catch {
    queueOperation('exercise-delete', { id: exerciseId })
    return false
  }
}
```

In `AppStoreProvider`, sync `SAVE_LIBRARY_EXERCISE` with `pushExercise` and `DELETE_LIBRARY_EXERCISE` with `pushExerciseDelete`.

- [ ] **Step 5: Build custom-project management**

Register both secondary routes after the four tab pages. The custom page:

- filters `state.exerciseLibrary.filter((item) => item.custom)`;
- displays a clear empty state;
- opens `ExerciseEditor` for create or edit;
- dispatches `SAVE_LIBRARY_EXERCISE`;
- confirms deletion with `Taro.showModal` and dispatches `DELETE_LIBRARY_EXERCISE`;
- uses `createExercise()` validation and retains the existing project ID when editing.

Use native navigation configuration:

```ts
export default definePageConfig({
  navigationBarTitleText: '自定义项目',
  navigationStyle: 'default',
  backgroundColor: '#f5f6f8'
})
```

- [ ] **Step 6: Build the privacy information page**

Render static sections for:

- “身份与可见范围”
- “云端保存内容”
- “本地缓存与离线同步”
- current `auth.status`
- formatted `auth.user?.lastLoginAt`

Include the explicit copy “当前版本暂不提供账户注销和云端数据删除入口” and no destructive button.

- [ ] **Step 7: Run tests, type check, and build**

Run:

```bash
cd miniapp
npm test
npx tsc --noEmit
npm run build:weapp
```

Expected: all tests pass and both new page bundles appear under `dist/pages/`.

- [ ] **Step 8: Commit**

```bash
git add miniapp/src/pages/custom-projects miniapp/src/pages/privacy miniapp/src/components/exercise-editor miniapp/src/app.config.ts miniapp/src/store miniapp/src/cloud miniapp/test
git commit -m "feat: add profile management pages"
```

---

### Task 6: Final Verification and WeChat Preview

**Files:**
- Modify only if verification exposes an in-scope defect.

**Interfaces:**
- Consumes all previous tasks.
- Produces a clean build and a manual-preview checklist.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm test
cd miniapp
npm test
npx tsc --noEmit
npm run build:weapp
cd ..
git diff --check
git status --short
```

Expected:

- root tests pass;
- miniapp tests pass;
- TypeScript reports no errors;
- Taro WeChat build succeeds;
- whitespace check is clean;
- only the pre-existing `miniapp/package-lock.json` and `miniapp/project.config.json` changes remain uncommitted.

- [ ] **Step 2: Inspect built output**

Verify:

```bash
test -f miniapp/dist/pages/custom-projects/index.js
test -f miniapp/dist/pages/privacy/index.js
rg -n "完成本项目|添加项目|完成训练|完善资料" miniapp/dist
```

Expected: both page bundles exist and the requested UI copy appears in build output.

- [ ] **Step 3: Open WeChat Developer Tools**

Run:

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project /Users/zhaoxuezhi/Documents/demo/fitness-log-miniapp/miniapp
```

If the service port is disabled, open 微信开发者工具 → 设置 → 安全设置 → 服务端口, enable it, and rerun.

- [ ] **Step 4: Exercise the target flows**

In a phone-size simulator:

1. Open “我的”, edit the default nickname, save, switch tabs, and return.
2. Open “训练”, add a distance/duration custom project, fill values, complete and undo completion.
3. Add enough projects to exceed one screen; scroll the final card above the combined action bar and open “添加项目”.
4. Open training goal and unit settings, save each, and verify the summary copy updates.
5. Open custom projects, create/edit/delete one item, and verify the current workout is unchanged.
6. Open training reminder and privacy information.
7. Check the simulator console for relevant errors.

- [ ] **Step 5: Record final status**

Report passed automated checks, previewed flows, any unavailable native capability, and the two pre-existing ignored local changes. Do not claim real-device nickname suggestion or cloud avatar upload passed unless they were exercised with the logged-in AppID.

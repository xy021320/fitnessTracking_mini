# Training UI Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the WeChat training page safe-area friendly, truly timed, removable per exercise, visually consistent, and equipped with native TabBar icons.

**Architecture:** Keep elapsed time in the existing app state as a start timestamp so it survives tab switches and local persistence. Keep exercise deletion in the reducer, with the page owning WeChat confirmation UI. Continue using the native WeChat TabBar and add generated local PNG icon pairs rather than replacing it with a custom component.

**Tech Stack:** Taro 4.2, React 18, TypeScript, SCSS, WeChat native TabBar, Node test runner.

## Global Constraints

- “完成训练” stays fixed above the native TabBar and safe-area inset.
- Elapsed time is real wall-clock time and never decreases when an exercise is deleted.
- Removing a current exercise does not remove it from `exerciseLibrary`.
- Every TabBar item has a gray default PNG and blue selected PNG.
- Existing local caches without `workoutStartedAt` remain readable.
- No new runtime dependencies.

---

## File Structure

- `miniapp/src/domain/workout-timer.ts`: pure elapsed-time formatting and minute conversion.
- `miniapp/src/domain/types.ts`: adds persisted `workoutStartedAt`.
- `miniapp/src/domain/initial-state.ts`: initializes timer state for demo and empty users.
- `miniapp/src/store/reducer.ts`: starts/finishes timer and removes current exercises.
- `miniapp/src/pages/home/index.tsx`: supplies a start timestamp.
- `miniapp/src/pages/training/index.tsx`: runs the display clock, confirms deletion, and owns the fixed completion action.
- `miniapp/src/pages/training/index.scss`: separates the scroll region from the fixed action bar.
- `miniapp/src/components/exercise-logger/*`: renders a deletion action and widens set completion.
- `miniapp/src/components/add-exercise-sheet/*`: renders stable preset cards.
- `miniapp/src/assets/tabbar/*.png`: eight native TabBar assets.
- `miniapp/src/app.config.ts`: maps default/selected icons to four tabs.
- `miniapp/test/reducer.test.mjs`, `miniapp/test/ui-contract.test.mjs`, `miniapp/test/project-config.test.mjs`: behavior and source/config contracts.

### Task 1: Timer and Exercise Removal State

**Files:**
- Create: `miniapp/src/domain/workout-timer.ts`
- Modify: `miniapp/src/domain/types.ts`
- Modify: `miniapp/src/domain/initial-state.ts`
- Modify: `miniapp/src/store/reducer.ts`
- Modify: `miniapp/src/pages/home/index.tsx`
- Test: `miniapp/test/reducer.test.mjs`

**Interfaces:**
- Produces: `formatElapsed(startedAt: number | null, now: number): string`
- Produces: `elapsedMinutes(startedAt: number | null, now: number): number`
- Produces: `AppAction` variants `{ type: 'START_WORKOUT'; startedAt: number }` and `{ type: 'REMOVE_EXERCISE'; exerciseId: string }`

- [ ] **Step 1: Write failing timer and reducer tests**

```js
const { formatElapsed, elapsedMinutes } = require('../dist-test/domain/workout-timer.js')

test('formats real workout elapsed time and rounds completed duration up', () => {
  assert.equal(formatElapsed(1_000, 66_000), '01:05')
  assert.equal(elapsedMinutes(1_000, 66_000), 2)
})

test('starting twice preserves the original timestamp', () => {
  const started = appReducer(createEmptyUserState(), { type: 'START_WORKOUT', startedAt: 1000 })
  const resumed = appReducer(started, { type: 'START_WORKOUT', startedAt: 5000 })
  assert.equal(resumed.workoutStartedAt, 1000)
})

test('removing an exercise keeps the timer and exercise library', () => {
  const state = { ...createEmptyUserState(), workoutStartedAt: 1000 }
  const exerciseId = state.currentExercises[0].id
  const next = appReducer(state, { type: 'REMOVE_EXERCISE', exerciseId })
  assert.equal(next.currentExercises.some((item) => item.id === exerciseId), false)
  assert.equal(next.exerciseLibrary.some((item) => item.id === exerciseId), true)
  assert.equal(next.workoutStartedAt, 1000)
})
```

- [ ] **Step 2: Run tests and verify expected failure**

Run: `cd miniapp && npm test`

Expected: FAIL because `workout-timer.js`, `workoutStartedAt`, and `REMOVE_EXERCISE` do not exist.

- [ ] **Step 3: Add the timer helpers and state transitions**

```ts
export function elapsedSeconds(startedAt: number | null, now: number): number {
  return startedAt == null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000))
}

export function formatElapsed(startedAt: number | null, now: number): string {
  const seconds = elapsedSeconds(startedAt, now)
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function elapsedMinutes(startedAt: number | null, now: number): number {
  const seconds = elapsedSeconds(startedAt, now)
  return seconds === 0 ? 1 : Math.max(1, Math.ceil(seconds / 60))
}
```

Add `workoutStartedAt: number | null` to `AppState`, initialize it to `null`, preserve the first start timestamp, clear it on completion, and filter only `currentExercises` for `REMOVE_EXERCISE`.

- [ ] **Step 4: Run tests and verify green**

Run: `cd miniapp && npm test`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add miniapp/src/domain miniapp/src/store/reducer.ts miniapp/src/pages/home/index.tsx miniapp/test/reducer.test.mjs
git commit -m "feat: add real workout timing and exercise removal"
```

### Task 2: Safe Training Actions and Exercise Cards

**Files:**
- Modify: `miniapp/src/pages/training/index.tsx`
- Modify: `miniapp/src/pages/training/index.scss`
- Modify: `miniapp/src/components/exercise-logger/index.tsx`
- Modify: `miniapp/src/components/exercise-logger/index.scss`
- Modify: `miniapp/src/components/add-exercise-sheet/index.tsx`
- Modify: `miniapp/src/components/add-exercise-sheet/index.scss`
- Test: `miniapp/test/ui-contract.test.mjs`

**Interfaces:**
- Consumes: `formatElapsed`, `elapsedMinutes`, and `REMOVE_EXERCISE` from Task 1.
- Produces: `ExerciseLogger` prop `onRemove: (exerciseId: string) => void`.

- [ ] **Step 1: Write failing source-contract tests**

```js
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
```

- [ ] **Step 2: Run tests and verify expected failure**

Run: `cd miniapp && npm test`

Expected: FAIL because the fixed action bar, confirmation flow, and card wrappers are absent.

- [ ] **Step 3: Implement page clock, confirmation, and fixed completion**

Use a one-second interval to update `now`, dispatch `START_WORKOUT` once when the page has no start time, and complete with:

```ts
const duration = elapsedMinutes(state.workoutStartedAt, Date.now())
dispatch({ type: 'COMPLETE_WORKOUT', date: today, duration })
```

Confirm deletion with:

```ts
const result = await Taro.showModal({
  title: '删除训练项目',
  content: `确定删除“${name}”及本次填写的数据吗？`,
  confirmText: '删除',
  confirmColor: '#e5484d'
})
if (result.confirm) dispatch({ type: 'REMOVE_EXERCISE', exerciseId })
```

Move the completion button into `.training-actions`, outside the `ScrollView`, and add bottom padding using `env(safe-area-inset-bottom)`.

- [ ] **Step 4: Implement logger and preset-card styling**

Render the exercise header as a name/meta block plus a `删除` text button. Change the set grid action column from `130rpx` to `156rpx`, set `.set-done` to `width: 156rpx`, and keep both states the same size. Wrap each preset label in `.preset-name` and `.preset-metrics`, use `min-height`, `white-space: normal`, and remove native button line-height assumptions.

- [ ] **Step 5: Run tests and type checking**

Run: `cd miniapp && npm test && npx tsc --noEmit`

Expected: all tests PASS and TypeScript reports no errors.

- [ ] **Step 6: Commit**

```bash
git add miniapp/src/pages/training miniapp/src/components/exercise-logger miniapp/src/components/add-exercise-sheet miniapp/test/ui-contract.test.mjs
git commit -m "feat: optimize training page interactions"
```

### Task 3: Native TabBar Icon Pairs

**Files:**
- Create: `miniapp/src/assets/tabbar/home.png`
- Create: `miniapp/src/assets/tabbar/home-active.png`
- Create: `miniapp/src/assets/tabbar/training.png`
- Create: `miniapp/src/assets/tabbar/training-active.png`
- Create: `miniapp/src/assets/tabbar/data.png`
- Create: `miniapp/src/assets/tabbar/data-active.png`
- Create: `miniapp/src/assets/tabbar/profile.png`
- Create: `miniapp/src/assets/tabbar/profile-active.png`
- Modify: `miniapp/src/app.config.ts`
- Test: `miniapp/test/project-config.test.mjs`

**Interfaces:**
- Produces: four `iconPath` and `selectedIconPath` mappings relative to the compiled mini-program root.

- [ ] **Step 1: Write a failing TabBar asset/config test**

```js
test('all native tabs have default and selected icons', () => {
  const config = readFileSync(new URL('../src/app.config.ts', import.meta.url), 'utf8')
  for (const name of ['home', 'training', 'data', 'profile']) {
    assert.match(config, new RegExp(`assets/tabbar/${name}\\\\.png`))
    assert.match(config, new RegExp(`assets/tabbar/${name}-active\\\\.png`))
    assert.equal(existsSync(new URL(`../src/assets/tabbar/${name}.png`, import.meta.url)), true)
    assert.equal(existsSync(new URL(`../src/assets/tabbar/${name}-active.png`, import.meta.url)), true)
  }
})
```

- [ ] **Step 2: Run tests and verify expected failure**

Run: `cd miniapp && npm test`

Expected: FAIL because the icon paths and PNG files do not exist.

- [ ] **Step 3: Generate eight dependency-free PNG assets**

Generate transparent 81×81 PNG icons with a small temporary standard-library raster script. Draw the same geometry twice per icon using `#83847f` and `#136df5`: house, dumbbell, three-column chart, and user outline. Store only the generated PNG files in `src/assets/tabbar`; do not add a runtime image dependency.

- [ ] **Step 4: Map icon pairs in `app.config.ts`**

```ts
{
  pagePath: 'pages/home/index',
  text: '首页',
  iconPath: 'assets/tabbar/home.png',
  selectedIconPath: 'assets/tabbar/home-active.png'
}
```

Repeat with `training`, `data`, and `profile`.

- [ ] **Step 5: Run tests and build**

Run: `cd miniapp && npm test && npm run build:weapp`

Expected: tests PASS, Webpack compiles successfully, and `dist/assets/tabbar/` contains eight PNG files.

- [ ] **Step 6: Commit**

```bash
git add miniapp/src/app.config.ts miniapp/src/assets/tabbar miniapp/test/project-config.test.mjs
git commit -m "feat: add native tab bar icons"
```

### Task 4: WeChat Visual and Interaction QA

**Files:**
- Modify only if QA exposes a defect in files from Tasks 1–3.

**Interfaces:**
- Consumes the complete training page and native TabBar build.

- [ ] **Step 1: Run complete verification**

Run: `npm test`

Run: `cd miniapp && npm test && npx tsc --noEmit && npm run build:weapp`

Expected: root and miniapp suites PASS, TypeScript has zero errors, and Webpack reports successful compilation.

- [ ] **Step 2: Validate in WeChat Developer Tools**

Compile the project and inspect an iPhone 12/13-sized simulator. Verify the login/home flow reaches the training tab, the header is clear of the capsule, all four tab icons render, and the completion button remains above the native TabBar.

- [ ] **Step 3: Exercise the target interaction**

Start a workout, wait for the timer to increment, complete a set, confirm its button remains wide, delete one exercise through the modal, and verify the exercise count decreases while elapsed time continues increasing.

- [ ] **Step 4: Validate the add-project sheet**

Open “添加项目” and verify all four preset cards are equal height, their metric copy wraps without clipping, and selecting one adds it to the list.

- [ ] **Step 5: Commit any QA-only corrections**

```bash
git add miniapp/src miniapp/test
git commit -m "fix: polish training page visual QA"
```

Skip this commit when QA requires no corrections.

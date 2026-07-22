# Privacy and Health Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Add explicit privacy consent, authenticated TabBar visibility, calorie estimation with editable workout summaries, daily body-weight trends, and permanent owner-scoped data deletion.

**Architecture:** Keep calculations in pure domain modules, persist weight records through the existing reducer and queued cloud repository, and centralize native TabBar visibility in the authenticated app shell. Use a dedicated owner-scoped cloud function for destructive deletion so the client never chooses which user to delete.

**Tech Stack:** Taro 4.2.0, React 18.3.1, TypeScript 5.8.3, WeChat Cloud Development, Node test runner, SCSS.

## Global Constraints

- The total training volume remains visible after total calories becomes the primary data metric.
- Calories use MET × 3.5 × kg ÷ 200 × minutes; MET values are strength 6.0, cardio 8.0, conditioning 7.0, mobility 3.0, custom 5.0.
- Weight is stored in kilograms and limited to 0 < weightKg <= 500.
- One weight record exists per user per calendar date.
- No new runtime dependency is allowed.
- deleteUserData derives identity only from cloud.getWXContext().OPENID.
- Existing local changes in miniapp/package-lock.json and miniapp/project.config.json are never staged.
- Each behavior change uses red-green-refactor and focused commits.

---

### Task 1: Privacy Consent and Authenticated TabBar

**Files:**
- Modify: miniapp/src/app.config.ts
- Modify: miniapp/src/app.tsx
- Modify: miniapp/src/components/auth-gate/index.tsx
- Modify: miniapp/src/components/auth-gate/index.scss
- Modify: miniapp/test/config.test.mjs
- Modify: miniapp/test/ui-contract.test.mjs

**Interfaces:**
- Produces: TabBarVisibility using useAuth() and Taro.hideTabBar / Taro.showTabBar.
- Produces: local consent state in AuthGate and official openPrivacyContract button.
- Consumes: existing auth.login().

- [ ] **Step 1: Write failing source-contract tests**

~~~js
test('privacy checks and official contract entry are enabled', () => {
  assert.match(read('src/app.config.ts'), /__usePrivacyCheck__/)
  const gate = read('src/components/auth-gate/index.tsx')
  assert.match(gate, /openPrivacyContract/)
  assert.match(gate, /请先阅读并同意隐私保护指引/)
})

test('app shell controls native tabbar from auth status', () => {
  const app = read('src/app.tsx')
  assert.match(app, /hideTabBar/)
  assert.match(app, /showTabBar/)
  assert.match(app, /authenticated.*offline/s)
})
~~~

- [ ] **Step 2: Run tests and verify RED**

Run: cd miniapp && npm test

Expected: assertions fail because privacy configuration and TabBar control are absent.

- [ ] **Step 3: Add privacy config and login consent**

Add to app config:

~~~ts
__usePrivacyCheck__: true,
~~~

In AuthGate, keep an unchecked agreed state and guard login:

~~~tsx
const login = () => {
  if (!agreed) return void Taro.showToast({ title: '请先阅读并同意隐私保护指引', icon: 'none' })
  void auth.login()
}
~~~

Render an explicit checkbox and a Button with openType='openPrivacyContract'. State that login stores identity, profile, preferences, workouts, and body weight for owner-only cloud sync.

- [ ] **Step 4: Centralize TabBar visibility**

~~~tsx
function TabBarVisibility() {
  const auth = useAuth()
  useEffect(() => {
    const visible = auth.status === 'authenticated' || auth.status === 'offline'
    const action = visible ? Taro.showTabBar : Taro.hideTabBar
    void action({ animation: false }).catch(() => undefined)
  }, [auth.status])
  return null
}
~~~

Mount inside AuthProvider before AppStoreProvider.

- [ ] **Step 5: Run tests, type check, and commit**

~~~bash
cd miniapp
npm test
npx tsc --noEmit
cd ..
git add miniapp/src/app.config.ts miniapp/src/app.tsx miniapp/src/components/auth-gate miniapp/test/config.test.mjs miniapp/test/ui-contract.test.mjs
git commit -m "feat: add privacy consent and authenticated tabbar"
~~~

---

### Task 2: Calorie Domain and Workout Summary

**Files:**
- Create: miniapp/src/domain/calories.ts
- Create: miniapp/src/components/workout-summary/index.tsx
- Create: miniapp/src/components/workout-summary/index.scss
- Modify: miniapp/src/domain/types.ts
- Modify: miniapp/src/domain/initial-state.ts
- Modify: miniapp/src/domain/sessions.ts
- Modify: miniapp/src/domain/analytics.ts
- Modify: miniapp/src/cloud/types.ts
- Modify: miniapp/src/cloud/mappers.ts
- Modify: miniapp/src/pages/training/index.tsx
- Modify: miniapp/src/pages/data/index.tsx
- Modify: miniapp/src/pages/data/index.scss
- Modify: miniapp/test/domain.test.mjs
- Modify: miniapp/test/ui-contract.test.mjs

**Interfaces:**
- Produces: estimateCalories({ duration, entries, weightKg }): number.
- Produces: weightForDate(records, date): { weightKg: number; fallback: boolean }.
- Adds: BodyWeightRecord and an empty AppState.weightRecords list for migration-safe calorie lookup.
- Adds: WorkoutSession.calories?: number and caloriesEstimated?: boolean.
- Produces: WorkoutSummary with editable calorie input.

- [ ] **Step 1: Write failing calorie tests**

~~~js
test('calories use category MET body weight and duration', () => {
  assert.equal(estimateCalories({ duration: 30, weightKg: 70, entries: [{ category: 'strength' }] }), 221)
  assert.equal(estimateCalories({ duration: 30, weightKg: 70, entries: [{ category: 'cardio' }] }), 294)
})

test('mixed workouts average category MET values', () => {
  assert.equal(estimateCalories({ duration: 30, weightKg: 70, entries: [{ category: 'strength' }, { category: 'cardio' }] }), 257)
})

test('weight lookup uses latest record on or before date then fallback', () => {
  const records = [{ id: 'w1', date: '2026-07-10', weightKg: 80 }, { id: 'w2', date: '2026-07-12', weightKg: 79 }]
  assert.deepEqual(weightForDate(records, '2026-07-11'), { weightKg: 80, fallback: false })
  assert.deepEqual(weightForDate([], '2026-07-11'), { weightKg: 70, fallback: true })
})
~~~

- [ ] **Step 2: Run tests and verify RED**

Run: cd miniapp && npm test

Expected: compilation fails because calories.ts and the session fields do not exist.

- [ ] **Step 3: Implement calorie functions**

~~~ts
const MET = { strength: 6, cardio: 8, conditioning: 7, mobility: 3, custom: 5 } as const

export function estimateCalories(input: { duration: number; weightKg: number; entries: Array<{ category: ExerciseCategory }> }): number {
  const mets = input.entries.map((entry) => MET[entry.category])
  const averageMet = mets.length ? mets.reduce((sum, value) => sum + value, 0) / mets.length : MET.custom
  return Math.round(averageMet * 3.5 * sanitizeNumber(input.weightKg) / 200 * sanitizeNumber(input.duration))
}
~~~

weightForDate sorts records at or before the requested date and falls back to 70kg.

Add BodyWeightRecord to domain types and initialize weightRecords: [] in both initial states. Update session cloud mapping so saved calorie fields survive upload and download.

- [ ] **Step 4: Add editable workout summary**

Completion first opens WorkoutSummary with duration, project count, calculation weight and estimated calories. Saving dispatches:

~~~ts
{
  type: 'COMPLETE_WORKOUT',
  date,
  duration,
  calories,
  caloriesEstimated
}
~~~

Editing the initial calorie value sets caloriesEstimated false. buildSession copies both fields.

- [ ] **Step 5: Update data overview while retaining volume**

The primary metric becomes total calories. Use a two-column detail grid containing training count, duration, distance, and original total volume.

- [ ] **Step 6: Verify and commit**

~~~bash
cd miniapp
npm test
npx tsc --noEmit
cd ..
git add miniapp/src/domain miniapp/src/components/workout-summary miniapp/src/pages/training miniapp/src/pages/data miniapp/test
git commit -m "feat: add editable calorie tracking"
~~~

---

### Task 3: Daily Weight State, Cloud Sync, and Trends

**Files:**
- Create: miniapp/src/domain/body-weight.ts
- Create: miniapp/src/components/weight-entry-sheet/index.tsx
- Create: miniapp/src/components/weight-entry-sheet/index.scss
- Create: miniapp/src/components/weight-trend/index.tsx
- Create: miniapp/src/components/weight-trend/index.scss
- Modify: miniapp/src/domain/types.ts
- Modify: miniapp/src/domain/initial-state.ts
- Modify: miniapp/src/store/reducer.ts
- Modify: miniapp/src/store/storage.ts
- Modify: miniapp/src/store/app-store.tsx
- Modify: miniapp/src/cloud/types.ts
- Modify: miniapp/src/cloud/repository.ts
- Modify: miniapp/src/cloud/sync-engine.ts
- Modify: miniapp/src/pages/data/index.tsx
- Modify: miniapp/src/pages/data/index.scss
- Modify: miniapp/cloud/database-rules.json
- Modify: miniapp/cloud/database-indexes.json
- Modify: miniapp/test/reducer.test.mjs
- Modify: miniapp/test/cloud-repository.test.mjs
- Modify: miniapp/test/auth-sync.test.mjs
- Modify: miniapp/test/ui-contract.test.mjs

**Interfaces:**
- Consumes: BodyWeightRecord { id; date; weightKg } and AppState.weightRecords from Task 2.
- Produces: bodyWeightSummary(records) with latest, previousChange, totalChange.
- Adds: AppState.weightRecords and UPSERT_WEIGHT_RECORD.
- Produces: CloudRepository.listWeightRecords() and saveWeightRecord(record).
- Produces: sync engine pushWeightRecord(record) and queue type weight.

- [ ] **Step 1: Write failing domain and reducer tests**

~~~js
test('daily weight upsert replaces the same date', () => {
  const first = appReducer(createEmptyUserState(), { type: 'UPSERT_WEIGHT_RECORD', record: { id: 'weight-2026-07-21', date: '2026-07-21', weightKg: 80 } })
  const next = appReducer(first, { type: 'UPSERT_WEIGHT_RECORD', record: { id: 'weight-2026-07-21', date: '2026-07-21', weightKg: 79.5 } })
  assert.equal(next.weightRecords.length, 1)
  assert.equal(next.weightRecords[0].weightKg, 79.5)
})

test('weight summary reports previous and total change', () => {
  const summary = bodyWeightSummary([
    { id: 'a', date: '2026-07-01', weightKg: 82 },
    { id: 'b', date: '2026-07-10', weightKg: 81 },
    { id: 'c', date: '2026-07-20', weightKg: 80.5 }
  ])
  assert.equal(summary.latest.weightKg, 80.5)
  assert.equal(summary.previousChange, -0.5)
  assert.equal(summary.totalChange, -1.5)
})
~~~

- [ ] **Step 2: Run tests and verify RED**

Run: cd miniapp && npm test

Expected: tests fail because weight state and summary do not exist.

- [ ] **Step 3: Implement weight state and migration-safe storage**

~~~ts
export function normalizeWeightKg(value: unknown): number {
  const weight = Math.round(Number(value) * 10) / 10
  if (!(weight > 0 && weight <= 500)) throw new Error('请输入有效体重')
  return weight
}
~~~

Initialize weightRecords: []. Loading old local states merges the fallback so the new field always exists. Reducer upserts by date and sorts ascending.

- [ ] **Step 4: Extend cloud repository and offline queue**

saveWeightRecord finds body_weight_records by owner and date, updates an existing document or adds a new one. Add list mapping and queue type weight. Hydrate weight records alongside sessions and exercises.

- [ ] **Step 5: Add weight entry and trend UI**

The data page opens a bottom sheet prefilled with today’s record. Convert lb input to kg before dispatch and kg to lb for display. Render latest weight, previous change, total change, and recent trend.

- [ ] **Step 6: Add database declarations**

Add body_weight_records owner-only rules and indexes for (_openid, date) and (_openid, updatedAt desc).

- [ ] **Step 7: Verify and commit**

~~~bash
cd miniapp
npm test
npx tsc --noEmit
cd ..
git add miniapp/src miniapp/cloud/database-rules.json miniapp/cloud/database-indexes.json miniapp/test
git commit -m "feat: add daily body weight tracking"
~~~

---

### Task 4: Owner-scoped Permanent Data Deletion

**Files:**
- Create: miniapp/cloudfunctions/deleteUserData/index.js
- Create: miniapp/cloudfunctions/deleteUserData/package.json
- Modify: miniapp/src/cloud/types.ts
- Modify: miniapp/src/cloud/repository.ts
- Modify: miniapp/src/auth/auth-reducer.ts
- Modify: miniapp/src/auth/auth-store.tsx
- Modify: miniapp/src/store/storage.ts
- Modify: miniapp/src/pages/privacy/index.tsx
- Modify: miniapp/src/pages/privacy/index.scss
- Create: miniapp/test/delete-user-data.test.mjs
- Modify: miniapp/test/auth-sync.test.mjs
- Modify: miniapp/test/ui-contract.test.mjs

**Interfaces:**
- Produces: cloud function deleteUserData returning { deleted: true, warnings: string[] }.
- Produces: CloudRepository.deleteUserData().
- Adds: DELETE_ACCOUNT_START, DELETE_ACCOUNT_SUCCESS, DELETE_ACCOUNT_ERROR.
- Produces: auth.deleteUserData(): Promise<void>.
- Produces: clearUserStorage(storage, userId).

- [ ] **Step 1: Write failing cloud function tests**

~~~js
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
~~~

- [ ] **Step 2: Run tests and verify RED**

Run: cd miniapp && npm test

Expected: import fails because deleteUserData does not exist.

- [ ] **Step 3: Implement idempotent cloud deletion**

Export a dependency-injected deleteUserData for tests and main for production. Reject missing OPENID. Query and delete only documents matched by _openid: OPENID, paginate until none remain, then delete the user document. Avatar deletion failures become warnings after database success.

- [ ] **Step 4: Add frontend delete lifecycle and storage cleanup**

Repository calls deleteUserData. Auth keeps the user until the call succeeds, then calls clearUserStorage(Taro, userId) and dispatches DELETE_ACCOUNT_SUCCESS.

clearUserStorage removes only:
- zhu-li-user-state-v1:userId
- zhu-li-pending-sync-v1:userId
- zhu-li-privacy-consent-v1

- [ ] **Step 5: Add privacy page controls**

Add official openPrivacyContract, precise collected-data copy, and two sequential Taro.showModal confirmations. Disable the red button during deletion. On success switch to home and show “个人数据已删除”. On failure retain login and show the error.

- [ ] **Step 6: Verify and commit**

~~~bash
npm test
cd miniapp
npm test
npx tsc --noEmit
cd ..
git add miniapp/cloudfunctions/deleteUserData miniapp/src miniapp/test
git commit -m "feat: add permanent personal data deletion"
~~~

---

### Task 5: Full Build and Native Preview Verification

**Files:**
- Modify only when verification reveals an in-scope defect.

- [ ] **Step 1: Run fresh full verification**

~~~bash
npm test
cd miniapp
npm test
npx tsc --noEmit
npm run build:weapp
cd ..
git diff --check
git status --short
~~~

Expected: all tests pass, TypeScript reports no errors, production build succeeds, whitespace check is clean, and only pre-existing developer-tool files remain uncommitted.

- [ ] **Step 2: Inspect production artifacts**

~~~bash
node -e "const app=require('./miniapp/dist/app.json'); if(app.__usePrivacyCheck__!==true) process.exit(1)"
test -f miniapp/dist/pages/data/index.js
test -f miniapp/dist/pages/privacy/index.js
test -f miniapp/cloudfunctions/deleteUserData/index.js
~~~

- [ ] **Step 3: Verify in WeChat Developer Tools**

Check:
1. Cold launch shows login without TabBar.
2. Login is blocked until consent is checked; official privacy contract opens.
3. Successful login shows TabBar.
4. Today’s weight can be created and edited without duplicate dates.
5. Completing a mixed workout allows calorie editing and updates both calories and volume.
6. Privacy page reaches both deletion confirmations without confirming destructive deletion against shared test data.

- [ ] **Step 4: Report remaining environment risk**

State whether the official privacy contract, cloud functions, and real-device TabBar transitions were exercised with the logged-in AppID. Do not claim native integrations passed when only static build checks were available.

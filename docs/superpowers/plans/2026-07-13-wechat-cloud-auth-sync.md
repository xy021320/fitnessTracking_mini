# 铸力微信云登录与数据同步 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将小程序升级为微信身份登录、云端持久化、用户数据隔离和离线重试的真实数据应用。

**Architecture:** 使用 Taro 原生 `Taro.cloud` 初始化微信云开发，通过 `bootstrapUser` 云函数建立用户资料，业务数据经独立 repository 访问文档型数据库。云端为登录后的主数据源，本地按用户缓存训练历史、草稿和待同步操作，页面只依赖 auth/store 接口。

**Tech Stack:** Taro 4.2.0、React 18.3.1、TypeScript 5.8.3、微信云开发、Node.js 云函数、微信文档型数据库、Node test runner。

## Global Constraints

- AppID 固定为 `wxcbad07e3fb2b6b8e`。
- 云端从空数据开始，不上传现有演示记录。
- 云环境使用 `TARO_APP_CLOUD_ENV`，未设置时使用微信开发者工具当前环境。
- 不保存 AppSecret，不部署自建服务器、云托管或第三方数据库。
- 集合固定为 `users`、`exercise_library`、`workout_sessions`。
- 数据库与云存储仅允许当前 `auth.openid` 访问自己的数据。
- 当前训练输入只保存在本地，完成训练后才同步云端。
- 所有写入失败进入 `pendingSync`，session 以 `clientSessionId` 去重。
- 保留用户已产生的 `miniapp/project.config.json` 与 `miniapp/package-lock.json` 改动。
- `miniapp/project.private.config.json` 仅本机使用，不提交。

---

### Task 1: 云端领域类型与数据库适配层

**Files:**
- Create: `miniapp/src/cloud/types.ts`
- Create: `miniapp/src/cloud/config.ts`
- Create: `miniapp/src/cloud/mappers.ts`
- Create: `miniapp/src/cloud/repository.ts`
- Create: `miniapp/test/cloud-repository.test.mjs`
- Modify: `miniapp/tsconfig.test.json`

**Interfaces:**
- Produces: `initCloud()`, `createCloudRepository(adapter)`, `toSessionDocument()`, `fromSessionDocument()`。
- Consumes: 现有 `WorkoutSession`、`ExerciseDefinition` 与 `AppState` 类型。

- [ ] **Step 1: 写失败测试**

```js
test('session documents contain summaries and client identity', () => {
  const doc = toSessionDocument(session)
  assert.equal(doc.clientSessionId, session.id)
  assert.equal(doc.summary.totalVolume, 640)
  assert.equal(doc.schemaVersion, 1)
})

test('repository queries only the current user and paginates by 20', async () => {
  await repository.listSessions({ since: 1000 })
  assert.deepEqual(adapter.lastWhere, { _openid: '{openid}', updatedAt: adapter.gt(1000), deletedAt: null })
  assert.equal(adapter.lastLimit, 20)
})
```

- [ ] **Step 2: 运行测试确认模块缺失**

Run: `cd miniapp && npm test`

Expected: FAIL，提示 `dist-test/cloud/mappers.js` 不存在。

- [ ] **Step 3: 实现云配置、映射和 repository**

`initCloud` 只初始化一次：

```ts
export function initCloud(): void {
  if (initialized) return
  const env = process.env.TARO_APP_CLOUD_ENV
  Taro.cloud.init({ ...(env ? { env } : {}), traceUser: true })
  initialized = true
}
```

repository 公开 `bootstrapUser`、`getUser`、`updateProfile`、`listExercises`、`saveExercise`、`listSessions`、`saveSession`，所有查询包含 `_openid: '{openid}'`，所有时间使用 `db.serverDate()`。

- [ ] **Step 4: 验证测试通过**

Run: `cd miniapp && npm test`

Expected: 云文档映射、用户条件和分页测试 PASS。

- [ ] **Step 5: 提交检查点**

```bash
git add miniapp/src/cloud miniapp/test/cloud-repository.test.mjs miniapp/tsconfig.test.json
git commit -m "feat: add cloud data repository"
```

### Task 2: 登录状态机与离线同步引擎

**Files:**
- Create: `miniapp/src/auth/auth-reducer.ts`
- Create: `miniapp/src/auth/auth-store.tsx`
- Create: `miniapp/src/cloud/sync-engine.ts`
- Create: `miniapp/test/auth-sync.test.mjs`
- Modify: `miniapp/src/store/storage.ts`
- Modify: `miniapp/src/store/app-store.tsx`
- Modify: `miniapp/src/app.tsx`

**Interfaces:**
- Produces: `AuthProvider`, `useAuth()`, `createSyncEngine(repository, storage, userKey)`。
- Consumes: Task 1 repository 和现有 reducer。

- [ ] **Step 1: 写状态机和同步失败测试**

```js
test('auth starts locked and becomes authenticated after bootstrap', () => {
  const loading = authReducer(initialAuthState, { type: 'LOGIN_START' })
  const ready = authReducer(loading, { type: 'LOGIN_SUCCESS', user: { id: 'u1', nickname: '微信用户' } })
  assert.equal(ready.status, 'authenticated')
})

test('failed session write is queued and retried once', async () => {
  repository.saveSession = async () => { throw new Error('offline') }
  await engine.pushSession(session)
  assert.equal(storage.queue.length, 1)
  repository.saveSession = async () => undefined
  await engine.flush()
  assert.equal(storage.queue.length, 0)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd miniapp && npm test`

Expected: FAIL，提示 `auth-reducer` 或 `sync-engine` 不存在。

- [ ] **Step 3: 实现认证与同步**

认证状态为 `initializing | anonymous | authenticating | authenticated | offline | error`。`login()` 调用 `bootstrapUser`，成功后使用 `cloudUser.id` 作为缓存分区；失败保持未登录。同步队列项固定为：

```ts
interface PendingOperation {
  id: string
  type: 'session' | 'exercise' | 'preferences' | 'profile'
  payload: unknown
  attempts: number
  createdAt: number
}
```

AppStore 登录前使用空业务状态；登录后先加载该用户缓存，再增量拉云端。`COMPLETE_WORKOUT` 后调用 `pushSession`，不再写入跨用户固定存储键。

- [ ] **Step 4: 验证测试和构建**

Run: `cd miniapp && npm test && npm run build:weapp`

Expected: 认证、队列、缓存隔离测试 PASS，Taro 构建成功。

- [ ] **Step 5: 提交检查点**

```bash
git add miniapp/src/auth miniapp/src/cloud/sync-engine.ts miniapp/src/store miniapp/src/app.tsx miniapp/test/auth-sync.test.mjs
git commit -m "feat: add WeChat auth and offline sync"
```

### Task 3: 登录页、真实空状态与个人资料

**Files:**
- Create: `miniapp/src/components/auth-gate/index.tsx`
- Create: `miniapp/src/components/auth-gate/index.scss`
- Modify: `miniapp/src/pages/home/index.tsx`
- Modify: `miniapp/src/pages/home/index.scss`
- Modify: `miniapp/src/pages/profile/index.tsx`
- Modify: `miniapp/src/pages/profile/index.scss`
- Modify: `miniapp/src/pages/training/index.tsx`
- Modify: `miniapp/test/ui-contract.test.mjs`

**Interfaces:**
- Produces: `<AuthGate>`, 登录页、同步提示、空数据首页、资料编辑。
- Consumes: `useAuth()` 和云端驱动的 `useAppStore()`。

- [ ] **Step 1: 写 UI 契约失败测试**

```js
test('auth gate exposes login, retry and privacy copy', () => {
  const source = read('src/components/auth-gate/index.tsx')
  assert.match(source, /微信登录/)
  assert.match(source, /重新尝试/)
  assert.match(source, /训练数据仅本人可见/)
})

test('home uses a real empty state instead of seed history', () => {
  const source = read('src/pages/home/index.tsx')
  assert.match(source, /开始第一次训练/)
  assert.doesNotMatch(source, /7月 · 第3周/)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd miniapp && npm test`

Expected: FAIL，登录组件不存在且首页仍包含固定日期。

- [ ] **Step 3: 实现页面**

AuthGate 覆盖初始化、登录、失败重试、离线缓存五种界面。首页以实际日期和 sessions 计算本周数据；sessions 为空时显示“开始第一次训练”。我的页面显示云端用户资料、最近同步时间、同步状态、头像选择和昵称输入，拒绝资料授权时继续使用默认资料。

- [ ] **Step 4: 运行 UI 测试和构建**

Run: `cd miniapp && npm test && npm run build:weapp`

Expected: 所有 UI 契约 PASS，构建成功，产物不包含演示历史文案。

- [ ] **Step 5: 提交检查点**

```bash
git add miniapp/src/components/auth-gate miniapp/src/pages miniapp/test/ui-contract.test.mjs
git commit -m "feat: add cloud login experience"
```

### Task 4: bootstrapUser 云函数与安全规则交付

**Files:**
- Create: `miniapp/cloudfunctions/bootstrapUser/index.js`
- Create: `miniapp/cloudfunctions/bootstrapUser/package.json`
- Create: `miniapp/cloudfunctions/bootstrapUser/test/index.test.js`
- Create: `miniapp/cloud/database.rules.json`
- Create: `miniapp/cloud/storage.rules.json`
- Create: `miniapp/cloud/indexes.json`
- Modify: `miniapp/project.config.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: 可在微信开发者工具部署的 `bootstrapUser` 函数和可复制到控制台的安全配置。
- Consumes: 微信云函数 `getWXContext().OPENID`。

- [ ] **Step 1: 写云函数可信身份测试**

```js
test('bootstrap ignores caller supplied openid', async () => {
  const result = await main({ openid: 'attacker' }, {}, deps)
  assert.equal(deps.savedOpenid, 'trusted-openid')
  assert.equal(result.user.nickname, '微信用户')
  assert.equal(JSON.stringify(result).includes('trusted-openid'), false)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd miniapp/cloudfunctions/bootstrapUser && node --test`

Expected: FAIL，函数入口不存在。

- [ ] **Step 3: 实现云函数和规则**

云函数依赖注入 `cloud.getWXContext` 与数据库，忽略 event 中的身份字段，按 `_openid` 查找用户并创建或更新。`project.config.json` 增加 `cloudfunctionRoot: "cloudfunctions/"`，保留现有微信开发者工具 setting。

数据库规则三个集合均使用：

```json
{ "read": "doc._openid == auth.openid", "write": "doc._openid == auth.openid" }
```

- [ ] **Step 4: 验证云函数和客户端**

Run: `cd miniapp/cloudfunctions/bootstrapUser && node --test`

Run: `cd miniapp && npm test && npm run build:weapp`

Expected: 云函数可信身份测试、客户端测试和生产构建全部 PASS。

- [ ] **Step 5: 提交检查点**

```bash
git add .gitignore miniapp/cloudfunctions miniapp/cloud miniapp/project.config.json
git commit -m "feat: add cloud bootstrap function and rules"
```

### Task 5: 配置说明与最终验收

**Files:**
- Modify: `miniapp/README.md`
- Modify: `miniapp/design-qa.md`
- Modify: `AGENTS.md`
- Create: `miniapp/cloud-setup-checklist.md`

**Interfaces:**
- Produces: 云环境创建、集合、规则、函数部署、额度提醒和双账号验收步骤。
- Consumes: Task 1–4 全部实现。

- [ ] **Step 1: 添加交付契约测试**

```js
test('cloud setup guide names every required resource', () => {
  const source = read('cloud-setup-checklist.md')
  for (const value of ['users', 'exercise_library', 'workout_sessions', 'bootstrapUser', '70%', '90%']) assert.match(source, new RegExp(value))
})
```

- [ ] **Step 2: 运行测试确认文档缺失**

Run: `cd miniapp && npm test`

Expected: FAIL，`cloud-setup-checklist.md` 不存在。

- [ ] **Step 3: 编写配置与验收说明**

说明必须覆盖微信开发者工具“云开发”入口、免费环境创建、环境 ID、三个集合、两条索引、数据库与存储规则、云函数上传并部署、按量付费关闭、70%/90% 提醒、体验账号添加和双账号隔离测试。

- [ ] **Step 4: 最终验证**

Run: `cd miniapp && npm test && npm run build:weapp`

Run: `cd miniapp/cloudfunctions/bootstrapUser && node --test`

Expected: 全部测试 PASS，生产构建成功，无 AppSecret、环境私有配置或演示 session 被提交。

- [ ] **Step 5: 提交最终检查点**

```bash
git add AGENTS.md miniapp/README.md miniapp/design-qa.md miniapp/cloud-setup-checklist.md miniapp/test
git commit -m "docs: add cloud setup and acceptance guide"
```

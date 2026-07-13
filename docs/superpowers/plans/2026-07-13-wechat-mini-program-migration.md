# 铸力微信小程序迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留现有 Web 原型的前提下，新增可通过微信开发者工具导入 `miniapp/` 根目录并扫码真机预览的 Taro 微信小程序。

**Architecture:** 在 `miniapp/` 中建立独立的 Taro 4.2.0 + React 工程。领域规则保持为可测试的纯 TypeScript 模块，React Context 负责当前训练与本地持久化，四个微信原生 Tab 页面组合复用组件并从 session 历史派生统计。

**Tech Stack:** Taro 4.2.0、React 18.3.1、TypeScript 5、Sass、Node test runner、微信开发者工具。

## Global Constraints

- 微信小程序 AppID 固定为 `wxcbad07e3fb2b6b8e`。
- 小程序源码位于 `miniapp/src`，编译输出位于 `miniapp/dist`，现有 Vite 项目不改写。
- 仅支持微信小程序 `weapp`，首版不加入登录、后端、云开发或网络请求。
- 数据存储键固定为 `zhu-li-app-state-v1`，读取失败回退初始状态，写入失败不清空内存状态。
- 自定义项目指标必须从 `weight`、`reps`、`sets`、`duration`、`distance` 中至少选择一个。
- 数据页只显示历史 session 派生值；训练页不出现“休息 / 跳过”计时条。
- 不引入 Recharts 或 Phosphor，图表和图标使用小程序兼容的本地 View/CSS 组件。
- 当前工作区不是 Git 仓库，不初始化仓库；每个任务以测试和构建结果作为检查点。

---

## File Map

- `miniapp/package.json`：依赖和测试、开发、生产构建命令。
- `miniapp/config/index.ts`：Taro 微信小程序编译配置。
- `miniapp/project.config.json`：微信开发者工具配置和 AppID。
- `miniapp/src/app.config.ts`：四个页面和原生 TabBar。
- `miniapp/src/domain/types.ts`：项目、训练记录和应用状态类型。
- `miniapp/src/domain/exercises.ts`：预设项目、创建和输入校验。
- `miniapp/src/domain/analytics.ts`：统计派生纯函数。
- `miniapp/src/domain/sessions.ts`：当前训练转历史快照。
- `miniapp/src/store/app-store.tsx`：Reducer、Context 和微信本地存储。
- `miniapp/src/components/*`：底部弹层、项目记录器、添加项目面板、简易趋势图。
- `miniapp/src/pages/{home,training,data,profile}/index.tsx`：四个主页面。
- `miniapp/src/styles/*`：设计变量和共享布局。
- `miniapp/test/*.test.ts`：领域和持久化测试。
- `miniapp/README.md`：构建、导入和手机扫码预览说明。

### Task 1: 建立可编译的微信小程序工程

**Files:**
- Create: `miniapp/package.json`
- Create: `miniapp/tsconfig.json`
- Create: `miniapp/config/index.ts`
- Create: `miniapp/config/dev.ts`
- Create: `miniapp/config/prod.ts`
- Create: `miniapp/project.config.json`
- Create: `miniapp/src/app.tsx`
- Create: `miniapp/src/app.config.ts`
- Create: `miniapp/src/app.scss`
- Create: `miniapp/src/pages/home/index.tsx`

**Interfaces:**
- Produces: `npm run dev:weapp` 和 `npm run build:weapp`，编译产物 `miniapp/dist`。
- Consumes: AppID `wxcbad07e3fb2b6b8e`。

- [ ] **Step 1: 写工程配置断言**

在 `miniapp/test/config.test.mjs` 中写入：

```js
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('project config targets the confirmed WeChat app', () => {
  const config = JSON.parse(readFileSync(new URL('../project.config.json', import.meta.url)))
  assert.equal(config.appid, 'wxcbad07e3fb2b6b8e')
  assert.equal(config.miniprogramRoot, 'dist/')
})
```

- [ ] **Step 2: 运行测试确认缺少配置**

Run: `cd miniapp && node --test test/config.test.mjs`

Expected: FAIL，错误包含 `ENOENT` 和 `project.config.json`。

- [ ] **Step 3: 创建 Taro 4.2.0 工程配置和最小首页**

`miniapp/package.json` 必须固定所有 Taro 包为同一版本：

```json
{
  "name": "zhu-li-weapp",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev:weapp": "taro build --type weapp --watch",
    "build:weapp": "taro build --type weapp",
    "test": "node --test test/*.test.mjs"
  },
  "dependencies": {
    "@tarojs/components": "4.2.0",
    "@tarojs/helper": "4.2.0",
    "@tarojs/plugin-framework-react": "4.2.0",
    "@tarojs/plugin-platform-weapp": "4.2.0",
    "@tarojs/react": "4.2.0",
    "@tarojs/runtime": "4.2.0",
    "@tarojs/shared": "4.2.0",
    "@tarojs/taro": "4.2.0",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@tarojs/cli": "4.2.0",
    "@tarojs/webpack5-runner": "4.2.0",
    "@babel/preset-react": "7.24.1",
    "@types/react": "18.3.28",
    "@types/webpack-env": "1.18.8",
    "babel-preset-taro": "4.2.0",
    "react-refresh": "0.14.0",
    "sass": "1.89.2",
    "typescript": "5.8.3",
    "webpack": "5.91.0"
  }
}
```

`miniapp/project.config.json`：

```json
{
  "appid": "wxcbad07e3fb2b6b8e",
  "projectname": "铸力健身记录",
  "description": "力量训练与综合运动记录",
  "compileType": "miniprogram",
  "miniprogramRoot": "dist/",
  "setting": { "es6": true, "minified": true, "postcss": true, "urlCheck": false }
}
```

`miniapp/src/app.config.ts` 注册 `home`、`training`、`data`、`profile` 四页，原生 TabBar 文案依次为“首页、训练、数据、我的”；首页最小组件返回 `<View className='page'>铸力</View>`。

- [ ] **Step 4: 安装依赖并验证配置与编译**

Run: `cd miniapp && npm install && npm test && npm run build:weapp`

Expected: 配置测试 PASS；构建退出码为 0；生成 `dist/app.json` 和 `dist/pages/home/index.wxml`。

- [ ] **Step 5: 记录检查点**

保存 `npm test` 与 `npm run build:weapp` 的成功输出；不执行 Git 命令。

### Task 2: 迁移项目、训练记录和统计领域模型

**Files:**
- Create: `miniapp/src/domain/types.ts`
- Create: `miniapp/src/domain/exercises.ts`
- Create: `miniapp/src/domain/analytics.ts`
- Create: `miniapp/src/domain/sessions.ts`
- Create: `miniapp/src/domain/initial-state.ts`
- Create: `miniapp/test/domain.test.mjs`

**Interfaces:**
- Produces: `createExercise(input)`, `sanitizeNumber(value)`, `deriveAnalytics(sessions)`, `buildSession(state, date)`。
- Consumes: 无平台 API；所有导出均为纯函数或只读初始数据。

- [ ] **Step 1: 写领域行为测试**

`miniapp/test/domain.test.mjs` 覆盖以下断言：

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import { createExercise, sanitizeNumber } from '../dist-test/domain/exercises.js'
import { deriveAnalytics } from '../dist-test/domain/analytics.js'

test('exercise metrics are composable and validated', () => {
  assert.deepEqual(createExercise({ name: '  壶铃摆动  ', metrics: ['weight', 'reps', 'reps'] }).metrics, ['weight', 'reps'])
  assert.throws(() => createExercise({ name: '', metrics: ['reps'] }), /请输入项目名称/)
  assert.throws(() => createExercise({ name: '划船机', metrics: [] }), /至少选择一个记录指标/)
  assert.equal(sanitizeNumber(-3), 0)
})

test('analytics only counts completed values', () => {
  const result = deriveAnalytics([{ id: 's1', date: '2026-07-13', duration: 30, entries: [
    { id: 'bench', name: '卧推', category: 'strength', sets: [
      { weight: 80, reps: 8, completed: true },
      { weight: 90, reps: 5, completed: false }
    ] },
    { id: 'run', name: '跑步', category: 'cardio', distance: 5, duration: 25, completed: true }
  ] }])
  assert.equal(result.totalVolume, 640)
  assert.equal(result.totalDistance, 5)
  assert.equal(result.averagePace, 5)
})
```

- [ ] **Step 2: 配置领域测试编译并确认测试失败**

在 `package.json` 增加 `test:compile`，使用 `tsc -p tsconfig.test.json` 将 `src/domain` 输出到 `dist-test/domain`；`npm test` 先运行编译再运行 Node 测试。

Run: `cd miniapp && npm test`

Expected: FAIL，提示 `src/domain/exercises.ts` 不存在。

- [ ] **Step 3: 实现领域类型与规则**

`types.ts` 定义 `MetricKey`、`ExerciseDefinition`、`ExerciseSet`、`WorkoutEntry`、`WorkoutSession`、`AnalyticsResult`、`AppState`。`exercises.ts` 使用：

```ts
const allowedMetrics = new Set<MetricKey>(['weight', 'reps', 'sets', 'duration', 'distance'])

export function sanitizeNumber(value: unknown): number {
  return Math.max(0, Number(value) || 0)
}

export function createExercise(input: CreateExerciseInput): ExerciseDefinition {
  const name = input.name?.trim()
  if (!name) throw new Error('请输入项目名称')
  const metrics = [...new Set(input.metrics ?? [])].filter((metric) => allowedMetrics.has(metric))
  if (metrics.length === 0) throw new Error('请至少选择一个记录指标')
  return { id: input.id ?? `custom-${Date.now()}`, name, category: input.category ?? 'custom', metrics, custom: input.custom ?? !input.id }
}
```

`analytics.ts` 按 `weight × reps` 累加已完成组，按完成项目累加距离和时长，平均配速为跑步时长除以距离；`sessions.ts` 过滤没有完成数值的条目并生成不可受项目库修改影响的对象快照。

- [ ] **Step 4: 运行领域测试**

Run: `cd miniapp && npm test`

Expected: 所有配置和领域测试 PASS。

- [ ] **Step 5: 记录检查点**

保存完整测试成功输出；不执行 Git 命令。

### Task 3: 建立微信本地持久化状态容器

**Files:**
- Create: `miniapp/src/store/storage.ts`
- Create: `miniapp/src/store/reducer.ts`
- Create: `miniapp/src/store/app-store.tsx`
- Create: `miniapp/test/reducer.test.mjs`
- Modify: `miniapp/src/app.tsx`

**Interfaces:**
- Produces: `AppStoreProvider`, `useAppStore()`, `appReducer(state, action)`, `loadState(storage)`, `saveState(storage, state)`。
- Consumes: Task 2 的 `AppState`、`initialAppState`、`buildSession`。

- [ ] **Step 1: 写 Reducer 与存储回退测试**

```js
test('invalid persisted state falls back safely', () => {
  const fallback = { activeTab: 'home', sessions: [] }
  assert.deepEqual(loadState({ getStorageSync: () => ({ bad: true }) }, fallback), fallback)
})

test('completing workout appends a snapshot and selects data', () => {
  const next = appReducer(seed, { type: 'COMPLETE_WORKOUT', date: '2026-07-13' })
  assert.equal(next.activeTab, 'data')
  assert.equal(next.sessions.at(-1).date, '2026-07-13')
})
```

- [ ] **Step 2: 运行测试确认缺少存储模块**

Run: `cd miniapp && npm test`

Expected: FAIL，提示 `dist-test/store/storage.js` 不存在。

- [ ] **Step 3: 实现纯 Reducer 和容错存储适配**

`storage.ts` 固定 `STORAGE_KEY = 'zhu-li-app-state-v1'`，仅接受同时拥有 `sessions`、`exerciseLibrary`、`currentExercises` 数组的对象。`app-store.tsx` 在初始化时调用 `Taro.getStorageSync`，每次状态变化后调用 `Taro.setStorageSync`，两处均使用 `try/catch`，写入失败时只记录警告且继续使用内存状态。

Reducer 支持：`START_WORKOUT`、`SELECT_TAB`、`ADD_EXERCISE`、`UPDATE_ENTRY_VALUE`、`ADD_SET`、`UPDATE_SET`、`COMPLETE_SET`、`COMPLETE_WORKOUT`、`UPDATE_PREFERENCES`。

- [ ] **Step 4: 将 Provider 接入应用入口并运行测试**

`app.tsx` 返回：

```tsx
import { AppStoreProvider } from './store/app-store'
import './app.scss'

export default function App({ children }) {
  return <AppStoreProvider>{children}</AppStoreProvider>
}
```

Run: `cd miniapp && npm test && npm run build:weapp`

Expected: 测试全部 PASS，微信小程序构建成功。

- [ ] **Step 5: 记录检查点**

保存测试和构建成功输出；不执行 Git 命令。

### Task 4: 实现训练记录器和自定义项目流程

**Files:**
- Create: `miniapp/src/components/bottom-sheet/index.tsx`
- Create: `miniapp/src/components/bottom-sheet/index.scss`
- Create: `miniapp/src/components/exercise-logger/index.tsx`
- Create: `miniapp/src/components/exercise-logger/index.scss`
- Create: `miniapp/src/components/add-exercise-sheet/index.tsx`
- Create: `miniapp/src/components/add-exercise-sheet/index.scss`
- Create: `miniapp/src/pages/training/index.tsx`
- Create: `miniapp/src/pages/training/index.scss`

**Interfaces:**
- Produces: `<ExerciseLogger exercise onAction />` 和 `<AddExerciseSheet open onClose onAdd />`。
- Consumes: `useAppStore()` 和 Task 2 的 `createExercise()`。

- [ ] **Step 1: 写组件静态验收脚本**

`miniapp/test/ui-contract.test.mjs` 读取训练页源码并断言：

```js
test('training page keeps confirmed actions and removes rest timer', () => {
  const source = readFileSync(new URL('../src/pages/training/index.tsx', import.meta.url), 'utf8')
  assert.match(source, /添加项目/)
  assert.match(source, /完成训练/)
  assert.doesNotMatch(source, /休息|跳过/)
})
```

- [ ] **Step 2: 运行测试确认训练页尚未实现**

Run: `cd miniapp && npm test`

Expected: FAIL，提示训练页文件不存在或缺少“添加项目”。

- [ ] **Step 3: 实现白底钴蓝训练页与组合指标输入**

力量项目逐组显示组号、重量、次数、完成按钮和“添加一组”；非力量项目根据 `metrics` 显示紧凑输入行。输入事件把字符串转为非负数后派发 `UPDATE_ENTRY_VALUE` 或 `UPDATE_SET`。页面顶部显示训练名称、已完成组数和“完成训练”；底部只保留“添加项目”，不渲染休息计时。

添加项目面板包含四个预设项目和自定义表单。自定义表单固定提供五个多选指标；保存时捕获 `createExercise()` 错误并用面板内错误文字显示，不使用浏览器 API。

- [ ] **Step 4: 验证训练页契约和编译**

Run: `cd miniapp && npm test && npm run build:weapp`

Expected: UI 契约测试 PASS，Taro 构建成功，`dist/pages/training/index.wxml` 存在且不含“休息”和“跳过”。

- [ ] **Step 5: 记录检查点**

保存测试和构建成功输出；不执行 Git 命令。

### Task 5: 实现首页、数据页、我的页面和共享视觉

**Files:**
- Create: `miniapp/src/styles/tokens.scss`
- Create: `miniapp/src/styles/shared.scss`
- Create: `miniapp/src/components/trend-chart/index.tsx`
- Create: `miniapp/src/components/trend-chart/index.scss`
- Modify: `miniapp/src/pages/home/index.tsx`
- Create: `miniapp/src/pages/home/index.scss`
- Create: `miniapp/src/pages/data/index.tsx`
- Create: `miniapp/src/pages/data/index.scss`
- Create: `miniapp/src/pages/profile/index.tsx`
- Create: `miniapp/src/pages/profile/index.scss`

**Interfaces:**
- Produces: 四个可导航主页面和 `<TrendChart points mode />`。
- Consumes: `useAppStore()`、`deriveAnalytics(sessions)`、`Taro.switchTab()`。

- [ ] **Step 1: 扩展 UI 契约测试**

```js
test('four confirmed pages expose their primary content', () => {
  const home = read('src/pages/home/index.tsx')
  const data = read('src/pages/data/index.tsx')
  const profile = read('src/pages/profile/index.tsx')
  assert.match(home, /开始训练/)
  assert.match(data, /总训练量|总距离/)
  assert.match(profile, /训练目标|单位偏好|自定义项目/)
})
```

- [ ] **Step 2: 运行测试确认三个页面内容尚不完整**

Run: `cd miniapp && npm test`

Expected: FAIL，至少一个页面缺少契约文案。

- [ ] **Step 3: 完成三个页面与共享样式**

首页使用 `#10110f` 背景、`#c8ff32` 主操作，展示今日训练、快速开始、本周进度和最近 session。数据页使用 `#f4f0e8` 背景、`#171715` 表现面板、`#ff6a2a` 强调色，展示 session 次数、时长、总训练量、总距离、配速、趋势和项目列表。我的页面使用深色背景，显示用户摘要、周目标进度和“训练目标、单位偏好、自定义项目、训练提醒、数据与隐私”入口。

`TrendChart` 使用 `View` 渲染等宽柱条，高度按本组最大值计算：

```tsx
const max = Math.max(1, ...points.map((point) => mode === 'distance' ? point.distance : point.volume))
return <View className='trend-chart'>{points.map((point) => {
  const value = mode === 'distance' ? point.distance : point.volume
  return <View className='trend-column' key={point.date}>
    <View className='trend-bar' style={{ height: `${Math.max(8, value / max * 100)}%` }} />
    <Text>{point.date}</Text>
  </View>
})}</View>
```

- [ ] **Step 4: 运行契约测试和生产构建**

Run: `cd miniapp && npm test && npm run build:weapp`

Expected: 全部测试 PASS；`dist/app.json` 包含四个页面与四个 TabBar 项；生产构建退出码为 0。

- [ ] **Step 5: 记录检查点**

保存测试和构建成功输出；不执行 Git 命令。

### Task 6: 微信开发者工具验收和手机运行交付

**Files:**
- Create: `miniapp/README.md`
- Create: `miniapp/design-qa.md`
- Modify: `fitness-log-miniapp/AGENTS.md`

**Interfaces:**
- Produces: 由 `miniapp/project.config.json` 指向的 `miniapp/dist`、真机预览步骤和最终 QA 记录。
- Consumes: Task 1–5 的完整小程序工程。

- [ ] **Step 1: 写构建产物验收脚本**

在 `miniapp/test/build-output.test.mjs` 中断言生产构建后的项目配置和页面：

```js
test('production output is importable by WeChat DevTools', () => {
  const config = JSON.parse(readFileSync(new URL('../dist/project.config.json', import.meta.url)))
  const app = JSON.parse(readFileSync(new URL('../dist/app.json', import.meta.url)))
  assert.equal(config.appid, 'wxcbad07e3fb2b6b8e')
  assert.deepEqual(app.pages, ['pages/home/index', 'pages/training/index', 'pages/data/index', 'pages/profile/index'])
  assert.equal(app.tabBar.list.length, 4)
})
```

- [ ] **Step 2: 运行完整验收**

Run: `cd miniapp && npm run build:weapp && npm test`

Expected: 生产构建和所有测试 PASS；`dist/project.config.json`、`dist/app.json`、四个页面 WXML/WXSS/JS 文件均存在。

- [ ] **Step 3: 在微信开发者工具中检查交互**

导入 `/Users/zhaoxuezhi/Documents/demo/fitness-log-miniapp/miniapp`；确认开发者工具识别 `miniprogramRoot: dist/` 和 AppID。依次验证开始训练、添加杠铃项目、添加跳绳项目、添加跑步项目、完成训练、数据刷新、重新编译后本地数据仍存在。

- [ ] **Step 4: 编写用户运行说明和 QA 结果**

`README.md` 写明：安装依赖、`npm run dev:weapp`、导入 `miniapp` 根目录、登录对应 AppID 开发者账号、点击“预览”、手机微信扫码。`design-qa.md` 记录每个页面的模拟器尺寸、遮挡、滚动、输入键盘、TabBar 和错误提示检查结果。`AGENTS.md` 追加“小程序采用 Taro 4.2.0、本地存储、AppID 已配置”的持久决策。

- [ ] **Step 5: 最终检查点**

Run: `cd miniapp && npm test && npm run build:weapp`

Expected: 所有测试 PASS，生产构建成功；向用户交付 `miniapp` 根目录和扫码预览步骤。

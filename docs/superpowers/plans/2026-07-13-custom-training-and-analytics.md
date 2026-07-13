# 铸力自定义训练与数据统计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现可组合指标的自定义训练项目、方案 2 风格训练页、方案 3 风格数据页和完整个人管理页。

**Architecture:** 将业务状态集中在 `app-state.js`，以纯函数处理项目创建、训练记录和统计派生；React 页面只负责表单、导航和视觉反馈。页面拆分到独立组件文件，避免继续扩大现有单文件 `App.jsx`。

**Tech Stack:** React 19、Vite 6、Node test、Recharts、Phosphor Icons、CSS

## Global Constraints

- 自定义项目指标从 `weight`、`reps`、`sets`、`duration`、`distance` 中任意组合。
- 训练页严格遵循方案 2 的白底、黑字、钴蓝高效记录风格。
- 数据页严格遵循方案 3 的米白、炭黑、信号橙表现风格。
- 390 × 844 不出现横向滚动或遮挡主操作。
- 不实现登录、云同步、GPS、真实通知或后端。

---

### Task 1: 可组合训练数据模型

**Files:**
- Modify: `src/app-state.test.js`
- Modify: `src/app-state.js`

**Interfaces:**
- Produces: `createExercise(input)`、`appendExercise(state, exercise)`、`completeWorkout(state, payload)`、`deriveAnalytics(sessions)`。

- [ ] **Step 1: 写失败测试**

```js
test("creates an exercise with composable metrics", () => {
  const result = createExercise({ name: "户外跑步", category: "cardio", metrics: ["distance", "duration"] });
  assert.deepEqual(result.metrics, ["distance", "duration"]);
});

test("rejects an exercise without a name or metrics", () => {
  assert.throws(() => createExercise({ name: "", metrics: [] }), /名称/);
});

test("derives strength volume distance and pace from completed sessions", () => {
  const analytics = deriveAnalytics(sampleSessions);
  assert.equal(analytics.totalVolume, 640);
  assert.equal(analytics.totalDistance, 5);
  assert.equal(analytics.averagePace, 6);
});
```

- [ ] **Step 2: 验证失败**

Run: `npm test`
Expected: FAIL，新增导出尚不存在。

- [ ] **Step 3: 最小实现并验证**

实现输入校验、不可变状态更新和统计聚合。

Run: `npm test`
Expected: PASS，0 failed。

### Task 2: 方案 2 风格训练页与添加项目流程

**Files:**
- Create: `src/screens/TrainingScreen.jsx`
- Create: `src/components/AddExerciseSheet.jsx`
- Create: `src/components/ExerciseLogger.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: Task 1 的项目和 session 操作。
- Produces: `TrainingScreen({ state, dispatch })`，能够新增项目、记录指标并完成训练。

- [ ] **Step 1: 实现训练页结构**

按方案 2 还原顶部时长、力量组表格、休息计时和蓝色操作控件；新增项目入口固定在内容底部。

- [ ] **Step 2: 实现项目选择面板**

预设“杠铃卧推、跳绳、户外跑步、平板支撑”，并支持输入名称、分类和多选指标。

- [ ] **Step 3: 实现完成训练摘要**

有完成数据时写入 session，展示成功反馈并切到数据页；无数据时保持按钮禁用。

- [ ] **Step 4: 验证**

Run: `npm test && npm run build`
Expected: tests PASS，build exit 0。

### Task 3: 方案 3 风格数据页

**Files:**
- Create: `src/screens/AnalyticsScreen.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `deriveAnalytics(state.sessions)`。
- Produces: 总览指标、训练趋势、项目表现和个人纪录。

- [ ] **Step 1: 实现统计总览**

显示训练次数、总时长、训练量和总距离；所有数字来自 session。

- [ ] **Step 2: 实现趋势和项目排行**

使用 Recharts 绘制训练量趋势，并按项目显示累计次数、距离、时长或重量记录。

- [ ] **Step 3: 实现筛选状态**

“总览、力量、有氧”按钮改变列表和主指标，具有明确选中状态。

- [ ] **Step 4: 验证**

Run: `npm test && npm run build`
Expected: tests PASS，build exit 0。

### Task 4: 我的页面与整体 QA

**Files:**
- Create: `src/screens/ProfileScreen.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`
- Modify: `design-qa.md`

**Interfaces:**
- Produces: 个人资料、训练目标、单位偏好、项目管理、提醒和隐私入口。

- [ ] **Step 1: 实现个人管理页面**

深色品牌页头、目标进度和分组列表；入口点击打开轻量设置面板或状态反馈。

- [ ] **Step 2: 浏览器交互验证**

在 390 × 844 完成“训练 → 添加户外跑步 → 记录 → 完成 → 数据统计 → 我的设置”路径。

- [ ] **Step 3: 同视口视觉 QA**

分别将训练页与方案 2、数据页与方案 3 放入同一比较画布，修复 P0/P1/P2。

- [ ] **Step 4: 最终验证**

Run: `npm test && npm run build`
Expected: 0 failed，build exit 0；`design-qa.md` 以 `final result: passed` 结束。

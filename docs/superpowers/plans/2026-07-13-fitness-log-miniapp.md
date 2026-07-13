# 铸力健身记录小程序 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个忠实还原方案 1、可在 390 × 844 手机视口交互预览的健身记录小程序原型。

**Architecture:** 使用 Product Design React 原型模板，单页状态机管理首页、训练与导航状态。组件按用户场景拆分，样式通过 CSS 变量复用统一设计令牌。

**Tech Stack:** React、Vite、CSS、Vitest/Testing Library（沿用原型模板配置）

## Global Constraints

- 视觉基准是已确认的方案 1 图片，不自行改变配色、层级或内容顺序。
- 主视口固定为 390 × 844，并适配更窄手机宽度。
- 不接入后端、登录、支付、社交或真实数据同步。
- 禁止渐变、玻璃拟态、摄影和自绘 SVG；图标使用模板已有图标库。

---

### Task 1: 原型骨架与行为测试

**Files:**
- Create: `src/App.test.jsx`
- Modify: `src/App.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `App` 单页原型；`activeTab` 和 `workoutStarted` 页面状态。

- [ ] **Step 1: 写失败测试**

  覆盖首页关键文案、点击“开始训练”进入训练状态、点击导航更新选中状态。

- [ ] **Step 2: 验证测试因功能缺失而失败**

  Run: `npm test -- --run`
  Expected: FAIL，原因是首页或交互元素尚未实现。

- [ ] **Step 3: 实现最小组件状态机**

  在 `App.jsx` 中实现首页、训练面板和底部导航，不添加范围外路由。

- [ ] **Step 4: 验证测试通过**

  Run: `npm test -- --run`
  Expected: PASS，0 failed。

### Task 2: 视觉系统与参考图还原

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: Task 1 的状态机和组件结构。
- Produces: 390 × 844 的深色首页及训练状态。

- [ ] **Step 1: 建立令牌与布局**

  定义背景、表面、文字、青柠强调色、边框、圆角、间距和字号变量。

- [ ] **Step 2: 还原首页结构**

  实现品牌区、问候、周节奏、训练摘要、本周训练量和底部导航。

- [ ] **Step 3: 实现训练状态视觉**

  复用同一套视觉语言实现计时、动作、组数与完成反馈。

- [ ] **Step 4: 构建检查**

  Run: `npm run build`
  Expected: exit 0，无编译错误。

### Task 3: 浏览器验证与设计 QA

**Files:**
- Create: `design-qa.md`
- Create: `artifacts/home-390x844.png`

**Interfaces:**
- Consumes: 本地运行的原型和方案 1 参考图。
- Produces: 通过的 QA 报告与实现截图。

- [ ] **Step 1: 启动本地预览**

  Run: `npm run dev -- --host 127.0.0.1 --port 4173`
  Expected: 本地页面可访问。

- [ ] **Step 2: 检查核心交互**

  在 390 × 844 视口检查首页、开始训练、完成一组、导航切换和返回。

- [ ] **Step 3: 同视口视觉比较并修复**

  将参考图与实现截图放入同一比较画布，检查文案、布局、字体、颜色、图标和间距；修复所有 P0/P1/P2。

- [ ] **Step 4: 写 QA 报告并最终验证**

  `design-qa.md` 必须记录比较证据、交互检查、控制台错误与 `final result: passed`。

# Design QA

## Comparison Targets

### Training

- Source visual truth: `/Users/zhaoxuezhi/.codex/generated_images/019f5998-76a8-7890-bcb3-5cd0fa360ccb/exec-fb0fd64a-d638-4cf9-a797-186df8716b10.png`
- Implementation screenshot: `/Users/zhaoxuezhi/Documents/demo/fitness-log-miniapp/artifacts-training-no-rest-bar-final.png`
- Combined comparison: `/Users/zhaoxuezhi/Documents/demo/fitness-log-miniapp/artifacts-comparison-training-no-rest-bar.png`
- State: 推力 A，两个力量动作，2 组完成；用户指定移除休息计时栏。

### Analytics

- Source visual truth: `/Users/zhaoxuezhi/.codex/generated_images/019f5998-76a8-7890-bcb3-5cd0fa360ccb/exec-ad37844c-c2ca-4765-b94d-80274bc3b1d2.png`
- Implementation screenshot: `/Users/zhaoxuezhi/Documents/demo/fitness-log-miniapp/artifacts-data-390x844-v1.png`
- Combined comparison: `/Users/zhaoxuezhi/Documents/demo/fitness-log-miniapp/artifacts-comparison-data.png`
- State: 完成包含 5.2 km、31 分钟户外跑步的训练后，总览统计更新。

### Profile

- Implementation screenshot: `/Users/zhaoxuezhi/Documents/demo/fitness-log-miniapp/artifacts-profile-390x844-v1.png`
- Design source: approved dark brand system from option 1 plus the user-requested mainstream personal-management structure.

All screenshots use the Codex in-app Browser at `http://127.0.0.1:4173/` with a 390 × 844 viewport.

## Full-view Comparison Evidence

- Training preserves option 2's true-white surface, cobalt action color, centered session header, open row table, circular set indices, lightweight dividers, blue completed states, and second exercise continuation. The fixed rest strip was removed by explicit user annotation.
- Analytics preserves option 3's off-white surface, condensed black display numerals, signal-orange accent, squared dark performance panel, line chart, metric band, dense record rows, and orange selected navigation.
- Profile continues the established near-black and lime brand system with a compact identity header, goal progress, personal totals, and grouped settings rows.

Focused crops were not required: both normalized comparisons keep each 390 px screen at native readable scale, so labels, numbers, controls, divider rhythm, icon weight, and navigation states are legible in the full-view artifacts.

## Required Fidelity Surfaces

- Fonts and typography: PingFang SC/system sans is used for Chinese UI; Impact/Arial Narrow is limited to option 3-style performance numerals. No clipped or unintended wrapping is visible.
- Spacing and layout rhythm: all screens maintain 390 px width, persistent 82 px bottom navigation, scrollable content, and reachable primary actions. Training rows and analytics bands align to their source density.
- Colors and tokens: training uses white/black/`#1265ee`; analytics uses `#f7f5ef`/`#1b1b1b`/`#ff5a1f`; home/profile use near-black/graphite/`#b8ff22`.
- Image and icon fidelity: the updated screens require no photography. All UI icons use one Phosphor family; charts use Recharts rather than placeholders or handcrafted SVG.
- Copy and content: training metrics, projects, totals, distance, duration, pace, and project records are generated from the current state and completed sessions.

## Findings

- No actionable P0, P1, or P2 findings remain.
- [P3] Option 2 includes an RPE column; the implementation uses a completion column because the composable metric model makes RPE optional rather than universal.
- [P3] Option 3 includes a muscle-balance illustration; the implementation intentionally uses recorded-project performance because the user requested statistics generated from completed training projects.

## Comparison History

### Training pass 1

- [P2] Initial implementation showed only one exercise and lacked the fixed rest strip, leaving excessive empty space compared with option 2.
- Fix: added a second seeded strength exercise, exact per-exercise set completion, and the fixed `休息 01:24 / 跳过` bar.
- Post-fix evidence: `artifacts-comparison-training-final.png` shows the restored density and footer anatomy.

### User annotation pass

- User marked the entire `休息 01:24 / 跳过` fixed bar for removal.
- Fix: removed the bar markup and styles, reduced training-screen bottom padding from 154 px to 102 px, and kept the primary navigation directly below the training content.
- Post-fix evidence: `artifacts-training-no-rest-bar-final.png`; DOM checks found zero exact `休息` labels and zero `跳过` buttons.

### Analytics pass 1

- No P0/P1/P2 mismatch was found. The source's performance hierarchy was preserved while the fixed muscle-analysis region was intentionally replaced by live project statistics.

## Functional Verification

- Added the preset “户外跑步”, entered `5.2 km` and `31 分钟`, completed the workout, and observed the data page update to 4 sessions, 10.2 km, 149 minutes, and project-specific totals.
- Opened the custom-project builder, verified the empty-name validation message, then created “农夫行走” with weight, distance, and duration combined.
- Completed a named set and verified only that exercise/set changed.
- Switched the profile unit preference from `kg · km` to `lb · mi` and verified the row updated.
- Browser console errors/warnings: none.

## Intentional Deviations

- The global navigation remains 首页 / 训练 / 数据 / 我的 so the four visual systems belong to one app.
- Analytics prioritizes actual session-derived project performance over the concept's static muscle-balance illustration.
- Backend persistence, GPS, login, cloud sync, and system notifications remain out of scope.

final result: passed

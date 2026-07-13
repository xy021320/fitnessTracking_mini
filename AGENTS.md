# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Confirmed Product Direction

- Audience: consistent intermediate strength trainees.
- Selected visual: ideation option 1, the dark near-black training cockpit with electric lime accents.
- Primary product promise: start today's workout quickly, log sets with low friction, and see weekly strength-training progress.
- Custom exercises use composable metrics rather than exclusive exercise types: weight, reps, sets, duration, and distance can be combined per exercise.
- Training screen follows ideation option 2's white-and-cobalt efficient logging style; analytics follows option 3's off-white, charcoal, and orange performance style.
- The WeChat Mini Program lives in `miniapp/`, uses Taro 4.2.0 + React and persists device-local state under `zhu-li-app-state-v1`.
- WeChat AppID is configured as `wxcbad07e3fb2b6b8e`; WeChat DevTools should import the `miniapp/` root, whose `miniprogramRoot` points to `dist/`.

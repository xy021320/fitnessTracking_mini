import test from "node:test";
import assert from "node:assert/strict";
import {
  appendExercise,
  createExercise,
  deriveAnalytics,
  initialAppState,
  reduceAppState,
} from "./app-state.js";

test("creates an exercise with composable metrics", () => {
  const result = createExercise({
    id: "outdoor-run",
    name: "户外跑步",
    category: "cardio",
    metrics: ["distance", "duration"],
  });

  assert.equal(result.name, "户外跑步");
  assert.deepEqual(result.metrics, ["distance", "duration"]);
});

test("allows strength exercises to combine weight reps and sets", () => {
  const result = createExercise({
    name: "哑铃卧推",
    category: "strength",
    metrics: ["weight", "reps", "sets"],
  });

  assert.deepEqual(result.metrics, ["weight", "reps", "sets"]);
});

test("rejects an exercise without a name or metrics", () => {
  assert.throws(() => createExercise({ name: "", metrics: ["reps"] }), /名称/);
  assert.throws(() => createExercise({ name: "跳绳", metrics: [] }), /指标/);
});

test("appends a custom exercise to the library and current workout", () => {
  const running = createExercise({
    id: "trail-run",
    name: "越野跑",
    category: "cardio",
    metrics: ["distance", "duration"],
  });
  const next = appendExercise(initialAppState, running);

  assert.equal(next.exerciseLibrary.at(-1).name, "越野跑");
  assert.equal(next.currentExercises.at(-1).id, "trail-run");
});

test("derives strength volume distance and pace from completed sessions", () => {
  const sessions = [
    {
      id: "strength-session",
      date: "2026-07-11",
      duration: 40,
      entries: [{
        id: "bench",
        name: "杠铃卧推",
        category: "strength",
        sets: [{ weight: 80, reps: 8, completed: true }],
      }],
    },
    {
      id: "run-session",
      date: "2026-07-12",
      duration: 30,
      entries: [{
        id: "outdoor-run",
        name: "户外跑步",
        category: "cardio",
        distance: 5,
        duration: 30,
        completed: true,
      }],
    },
  ];
  const analytics = deriveAnalytics(sessions);

  assert.equal(analytics.totalVolume, 640);
  assert.equal(analytics.totalDistance, 5);
  assert.equal(analytics.averagePace, 6);
  assert.equal(analytics.sessionCount, 2);
});

test("starts today's workout from the home screen", () => {
  const next = reduceAppState(initialAppState, { type: "START_WORKOUT" });

  assert.equal(next.activeTab, "training");
  assert.equal(next.workoutStarted, true);
  assert.equal(next.completedSets, 2);
});

test("marks the current set complete", () => {
  const active = reduceAppState(initialAppState, { type: "START_WORKOUT" });
  const next = reduceAppState(active, { type: "COMPLETE_SET" });

  assert.equal(next.completedSets, 3);
});

test("marks a set complete on the selected exercise", () => {
  const state = {
    ...initialAppState,
    currentExercises: [
      { id: "bench", sets: [{ weight: 80, reps: 8, completed: true }] },
      { id: "incline", sets: [{ weight: 28, reps: 10, completed: false }] },
    ],
  };
  const next = reduceAppState(state, { type: "COMPLETE_SET", exerciseId: "incline", setIndex: 0 });

  assert.equal(next.currentExercises[0].sets[0].completed, true);
  assert.equal(next.currentExercises[1].sets[0].completed, true);
});

test("switches tabs and returns home without discarding workout progress", () => {
  const active = reduceAppState(initialAppState, { type: "START_WORKOUT" });
  const completed = reduceAppState(active, { type: "COMPLETE_SET" });
  const next = reduceAppState(completed, { type: "SELECT_TAB", tab: "home" });

  assert.equal(next.activeTab, "home");
  assert.equal(next.workoutStarted, true);
  assert.equal(next.completedSets, 3);
});

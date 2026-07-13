const ALLOWED_METRICS = new Set(["weight", "reps", "sets", "duration", "distance"]);

export const metricLabels = Object.freeze({
  weight: "重量",
  reps: "次数",
  sets: "组数",
  duration: "时长",
  distance: "距离",
});

const presetExercises = [
  { id: "barbell-bench", name: "杠铃卧推", category: "strength", metrics: ["weight", "reps", "sets"] },
  { id: "jump-rope", name: "跳绳", category: "cardio", metrics: ["reps", "duration"] },
  { id: "outdoor-run", name: "户外跑步", category: "cardio", metrics: ["distance", "duration"] },
  { id: "plank", name: "平板支撑", category: "conditioning", metrics: ["duration", "sets"] },
];

const seedSessions = [
  {
    id: "session-2026-07-11",
    date: "2026-07-11",
    duration: 64,
    entries: [
      {
        id: "barbell-bench",
        name: "杠铃卧推",
        category: "strength",
        sets: [
          { weight: 80, reps: 8, completed: true },
          { weight: 80, reps: 8, completed: true },
          { weight: 82.5, reps: 6, completed: true },
        ],
      },
      {
        id: "dumbbell-press",
        name: "上斜哑铃卧推",
        category: "strength",
        sets: [
          { weight: 28, reps: 10, completed: true },
          { weight: 28, reps: 9, completed: true },
        ],
      },
    ],
  },
  {
    id: "session-2026-07-09",
    date: "2026-07-09",
    duration: 32,
    entries: [
      { id: "outdoor-run", name: "户外跑步", category: "cardio", distance: 5, duration: 30, completed: true },
    ],
  },
  {
    id: "session-2026-07-07",
    date: "2026-07-07",
    duration: 20,
    entries: [
      { id: "jump-rope", name: "跳绳", category: "cardio", reps: 1200, duration: 12, completed: true },
      { id: "plank", name: "平板支撑", category: "conditioning", duration: 5, setsCount: 3, completed: true },
    ],
  },
];

export function createExercise(input) {
  const name = input.name?.trim();
  if (!name) throw new Error("请输入项目名称");

  const metrics = [...new Set(input.metrics ?? [])].filter((metric) => ALLOWED_METRICS.has(metric));
  if (metrics.length === 0) throw new Error("请至少选择一个记录指标");

  return {
    id: input.id || `custom-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    category: input.category || "custom",
    metrics,
    custom: input.custom ?? !input.id,
  };
}

export function appendExercise(state, exercise) {
  const exists = state.exerciseLibrary.some((item) => item.id === exercise.id);
  return {
    ...state,
    exerciseLibrary: exists ? state.exerciseLibrary : [...state.exerciseLibrary, exercise],
    currentExercises: [...state.currentExercises, { ...exercise, values: {} }],
  };
}

function sumStrengthVolume(entry) {
  return (entry.sets ?? []).reduce((total, set) => {
    if (!set.completed) return total;
    return total + Math.max(0, Number(set.weight) || 0) * Math.max(0, Number(set.reps) || 0);
  }, 0);
}

export function deriveAnalytics(sessions) {
  const projectMap = new Map();
  let totalDuration = 0;
  let totalVolume = 0;
  let totalDistance = 0;
  let cardioDuration = 0;

  const trend = sessions.map((session) => {
    let sessionVolume = 0;
    let sessionDistance = 0;
    totalDuration += Math.max(0, Number(session.duration) || 0);

    for (const entry of session.entries ?? []) {
      const volume = sumStrengthVolume(entry);
      const distance = entry.completed === false ? 0 : Math.max(0, Number(entry.distance) || 0);
      const duration = entry.completed === false ? 0 : Math.max(0, Number(entry.duration) || 0);
      const repsFromSets = (entry.sets ?? []).reduce((sum, set) => sum + (set.completed ? Math.max(0, Number(set.reps) || 0) : 0), 0);
      const reps = Math.max(0, Number(entry.reps) || 0) + repsFromSets;
      const maxWeight = Math.max(0, ...(entry.sets ?? []).filter((set) => set.completed).map((set) => Number(set.weight) || 0));

      sessionVolume += volume;
      sessionDistance += distance;
      if (distance > 0) cardioDuration += duration;

      const current = projectMap.get(entry.id) ?? {
        id: entry.id,
        name: entry.name,
        category: entry.category,
        sessions: 0,
        volume: 0,
        distance: 0,
        duration: 0,
        reps: 0,
        maxWeight: 0,
        latestDate: session.date,
      };
      current.sessions += 1;
      current.volume += volume;
      current.distance += distance;
      current.duration += duration;
      current.reps += reps;
      current.maxWeight = Math.max(current.maxWeight, maxWeight);
      if (session.date > current.latestDate) current.latestDate = session.date;
      projectMap.set(entry.id, current);
    }

    totalVolume += sessionVolume;
    totalDistance += sessionDistance;
    return { date: session.date.slice(5).replace("-", "/"), volume: sessionVolume, distance: sessionDistance };
  });

  return {
    sessionCount: sessions.length,
    totalDuration,
    totalVolume,
    totalDistance,
    averagePace: totalDistance > 0 ? cardioDuration / totalDistance : 0,
    projects: [...projectMap.values()].sort((a, b) => (b.volume + b.distance + b.reps) - (a.volume + a.distance + a.reps)),
    trend: trend.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export const initialAppState = Object.freeze({
  activeTab: "home",
  workoutStarted: false,
  completedSets: 2,
  exerciseLibrary: presetExercises,
  currentExercises: [
    {
      ...presetExercises[0],
      sets: [
        { weight: 60, reps: 10, completed: true },
        { weight: 80, reps: 8, completed: true },
        { weight: 80, reps: 8, completed: false },
      ],
    },
    {
      id: "dumbbell-incline",
      name: "上斜哑铃卧推",
      category: "strength",
      metrics: ["weight", "reps", "sets"],
      sets: [
        { weight: 22.5, reps: 10, completed: false },
        { weight: 22.5, reps: 10, completed: false },
      ],
    },
  ],
  sessions: seedSessions,
  lastCompletedSession: null,
});

export function reduceAppState(state, action) {
  switch (action.type) {
    case "START_WORKOUT":
      return { ...state, activeTab: "training", workoutStarted: true };
    case "COMPLETE_SET":
      return {
        ...state,
        completedSets: Math.min(state.completedSets + 1, 18),
        currentExercises: state.currentExercises.map((exercise, exerciseIndex) => {
          const selected = action.exerciseId ? exercise.id === action.exerciseId : exerciseIndex === 0;
          if (!selected || !exercise.sets) return exercise;
          const targetIndex = Number.isInteger(action.setIndex) ? action.setIndex : state.completedSets;
          return { ...exercise, sets: exercise.sets.map((set, setIndex) => setIndex === targetIndex ? { ...set, completed: true } : set) };
        }),
      };
    case "ADD_EXERCISE":
      return appendExercise(state, action.exercise);
    case "COMPLETE_WORKOUT": {
      const session = {
        id: action.session.id || `session-${action.session.date}`,
        ...action.session,
        entries: action.session.entries.map((entry) => ({ ...entry })),
      };
      return {
        ...state,
        activeTab: "data",
        workoutStarted: false,
        sessions: [...state.sessions, session],
        lastCompletedSession: session,
      };
    }
    case "SELECT_TAB":
      return { ...state, activeTab: action.tab };
    default:
      return state;
  }
}

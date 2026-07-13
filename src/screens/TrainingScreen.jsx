import { useEffect, useMemo, useState } from "react";
import { Clock, Plus } from "@phosphor-icons/react";
import { AddExerciseSheet } from "../components/AddExerciseSheet.jsx";
import { ExerciseLogger } from "../components/ExerciseLogger.jsx";

export function TrainingScreen({ state, dispatch }) {
  const [seconds, setSeconds] = useState(32 * 60 + 18);
  const [showSheet, setShowSheet] = useState(false);
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const completedCount = useMemo(() => state.currentExercises.reduce((total, exercise) => (
    total + (exercise.sets?.filter((set) => set.completed).length ?? (Object.values(values[exercise.id] ?? {}).some((value) => Number(value) > 0) ? 1 : 0))
  ), 0), [state.currentExercises, values]);

  const updateValue = (exerciseId, metric, value) => {
    setValues((current) => ({ ...current, [exerciseId]: { ...current[exerciseId], [metric]: value } }));
  };

  const finishWorkout = () => {
    const entries = state.currentExercises.map((exercise) => {
      if (exercise.sets) return { ...exercise, sets: exercise.sets.map((set) => ({ ...set })) };
      const itemValues = values[exercise.id] ?? {};
      return {
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        ...Object.fromEntries(Object.entries(itemValues).map(([key, value]) => [key === "sets" ? "setsCount" : key, Math.max(0, Number(value) || 0)])),
        completed: Object.values(itemValues).some((value) => Number(value) > 0),
      };
    }).filter((entry) => entry.sets?.some((set) => set.completed) || entry.completed);

    if (entries.length === 0) return;
    setSaved(true);
    window.setTimeout(() => dispatch({
      type: "COMPLETE_WORKOUT",
      session: { id: "session-2026-07-13", date: "2026-07-13", duration: Math.round(seconds / 60), entries },
    }), 450);
  };

  const timeLabel = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="screen-scroll training-screen">
      <header className="training-header">
        <span className="training-brand">练迹</span>
        <div><h1>推力 A</h1><span><Clock /> {timeLabel}</span></div>
        <button onClick={finishWorkout} disabled={completedCount === 0}>结束</button>
      </header>

      <div className="training-progress"><span>已完成 {completedCount} 组 / 项</span><strong>{state.currentExercises.length} 个项目</strong></div>

      {state.currentExercises.map((exercise) => (
        <ExerciseLogger
          key={exercise.id}
          exercise={exercise}
          values={values[exercise.id]}
          onChange={(metric, value) => updateValue(exercise.id, metric, value)}
          onCompleteSet={(setIndex) => dispatch({ type: "COMPLETE_SET", exerciseId: exercise.id, setIndex })}
        />
      ))}

      <button className="add-exercise-button" onClick={() => setShowSheet(true)}><Plus weight="bold" /> 添加训练项目</button>
      <button className="complete-workout-button" onClick={finishWorkout} disabled={completedCount === 0}>{saved ? "训练已保存" : "完成训练"}</button>

      {showSheet && <AddExerciseSheet onClose={() => setShowSheet(false)} onAdd={(exercise) => dispatch({ type: "ADD_EXERCISE", exercise })} />}
    </div>
  );
}

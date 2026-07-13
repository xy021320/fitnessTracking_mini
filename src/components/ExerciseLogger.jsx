import { Check, Plus } from "@phosphor-icons/react";
import { metricLabels } from "../app-state.js";

const inputMeta = {
  weight: { unit: "kg", step: "0.5", placeholder: "0" },
  reps: { unit: "次", step: "1", placeholder: "0" },
  sets: { unit: "组", step: "1", placeholder: "1" },
  duration: { unit: "分钟", step: "1", placeholder: "0" },
  distance: { unit: "km", step: "0.1", placeholder: "0.0" },
};

function StrengthLogger({ exercise, onCompleteSet }) {
  return (
    <section className="training-exercise strength-logger">
      <header><div><h2>{exercise.name}</h2><p>上次 80kg × 8</p></div><button>记录</button></header>
      <div className="training-set-head"><span>组</span><span>重量 kg</span><span>次数</span><span>完成</span></div>
      {(exercise.sets ?? []).map((set, index) => (
        <div className={`training-set-row ${set.completed ? "done" : ""}`} key={`${exercise.id}-${index}`}>
          <span className="set-index">{index + 1}</span>
          <span className="set-value">{set.weight}</span>
          <span className="set-value">{set.reps}</span>
          <button aria-label={`完成${exercise.name}第 ${index + 1} 组`} disabled={set.completed} onClick={() => onCompleteSet(index)}>
            {set.completed ? <Check weight="bold" /> : "完成"}
          </button>
        </div>
      ))}
      <button className="training-add-set"><Plus weight="bold" /> 添加一组</button>
    </section>
  );
}

export function ExerciseLogger({ exercise, values, onChange, onCompleteSet }) {
  if (exercise.metrics.includes("weight") && exercise.metrics.includes("reps") && exercise.sets) {
    return <StrengthLogger exercise={exercise} onCompleteSet={onCompleteSet} />;
  }

  return (
    <section className="training-exercise metric-logger">
      <header><div><h2>{exercise.name}</h2><p>{exercise.metrics.map((metric) => metricLabels[metric]).join(" · ")}</p></div><span>{exercise.category === "cardio" ? "有氧" : "自定义"}</span></header>
      <div className="metric-inputs">
        {exercise.metrics.map((metric) => (
          <label key={metric}>
            <span>{metricLabels[metric]}</span>
            <div><input type="number" min="0" step={inputMeta[metric].step} placeholder={inputMeta[metric].placeholder} value={values?.[metric] ?? ""} onChange={(event) => onChange(metric, event.target.value)} /><small>{inputMeta[metric].unit}</small></div>
          </label>
        ))}
      </div>
    </section>
  );
}

import { useState } from "react";
import {
  Barbell,
  PersonSimpleRun,
  Plus,
  Timer,
  X,
} from "@phosphor-icons/react";
import { createExercise, metricLabels } from "../app-state.js";

const presets = [
  { id: "barbell-bench", name: "杠铃卧推", category: "strength", metrics: ["weight", "reps", "sets"], Icon: Barbell },
  { id: "jump-rope", name: "跳绳", category: "cardio", metrics: ["reps", "duration"], Icon: Timer },
  { id: "outdoor-run", name: "户外跑步", category: "cardio", metrics: ["distance", "duration"], Icon: PersonSimpleRun },
  { id: "plank", name: "平板支撑", category: "conditioning", metrics: ["duration", "sets"], Icon: Timer },
];

const metricOptions = Object.entries(metricLabels);

export function AddExerciseSheet({ onClose, onAdd }) {
  const [customMode, setCustomMode] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("custom");
  const [metrics, setMetrics] = useState([]);
  const [error, setError] = useState("");

  const toggleMetric = (metric) => {
    setError("");
    setMetrics((current) => current.includes(metric)
      ? current.filter((item) => item !== metric)
      : [...current, metric]);
  };

  const submitCustom = () => {
    try {
      onAdd(createExercise({ name, category, metrics }));
      onClose();
    } catch (validationError) {
      setError(validationError.message);
    }
  };

  return (
    <div className="sheet-backdrop" role="presentation">
      <section className="exercise-sheet" role="dialog" aria-modal="true" aria-labelledby="add-exercise-title">
        <header>
          <div><span>训练项目</span><h2 id="add-exercise-title">{customMode ? "创建自定义项目" : "添加项目"}</h2></div>
          <button onClick={onClose} aria-label="关闭添加项目"><X /></button>
        </header>

        {!customMode ? (
          <>
            <div className="preset-list">
              {presets.map(({ Icon, ...preset }) => (
                <button key={preset.id} onClick={() => { onAdd(createExercise({ ...preset, custom: false })); onClose(); }}>
                  <span className="preset-icon"><Icon weight="regular" /></span>
                  <span><strong>{preset.name}</strong><small>{preset.metrics.map((metric) => metricLabels[metric]).join(" · ")}</small></span>
                  <Plus weight="bold" />
                </button>
              ))}
            </div>
            <button className="create-custom" onClick={() => setCustomMode(true)}><Plus weight="bold" /> 创建自定义项目</button>
          </>
        ) : (
          <div className="custom-form">
            <label>项目名称<input value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder="例如：农夫行走" /></label>
            <label>项目分类
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="strength">力量</option>
                <option value="cardio">有氧</option>
                <option value="conditioning">体能</option>
                <option value="mobility">灵活性</option>
                <option value="custom">自定义</option>
              </select>
            </label>
            <fieldset>
              <legend>记录指标 <small>可多选</small></legend>
              <div className="metric-grid">
                {metricOptions.map(([metric, label]) => (
                  <button type="button" key={metric} className={metrics.includes(metric) ? "selected" : ""} onClick={() => toggleMetric(metric)}>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="sheet-primary" onClick={submitCustom}>保存并添加</button>
          </div>
        )}
      </section>
    </div>
  );
}

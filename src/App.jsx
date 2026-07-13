import { useEffect, useReducer, useState } from "react";
import {
  Barbell,
  Bell,
  CalendarBlank,
  ChartBar,
  Check,
  Clock,
  House,
  PersonSimple,
  PersonSimpleTaiChi,
  PersonSimpleThrow,
  Play,
  Plus,
  TrendUp,
  User,
  X,
} from "@phosphor-icons/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { initialAppState, reduceAppState } from "./app-state.js";
import { TrainingScreen } from "./screens/TrainingScreen.jsx";
import { AnalyticsScreen } from "./screens/AnalyticsScreen.jsx";
import { ProfileScreen } from "./screens/ProfileScreen.jsx";

const week = [
  { day: "一", date: 13, active: true },
  { day: "二", date: 14 },
  { day: "三", date: 15 },
  { day: "四", date: 16 },
  { day: "五", date: 17 },
  { day: "六", date: 18 },
  { day: "日", date: 19 },
];

const volumeData = [
  { day: "7/7", value: 11200 },
  { day: "7/8", value: 11950 },
  { day: "7/9", value: 16000 },
  { day: "7/10", value: 12500 },
  { day: "7/11", value: 15100 },
  { day: "7/12", value: 13800 },
  { day: "7/13", value: 18420 },
];

const navItems = [
  { id: "home", label: "首页", Icon: House },
  { id: "training", label: "训练", Icon: Barbell },
  { id: "data", label: "数据", Icon: ChartBar },
  { id: "profile", label: "我的", Icon: User },
];

function BrandHeader() {
  return (
    <header className="brand-header">
      <span className="wordmark">铸力</span>
      <div className="header-actions" aria-label="快捷操作">
        <button className="icon-button" aria-label="训练日历"><CalendarBlank weight="regular" /></button>
        <button className="icon-button notification" aria-label="消息"><Bell weight="regular" /></button>
      </div>
    </header>
  );
}

function WeekStrip() {
  return (
    <section className="week-strip" aria-label="本周训练计划">
      {week.map((item) => (
        <div className={`week-day ${item.active ? "active" : ""}`} key={item.date}>
          <span>{item.day}</span>
          <strong>{item.date}</strong>
          <i aria-hidden="true" />
        </div>
      ))}
    </section>
  );
}

function WorkoutCard({ onStart, workoutStarted }) {
  return (
    <section className="workout-card" aria-labelledby="today-workout">
      <div className="workout-title-row">
        <div className="workout-icon"><Barbell weight="regular" /></div>
        <div>
          <h2 id="today-workout">推力 A · 胸肩三头</h2>
          <p>6 个动作 · 预计 68 分钟</p>
        </div>
      </div>
      <div className="muscle-list" aria-label="目标肌群">
        <span><PersonSimple weight="regular" />胸部</span>
        <span><PersonSimpleTaiChi weight="regular" />肩部</span>
        <span><PersonSimpleThrow weight="regular" />三头肌</span>
      </div>
      <button className="primary-button" onClick={onStart}>
        <Play weight="fill" />{workoutStarted ? "继续训练" : "开始训练"}
      </button>
    </section>
  );
}

function VolumeChart() {
  return (
    <section className="volume-card" aria-labelledby="volume-heading">
      <div className="volume-heading-row">
        <h2 id="volume-heading">本周训练量</h2>
        <span>对比上周 <b><TrendUp weight="bold" /> +8.6%</b></span>
      </div>
      <div className="volume-total"><strong>18,420</strong><span>kg</span></div>
      <div className="chart-wrap" aria-label="7 月 7 日至 7 月 13 日训练量上升趋势">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={volumeData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="#303237" strokeDasharray="3 4" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#888b91", fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6f7278", fontSize: 9 }} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip contentStyle={{ background: "#17191c", border: "1px solid #34373c", borderRadius: 10, fontSize: 11 }} formatter={(v) => [`${v.toLocaleString()} kg`, "训练量"]} />
            <Line isAnimationActive={false} type="monotone" dataKey="value" stroke="#b8ff22" strokeWidth={3} dot={{ r: 3, fill: "#b8ff22", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#0d0e10", stroke: "#b8ff22", strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function HomeScreen({ onStart, workoutStarted }) {
  return (
    <div className="screen-scroll home-screen">
      <BrandHeader />
      <section className="greeting">
        <h1>晚上好，继续变强</h1>
        <p>今天是 2026-07-13，星期一</p>
      </section>
      <WeekStrip />
      <WorkoutCard onStart={onStart} workoutStarted={workoutStarted} />
      <VolumeChart />
    </div>
  );
}

function SetRow({ index, weight, reps, completed, active, onComplete }) {
  return (
    <div className={`set-row ${completed ? "completed" : ""} ${active ? "current" : ""}`}>
      <span className="set-number">{index}</span>
      <span>{weight}<small> kg</small></span>
      <span>{reps}<small> 次</small></span>
      <button aria-label={`完成第 ${index} 组`} onClick={onComplete} disabled={completed}>
        {completed ? <Check weight="bold" /> : <span>完成</span>}
      </button>
    </div>
  );
}

function ActiveWorkout({ completedSets, onCompleteSet, onClose }) {
  const [seconds, setSeconds] = useState(32 * 60 + 18);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <div className="screen-scroll active-workout-screen">
      <header className="session-header">
        <button className="icon-button" onClick={onClose} aria-label="返回首页"><X /></button>
        <div><strong>推力 A</strong><span><Clock /> {minutes}:{secs}</span></div>
        <button className="finish-button" onClick={onClose}>结束</button>
      </header>

      <section className="session-summary">
        <span>训练进度</span>
        <strong>{completedSets} / 18 组</strong>
        <div><i style={{ width: `${(completedSets / 18) * 100}%` }} /></div>
      </section>

      <section className="exercise-panel">
        <div className="exercise-title">
          <div className="workout-icon small"><Barbell /></div>
          <div><h1>杠铃卧推</h1><p>上次 80 kg × 8</p></div>
        </div>
        <div className="set-head"><span>组</span><span>重量</span><span>次数</span><span>状态</span></div>
        {[1, 2, 3, 4].map((index) => (
          <SetRow
            key={index}
            index={index}
            weight={index === 1 ? 60 : 80}
            reps={index === 1 ? 10 : 8}
            completed={index <= completedSets}
            active={index === completedSets + 1}
            onComplete={onCompleteSet}
          />
        ))}
        <button className="add-set"><Plus weight="bold" /> 添加一组</button>
      </section>

      <section className="next-exercise">
        <span>下一个动作</span><strong>上斜哑铃卧推</strong><small>4 组 × 8–10 次</small>
      </section>
    </div>
  );
}

function PlaceholderScreen({ tab }) {
  const content = {
    training: ["训练计划", "推力 A · 进行中", "继续完成今天的训练，当前已完成 2 组。"],
    data: ["训练数据", "稳定进步中", "过去 12 周卧推估算 1RM 提升了 7.5 kg。"],
    profile: ["我的", "本周已训练 3 次", "保持节奏，比偶尔拼尽全力更重要。"],
  }[tab];
  return (
    <div className="screen-scroll placeholder-screen">
      <BrandHeader />
      <span className="eyebrow">{content[0]}</span>
      <h1>{content[1]}</h1>
      <p>{content[2]}</p>
      <div className="placeholder-stat"><strong>{tab === "data" ? "+8.6%" : tab === "profile" ? "3 / 4" : "32:18"}</strong><span>{tab === "data" ? "训练量增长" : tab === "profile" ? "本周训练" : "当前时长"}</span></div>
    </div>
  );
}

function BottomNav({ activeTab, onSelect }) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {navItems.map(({ id, label, Icon }) => (
        <button key={id} className={activeTab === id ? "active" : ""} onClick={() => onSelect(id)} aria-current={activeTab === id ? "page" : undefined}>
          <Icon weight={activeTab === id ? "fill" : "regular"} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function App() {
  const [state, dispatch] = useReducer(reduceAppState, initialAppState);
  const startWorkout = () => dispatch({ type: "START_WORKOUT" });
  const selectTab = (tab) => dispatch({ type: "SELECT_TAB", tab });

  return (
    <main className="app-stage">
      <div className={`mobile-prototype tab-${state.activeTab}`}>
        {state.activeTab === "home" && <HomeScreen onStart={startWorkout} workoutStarted={state.workoutStarted} />}
        {state.activeTab === "training" && <TrainingScreen state={state} dispatch={dispatch} />}
        {state.activeTab === "data" && <AnalyticsScreen sessions={state.sessions} />}
        {state.activeTab === "profile" && <ProfileScreen exerciseCount={state.exerciseLibrary.length} />}
        <BottomNav activeTab={state.activeTab} onSelect={selectTab} />
      </div>
    </main>
  );
}

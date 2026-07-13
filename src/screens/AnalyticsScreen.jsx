import { useMemo, useState } from "react";
import {
  Barbell,
  CalendarBlank,
  ChartLineUp,
  Clock,
  PersonSimpleRun,
  Trophy,
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
import { deriveAnalytics } from "../app-state.js";

const filters = [
  { id: "overview", label: "总览" },
  { id: "strength", label: "力量" },
  { id: "cardio", label: "有氧" },
];

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value).toLocaleString("zh-CN", { maximumFractionDigits });
}

function ProjectValue({ project }) {
  if (project.category === "strength") return <><strong>{formatNumber(project.volume)}</strong><small>kg 训练量</small></>;
  if (project.distance > 0) return <><strong>{formatNumber(project.distance, 1)}</strong><small>km</small></>;
  if (project.reps > 0) return <><strong>{formatNumber(project.reps)}</strong><small>次</small></>;
  return <><strong>{formatNumber(project.duration)}</strong><small>分钟</small></>;
}

export function AnalyticsScreen({ sessions }) {
  const [filter, setFilter] = useState("overview");
  const analytics = useMemo(() => deriveAnalytics(sessions), [sessions]);
  const projects = analytics.projects.filter((project) => (
    filter === "overview" || project.category === filter
  ));
  const strengthProjects = analytics.projects.filter((project) => project.category === "strength");
  const maxWeight = Math.max(0, ...strengthProjects.map((project) => project.maxWeight));
  const primary = filter === "strength"
    ? { label: "力量训练量", value: formatNumber(analytics.totalVolume), unit: "kg", change: "+8.6%" }
    : filter === "cardio"
      ? { label: "累计有氧距离", value: formatNumber(analytics.totalDistance, 1), unit: "km", change: `${formatNumber(analytics.averagePace, 1)}′ 配速` }
      : { label: "累计训练表现", value: formatNumber(analytics.totalVolume), unit: "kg", change: `${analytics.sessionCount} 次训练` };

  return (
    <div className="screen-scroll analytics-screen">
      <header className="analytics-header">
        <div><span className="analytics-brand">峰值</span><h1>训练表现</h1></div>
        <button aria-label="选择日期"><CalendarBlank /></button>
      </header>

      <div className="analytics-filters" aria-label="数据分类">
        {filters.map((item) => <button key={item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}
      </div>

      <section className="performance-hero" aria-labelledby="performance-title">
        <div className="performance-copy">
          <span id="performance-title">{primary.label}</span>
          <div><strong>{primary.value}</strong><small>{primary.unit}</small></div>
          <b><ChartLineUp weight="bold" /> {primary.change}</b>
        </div>
        <div className="analytics-chart" aria-label="近期训练趋势">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.trend} margin={{ top: 14, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="#353535" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#969696", fontSize: 9 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#777", fontSize: 8 }} tickFormatter={(value) => filter === "cardio" ? `${value}k` : `${Math.round(value / 1000)}k`} />
              <Tooltip contentStyle={{ background: "#1b1b1b", border: "1px solid #404040", borderRadius: 8, fontSize: 10 }} formatter={(value) => [formatNumber(value, 1), filter === "cardio" ? "距离" : "训练量"]} />
              <Line isAnimationActive={false} type="monotone" dataKey={filter === "cardio" ? "distance" : "volume"} stroke="#ff5a1f" strokeWidth={3} dot={{ r: 3, fill: "#ff5a1f", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="analytics-summary" aria-label="训练统计概览">
        <div><Clock /><span>总时长</span><strong>{formatNumber(analytics.totalDuration)}</strong><small>分钟</small></div>
        <div><Barbell /><span>训练次数</span><strong>{analytics.sessionCount}</strong><small>次</small></div>
        <div><PersonSimpleRun /><span>总距离</span><strong>{formatNumber(analytics.totalDistance, 1)}</strong><small>km</small></div>
      </section>

      <section className="project-performance">
        <header><div><Trophy weight="fill" /><h2>项目表现</h2></div><span>共 {projects.length} 项</span></header>
        <div className="project-performance-list">
          {projects.map((project) => (
            <div className="project-performance-row" key={project.id}>
              <span className="project-icon">{project.category === "strength" ? <Barbell /> : <PersonSimpleRun />}</span>
              <div><strong>{project.name}</strong><small>{project.sessions} 次训练 · 最近 {project.latestDate.slice(5).replace("-", "/")}</small></div>
              <div className="project-result"><ProjectValue project={project} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="record-band">
        <span>近期个人纪录</span>
        <div><b>最高重量</b><strong>{formatNumber(maxWeight, 1)} kg</strong></div>
        <div><b>最快配速</b><strong>{analytics.averagePace ? `${formatNumber(analytics.averagePace, 1)}′ / km` : "—"}</strong></div>
      </section>
    </div>
  );
}

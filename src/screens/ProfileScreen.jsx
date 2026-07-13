import { useState } from "react";
import {
  Bell,
  CaretRight,
  GearSix,
  LockKey,
  Medal,
  PencilSimple,
  Ruler,
  Target,
  UserCircle,
  Wrench,
} from "@phosphor-icons/react";

const sections = [
  {
    label: "训练管理",
    items: [
      { id: "goals", label: "训练目标", value: "每周 4 次", Icon: Target },
      { id: "units", label: "单位偏好", value: "kg · km", Icon: Ruler },
      { id: "projects", label: "自定义项目", value: "管理", Icon: Wrench },
    ],
  },
  {
    label: "偏好与隐私",
    items: [
      { id: "reminder", label: "训练提醒", value: "周一、三、五", Icon: Bell },
      { id: "privacy", label: "数据与隐私", value: "仅自己可见", Icon: LockKey },
      { id: "settings", label: "通用设置", value: "", Icon: GearSix },
    ],
  },
];

export function ProfileScreen({ exerciseCount }) {
  const [activeSetting, setActiveSetting] = useState(null);
  const [metricUnits, setMetricUnits] = useState(true);

  return (
    <div className="screen-scroll profile-screen">
      <header className="profile-topbar"><span className="wordmark">铸力</span><button aria-label="编辑资料"><PencilSimple /></button></header>

      <section className="profile-identity">
        <div className="profile-avatar"><UserCircle weight="fill" /></div>
        <div><h1>力量训练者</h1><p>规律训练第 186 天</p><span><Medal weight="fill" /> 进阶 · Lv. 12</span></div>
      </section>

      <section className="goal-panel">
        <header><div><span>本周训练目标</span><strong>3 / 4 次</strong></div><b>75%</b></header>
        <progress value="3" max="4">75%</progress>
        <p>再完成 1 次，保持本周节奏</p>
      </section>

      <section className="profile-stats" aria-label="个人训练统计">
        <div><strong>42</strong><span>累计训练</span></div>
        <div><strong>18.6t</strong><span>本月训练量</span></div>
        <div><strong>{exerciseCount}</strong><span>训练项目</span></div>
      </section>

      {sections.map((section) => (
        <section className="settings-section" key={section.label}>
          <h2>{section.label}</h2>
          <div>
            {section.items.map(({ Icon, ...item }) => (
              <button key={item.id} onClick={() => setActiveSetting(item)}>
                <span className="settings-icon"><Icon /></span>
                <strong>{item.label}</strong>
                <small>{item.id === "projects" ? `${exerciseCount} 项` : item.id === "units" ? (metricUnits ? "kg · km" : "lb · mi") : item.value}</small>
                <CaretRight />
              </button>
            ))}
          </div>
        </section>
      ))}

      <p className="profile-version">铸力 v0.1 · 数据仅保存在当前原型会话</p>

      {activeSetting && (
        <div className="profile-setting-panel" role="dialog" aria-modal="true" aria-labelledby="setting-title">
          <button className="setting-dismiss" aria-label="关闭设置" onClick={() => setActiveSetting(null)} />
          <section>
            <span>设置</span><h2 id="setting-title">{activeSetting.label}</h2>
            {activeSetting.id === "units" ? (
              <div className="unit-switch">
                <button className={metricUnits ? "active" : ""} onClick={() => setMetricUnits(true)}>公制<br/><small>kg · km</small></button>
                <button className={!metricUnits ? "active" : ""} onClick={() => setMetricUnits(false)}>英制<br/><small>lb · mi</small></button>
              </div>
            ) : (
              <p>初版已保留这个管理入口，后续可继续扩展详细设置。</p>
            )}
            <button className="profile-confirm" onClick={() => setActiveSetting(null)}>完成</button>
          </section>
        </div>
      )}
    </div>
  );
}

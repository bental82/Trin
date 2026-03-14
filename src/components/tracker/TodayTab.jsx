import React from "react";
import StatCard from "./StatCard";
import BridgeStatus from "./BridgeStatus";

const STRATEGIES = [
  { id: "alt8",      label: "Alt 8d",     desc: "7d daily + 8d q2d", color: "#0891b2", bg: "#f0f9ff", border: "#a5f3fc" },
  { id: "alt14",     label: "Alt 14d",    desc: "7d daily + 14d q2d", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
  { id: "stepdown",  label: "Step-down",  desc: "7d + 8d q2d + 6d q3d", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { id: "uptitrate", label: "T20 early", desc: "T20 from bridge start, 7d+14d alt", color: "#e11d48", bg: "#fff1f2", border: "#fda4af" },
];

export default function TodayTab({ tN, statCards, strategy, setStrategy, strategyLabel }) {
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Today · D{tN + 1}</h2>
        <p style={{ margin: "3px 0 0", fontSize: 14, color: "#64748b" }}>
          Tap any card for more detail
        </p>
      </div>

      {/* Strategy selector */}
      <div style={{
        marginBottom: 10, padding: "12px 14px", borderRadius: 12,
        background: "#fff", border: "1px solid #e2e8f0",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Bridge Strategy</div>
        <div style={{ display: "flex", gap: 6 }}>
          {STRATEGIES.map(s => {
            const active = strategy === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStrategy(s.id)}
                style={{
                  flex: 1, padding: "8px 6px", borderRadius: 10, cursor: "pointer",
                  border: `1.5px solid ${active ? s.color : "#e2e8f0"}`,
                  background: active ? s.bg : "#f8fafc",
                  opacity: active ? 1 : 0.6,
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: active ? s.color : "#94a3b8" }}>{s.label}</div>
                <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{s.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <BridgeStatus tN={tN} strategy={strategy} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {statCards.map(c => (
          <StatCard key={c.label} {...c} strategyLabel={strategyLabel} />
        ))}
      </div>
    </div>
  );
}

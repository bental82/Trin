import React from "react";
import { BRIDGE_START, doseTaper14 } from "./bridgeTimeline";

const PHASE_DAILY_LEN = 7;
const PHASE_ALT_LEN = 14;
const TOTAL_BRIDGE = PHASE_DAILY_LEN + PHASE_ALT_LEN; // 21 days

export default function BridgeStatus({ tN }) {
  const bd = tN - BRIDGE_START; // bridge-relative day

  // Not in bridge window
  if (bd < 0) {
    const daysUntil = -bd;
    return (
      <StatusCard
        emoji="🌉"
        title="P20 Bridge"
        subtitle={`מתחיל בעוד ${daysUntil} ימים (D${BRIDGE_START + 1})`}
        color="#94a3b8"
        bg="#f8fafc"
        border="#e2e8f0"
      />
    );
  }

  if (bd >= TOTAL_BRIDGE) {
    const daysSince = bd - TOTAL_BRIDGE;
    return (
      <StatusCard
        emoji="✅"
        title="Bridge הושלם!"
        subtitle={`עברת ${daysSince > 0 ? daysSince + " ימים בלי Prozac" : "עכשיו Trintellix בלבד"}`}
        color="#16a34a"
        bg="#f0fdf4"
        border="#bbf7d0"
      />
    );
  }

  // Currently in bridge
  const [vortDose, prozacDose] = doseTaper14(tN);
  const takeProzacToday = prozacDose > 0;
  const daysLeft = TOTAL_BRIDGE - bd;

  let phase, phaseDay, phaseTotal;
  if (bd < PHASE_DAILY_LEN) {
    phase = "P20 יומי";
    phaseDay = bd + 1;
    phaseTotal = PHASE_DAILY_LEN;
  } else {
    phase = "P20 כל יום שני";
    phaseDay = bd - PHASE_DAILY_LEN + 1;
    phaseTotal = PHASE_ALT_LEN;
  }

  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: 12,
      background: "linear-gradient(135deg, #f0f9ff 0%, #ecfeff 100%)",
      border: "1px solid #a5f3fc",
      marginBottom: 6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🌉</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0891b2" }}>P20 Bridge · {phase}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>שלב {phaseDay}/{phaseTotal} · נשארו {daysLeft} ימים</div>
          </div>
        </div>
      </div>

      {/* Today's dose */}
      <div style={{
        display: "flex", gap: 10, alignItems: "center",
        padding: "10px 14px", borderRadius: 10,
        background: takeProzacToday ? "#fff7ed" : "#f0fdf4",
        border: `1px solid ${takeProzacToday ? "#fed7aa" : "#bbf7d0"}`,
      }}>
        <span style={{ fontSize: 24 }}>{takeProzacToday ? "💊" : "🟢"}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: takeProzacToday ? "#ea580c" : "#16a34a" }}>
            {takeProzacToday ? `Prozac ${prozacDose}mg היום` : "ללא Prozac היום"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Trintellix {vortDose}mg{takeProzacToday ? " + Prozac" : " בלבד"}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 3 }}>
          <span>התקדמות Bridge</span>
          <span>{Math.round((bd / TOTAL_BRIDGE) * 100)}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "#e0f2fe" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: "linear-gradient(90deg, #06b6d4, #0891b2)",
            width: `${(bd / TOTAL_BRIDGE) * 100}%`,
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ emoji, title, subtitle, color, bg, border }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12,
      background: bg, border: `1px solid ${border}`,
      display: "flex", alignItems: "center", gap: 10,
      marginBottom: 6,
    }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color }}>{title}</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>{subtitle}</div>
      </div>
    </div>
  );
}
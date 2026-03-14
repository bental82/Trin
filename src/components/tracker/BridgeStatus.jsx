import React from "react";
import { BRIDGE_START, doseTaper, doseTaper14, doseStepdown, doseUptitrate, doseUptitrate15w } from "./bridgeTimeline";

const STRATEGY_CONFIG = {
  alt8: {
    doseFn: doseTaper,
    phases: [
      { name: "P20 \u05D9\u05D5\u05DE\u05D9", len: 7 },
      { name: "P20 \u05DB\u05DC \u05D9\u05D5\u05DD \u05E9\u05E0\u05D9", len: 8 },
    ],
  },
  alt14: {
    doseFn: doseTaper14,
    phases: [
      { name: "P20 \u05D9\u05D5\u05DE\u05D9", len: 7 },
      { name: "P20 \u05DB\u05DC \u05D9\u05D5\u05DD \u05E9\u05E0\u05D9", len: 14 },
    ],
  },
  stepdown: {
    doseFn: doseStepdown,
    phases: [
      { name: "P20 \u05D9\u05D5\u05DE\u05D9", len: 7 },
      { name: "P20 \u05DB\u05DC \u05D9\u05D5\u05DD \u05E9\u05E0\u05D9", len: 8 },
      { name: "P20 \u05DB\u05DC \u05D9\u05D5\u05DD \u05E9\u05DC\u05D9\u05E9\u05D9", len: 6 },
    ],
  },
  uptitrate: {
    doseFn: doseUptitrate,
    phases: [
      { name: "T10+P20 \u05D9\u05D5\u05DE\u05D9", len: 7 },
      { name: "T15 (2d)", len: 2 },
      { name: "T20+P20 alt", len: 12 },
    ],
  },
  ut15wk: {
    doseFn: doseUptitrate15w,
    phases: [
      { name: "T10+P20 \u05D9\u05D5\u05DE\u05D9", len: 7 },
      { name: "T15+P20 alt", len: 7 },
      { name: "T20+P20 alt", len: 7 },
    ],
  },
};

export default function BridgeStatus({ tN, strategy = "alt14" }) {
  const config = STRATEGY_CONFIG[strategy] || STRATEGY_CONFIG.alt14;
  const totalBridge = config.phases.reduce((s, p) => s + p.len, 0);
  const bd = tN - BRIDGE_START;

  if (bd < 0) {
    const daysUntil = -bd;
    return (
      <StatusCard
        emoji="\u{1F309}"
        title="P20 Bridge"
        subtitle={`\u05DE\u05EA\u05D7\u05D9\u05DC \u05D1\u05E2\u05D5\u05D3 ${daysUntil} \u05D9\u05DE\u05D9\u05DD (D${BRIDGE_START + 1})`}
        color="#94a3b8"
        bg="#f8fafc"
        border="#e2e8f0"
      />
    );
  }

  if (bd >= totalBridge) {
    const daysSince = bd - totalBridge;
    return (
      <StatusCard
        emoji="\u2705"
        title="Bridge \u05D4\u05D5\u05E9\u05DC\u05DD!"
        subtitle={`\u05E2\u05D1\u05E8\u05EA ${daysSince > 0 ? daysSince + " \u05D9\u05DE\u05D9\u05DD \u05D1\u05DC\u05D9 Prozac" : "\u05E2\u05DB\u05E9\u05D9\u05D5 Trintellix \u05D1\u05DC\u05D1\u05D3"}`}
        color="#16a34a"
        bg="#f0fdf4"
        border="#bbf7d0"
      />
    );
  }

  // Currently in bridge — find which phase
  const [vortDose, prozacDose] = config.doseFn(tN);
  const takeProzacToday = prozacDose > 0;
  const daysLeft = totalBridge - bd;

  let phase, phaseDay, phaseTotal;
  let cumLen = 0;
  for (const p of config.phases) {
    if (bd < cumLen + p.len) {
      phase = p.name;
      phaseDay = bd - cumLen + 1;
      phaseTotal = p.len;
      break;
    }
    cumLen += p.len;
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
          <span style={{ fontSize: 22 }}>{"\u{1F309}"}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0891b2" }}>P20 Bridge · {phase}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{"\u05E9\u05DC\u05D1"} {phaseDay}/{phaseTotal} · {"\u05E0\u05E9\u05D0\u05E8\u05D5"} {daysLeft} {"\u05D9\u05DE\u05D9\u05DD"}</div>
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
        <span style={{ fontSize: 24 }}>{takeProzacToday ? "\u{1F48A}" : "\u{1F7E2}"}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: takeProzacToday ? "#ea580c" : "#16a34a" }}>
            {takeProzacToday ? `Prozac ${prozacDose}mg \u05D4\u05D9\u05D5\u05DD` : "\u05DC\u05DC\u05D0 Prozac \u05D4\u05D9\u05D5\u05DD"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Trintellix {vortDose}mg{takeProzacToday ? " + Prozac" : " \u05D1\u05DC\u05D1\u05D3"}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 3 }}>
          <span>{"\u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA"} Bridge</span>
          <span>{Math.round((bd / totalBridge) * 100)}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "#e0f2fe" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: "linear-gradient(90deg, #06b6d4, #0891b2)",
            width: `${(bd / totalBridge) * 100}%`,
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

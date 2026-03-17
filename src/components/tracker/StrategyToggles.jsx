import React from "react";

const STRATS = [
  { key: "alt8",  label: "Alt 8d",    color: "#0891b2", bg: "#f0f9ff" },
  { key: "alt14", label: "Alt 14d",   color: "#7c3aed", bg: "#f5f3ff" },
  { key: "sd",    label: "Step-down", color: "#d97706", bg: "#fffbeb" },
  { key: "ut",    label: "T20 fast", color: "#e11d48", bg: "#fff1f2" },
  { key: "ut15",  label: "T15 wk",  color: "#be185d", bg: "#fdf2f8" },
  { key: "t15",   label: "T15",     color: "#059669", bg: "#ecfdf5" },
];

export default function StrategyToggles({ show, setShow }) {
  const tog = k => setShow(s => ({ ...s, [k]: !s[k] }));
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
      {STRATS.map(s => (
        <button
          key={s.key}
          onClick={() => tog(s.key)}
          style={{
            padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            border: `1.5px solid ${show[s.key] ? s.color : "#e2e8f0"}`,
            background: show[s.key] ? s.bg : "#fff",
            color: show[s.key] ? s.color : "#94a3b8",
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export const STRATEGY_COLORS = {
  alt8: "#0891b2", alt14: "#7c3aed", sd: "#d97706", ut: "#e11d48", ut15: "#be185d", t15: "#059669",
};
export const STRATEGY_LABELS = {
  alt8: "P20+alt 8d", alt14: "P20+alt 14d", sd: "Step-down", ut: "T20 fast", ut15: "T15 wk", t15: "T15",
};

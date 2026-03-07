import React from "react";

export default function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #cbd5e1",
      boxShadow: "0 4px 12px rgba(0,0,0,.08)",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 13,
      color: "#334155",
      maxWidth: 280,
    }}>
      <div style={{ color: "#0891b2", fontWeight: 700, marginBottom: 4, fontSize: 14 }}>
        Day {Math.round(d.day) + 1} — {d.ds}
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>
        Rx: {d.vN}mg vort + {d.pN}mg prozac
      </div>
      {payload.filter((p, i, arr) =>
        // only named entries, ignore fills, deduplicate by name, hide raw cS
        p.name && p.name !== "wbFill" && p.name !== "stFill" && p.dataKey !== "cS" && arr.findIndex(x => x.name === p.name) === i
      ).map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 1 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>
            {typeof p.value === "number"
              ? p.name === "CYP2D6" ? p.value.toFixed(2) + "×"
              : p.name === "Fluoxetine equiv" || p.name === "Vortioxetine eff" ? p.value.toFixed(1) + "mg"
              : p.value.toFixed(1) + "%"
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
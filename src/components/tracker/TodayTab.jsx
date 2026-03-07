import React from "react";
import StatCard from "./StatCard";

export default function TodayTab({ tN, statCards }) {
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Today · D{tN + 1}</h2>
        <p style={{ margin: "3px 0 0", fontSize: 14, color: "#64748b" }}>
          Tap any card for more detail
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {statCards.map(c => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}
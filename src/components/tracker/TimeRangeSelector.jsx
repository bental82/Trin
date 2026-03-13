import React from "react";

const RANGES = [
  { label: "Day",   value: "day"   },
  { label: "Week",  value: "week"  },
  { label: "Month", value: "month" },
];

export default function TimeRangeSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
      {RANGES.map(r => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
            border: "1px solid",
            borderColor: value === r.value ? "#0891b2" : "#e2e8f0",
            background: value === r.value ? "#f0f9ff" : "transparent",
            color: value === r.value ? "#0891b2" : "#64748b",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Filters timeline data based on selected range.
 * range: "day" | "week" | "month"
 * tl: full timeline array (0.5-day steps)
 */
export function filterByRange(tl, range) {
  if (range === "day") {
    // Integer days only, up to 60 days
    return tl.filter(d => d.day <= 60 && d.day % 1 === 0);
  }
  if (range === "week") {
    // One point per week (every 7 days), up to 56 days
    return tl.filter(d => d.day <= 56 && d.day % 7 === 0);
  }
  // month: one point per ~30 days, full 90-day range
  return tl.filter(d => d.day % 30 === 0);
}

export function xTickFormatter(range) {
  if (range === "day")  return v => "D" + (v + 1);
  if (range === "week") return v => "W" + (Math.round(v / 7) + 1);
  return v => "M" + (Math.round(v / 30) + 1);
}

export function cleanZeroLine(data, keys) {
  return data.map((d, i, arr) => {
    const prev = arr[i - 1];
    const next = arr[i + 1];
    const newD = { ...d };
    keys.forEach(k => {
      const val = d[k] || 0;
      const pVal = prev?.[k] || 0;
      const nVal = next?.[k] || 0;
      // Use null to break the line in Recharts
      if (Math.abs(val) < 0.01 && Math.abs(pVal) < 0.01 && Math.abs(nVal) < 0.01) {
        newD[k] = null;
      }
    });
    return newD;
  });
}
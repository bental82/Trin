import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function StatCard({ label, value, color, detail, icon, bridgeValue, bridgeColor, strategyLabel }) {
  const [open, setOpen] = useState(false);
  const hasBridge = bridgeValue != null && bridgeValue !== value;

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        borderRadius: 16,
        border: `1px solid ${color}40`,
        background: open ? `${color}14` : "#ffffff",
        cursor: "pointer",
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}18`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.3 }}>{label}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</span>
            {hasBridge && (
              <>
                <span style={{ fontSize: 14, color: "#cbd5e1", fontWeight: 400 }}>/</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: bridgeColor, lineHeight: 1.1, opacity: 0.85 }}>{bridgeValue}</span>
                <span style={{ fontSize: 10, color: bridgeColor, fontWeight: 600, opacity: 0.7 }}>{strategyLabel}</span>
              </>
            )}
          </div>
        </div>
        <ChevronDown
          size={16}
          color={color}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0, opacity: 0.5 }}
        />
      </div>
      {open && detail && (
        <div style={{
          padding: "0 16px 14px",
          fontSize: 15,
          color: "#334155",
          lineHeight: 1.7,
          borderTop: `1px solid ${color}15`,
          paddingTop: 12,
        }}>
          {detail}
        </div>
      )}
    </div>
  );
}

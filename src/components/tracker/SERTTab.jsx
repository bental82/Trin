import React, { useState } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import ChartTooltip, { TOOLTIP_PROPS } from "./ChartTooltip";
import { cleanZeroLine } from "./TimeRangeSelector";
import { Customized } from "recharts";
import TodayHitArea from "./ClickableTodayLine";
import StrategyToggles, { STRATEGY_COLORS, STRATEGY_LABELS } from "./StrategyToggles";

export default function SERTTab({ tl, tN, tlAll, bridgeShow, setBridgeShow }) {
  const [showToday, setShowToday] = useState(false);

  const filtered = tl.filter(d => d.day <= 60 && d.day % 1 === 0);
  const merged = filtered.map((d) => {
    const i = tl.indexOf(d);
    const row = { ...d };
    Object.entries(tlAll).forEach(([k, bl]) => { row["bCS_" + k] = bl?.[i]?.cS ?? null; });
    return row;
  });
  const chartData = cleanZeroLine(merged, ["cS", "sV", "sF", ...Object.keys(tlAll).map(k => "bCS_" + k)]);
  const todayData = tl.find(d => d.day === tN);

  return (
    <div>
      <div style={{ padding: "0 6px", marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#0f172a" }}>Combined SERT Occupancy</h2>
      </div>

      <StrategyToggles show={bridgeShow} setShow={setBridgeShow} />

      <ResponsiveContainer width="100%" height={280} style={{ overflow: "visible" }}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 6, left: -14, bottom: 5 }}>
          <defs>
            <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0abfc" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#f0abfc" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,200,220,.05)" vertical={false} />
          <XAxis dataKey="day" type="number" tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={v => "D" + (v + 1)} stroke="rgba(100,200,220,.08)" domain={["dataMin", "dataMax"]} />
          <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={v => v + "%"} stroke="rgba(100,200,220,.08)" />
          <Tooltip {...TOOLTIP_PROPS} content={<ChartTooltip />} />
          <ReferenceLine x={tN} stroke="rgba(239,68,68,.7)" strokeDasharray="3 3" label={{ value: "Today", fill: "#ef4444", fontSize: 8, position: "top" }} />
          <Customized component={<TodayHitArea tN={tN} onToggle={() => setShowToday(v => !v)} />} />
          <ReferenceLine y={80} stroke="rgba(168,85,247,.1)" strokeDasharray="4 4" />
          <ReferenceLine y={50} stroke="rgba(6,182,212,.1)"  strokeDasharray="4 4" />
          <Area type="monotone" dataKey="cS" fill="url(#sg2)" stroke="none" connectNulls={false} />
          <Line type="monotone" dataKey="cS" stroke="#f0abfc" strokeWidth={2.5} dot={false} name="Combined SERT" connectNulls={false} />
          {Object.entries(STRATEGY_COLORS).map(([k, c]) =>
            bridgeShow[k] && <Line key={k} type="monotone" dataKey={"bCS_" + k} stroke={c} strokeWidth={2} dot={false} strokeDasharray="6 3" name={STRATEGY_LABELS[k]} connectNulls={false} />
          )}
          <Line type="monotone" dataKey="sV" stroke="#06b6d4" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Trintellix" connectNulls={false} />
          <Line type="monotone" dataKey="sF" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Prozac residual" connectNulls={false} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {showToday && todayData && (
        <div style={{ margin: "8px 2px", padding: "10px 14px", borderRadius: 10, background: "#fef2f210", border: "1px solid #ef444420", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Day {tN + 1}</div>
          {[
            { l: "Combined SERT", v: todayData.cS, c: "#f0abfc" },
            { l: "Trintellix", v: todayData.sV, c: "#06b6d4" },
            { l: "Prozac residual", v: todayData.sF, c: "#f97316" },
          ].map(m => (
            <div key={m.l} style={{ fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>{m.l}: </span>
              <span style={{ fontWeight: 700, color: m.c }}>{m.v?.toFixed(1)}%</span>
            </div>
          ))}
          <button onClick={() => setShowToday(false)} style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}

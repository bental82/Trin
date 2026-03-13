import React, { useState } from "react";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import TimeRangeSelector, { filterByRange, xTickFormatter, cleanZeroLine } from "./TimeRangeSelector";
import { Customized } from "recharts";
import TodayHitArea from "./ClickableTodayLine";

export default function PlasmaTab({ tl, tN, tlBridge }) {
  const [range, setRange] = useState("day");
  const [showToday, setShowToday] = useState(false);
  const merged = tl.map((d, i) => ({ ...d, bridgeFE: tlBridge?.[i]?.fE ?? null, bridgeVE: tlBridge?.[i]?.vE ?? null }));
  const chartData = cleanZeroLine(filterByRange(merged, range), ["fE", "vE", "cyp", "bridgeFE", "bridgeVE"]);
  const todayData = tl.find(d => d.day === tN);
  return (
    <div>
      <div style={{ padding: "0 6px", marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#0f172a" }}>Effective Plasma & CYP2D6</h2>
      </div>
      <TimeRangeSelector value={range} onChange={setRange} />
      <ResponsiveContainer width="100%" height={280} style={{ overflow: "visible" }}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 6, left: -14, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,200,220,.05)" vertical={false} />
          <XAxis dataKey="day" type="number" tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={xTickFormatter(range)} stroke="rgba(100,200,220,.08)" domain={["dataMin", "dataMax"]} />
          <YAxis yAxisId="mg" tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={v => v + "mg"} stroke="rgba(100,200,220,.08)" />
          <YAxis yAxisId="f" orientation="right" domain={[0, 4]} tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={v => v + "×"} stroke="rgba(100,200,220,.08)" />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} wrapperStyle={{ pointerEvents: "none", zIndex: 1000 }} offset={20} allowEscapeViewBox={{ x: true, y: true }} />
          <ReferenceLine x={tN} stroke="rgba(239,68,68,.7)" strokeDasharray="3 3" yAxisId="mg" label={{ value: "Today", fill: "#ef4444", fontSize: 8, position: "top" }} />
          <Customized component={<TodayHitArea tN={tN} onToggle={() => setShowToday(v => !v)} />} />
          <Line yAxisId="mg" type="monotone" dataKey="fE"  stroke="#f97316" strokeWidth={2}   dot={false} name="Fluoxetine equiv" connectNulls={false} />
          <Line yAxisId="mg" type="monotone" dataKey="bridgeFE" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="6 3" name="Bridge Fluox" connectNulls={false} opacity={0.5} />
          <Line yAxisId="mg" type="monotone" dataKey="vE"  stroke="#06b6d4" strokeWidth={2.5} dot={false} name="Vortioxetine eff" connectNulls={false} />
          <Line yAxisId="mg" type="monotone" dataKey="bridgeVE" stroke="#0891b2" strokeWidth={1.5} dot={false} strokeDasharray="6 3" name="Bridge Vort" connectNulls={false} />
          <Line yAxisId="f"  type="monotone" dataKey="cyp" stroke="#a78bfa" strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="CYP2D6" connectNulls={false} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {showToday && todayData && (
        <div style={{ margin: "8px 2px", padding: "10px 14px", borderRadius: 10, background: "#fef2f210", border: "1px solid #ef444420", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Day {tN + 1}</div>
          {[
            { l: "Fluoxetine equiv", v: todayData.fE, c: "#f97316", u: "mg" },
            { l: "Vortioxetine eff", v: todayData.vE, c: "#06b6d4", u: "mg" },
            { l: "CYP2D6", v: todayData.cyp, c: "#a78bfa", u: "×" },
          ].map(m => (
            <div key={m.l} style={{ fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>{m.l}: </span>
              <span style={{ fontWeight: 700, color: m.c }}>{m.v?.toFixed(2)}{m.u}</span>
            </div>
          ))}
          <button onClick={() => setShowToday(false)} style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import TimeRangeSelector, { filterByRange, xTickFormatter, cleanZeroLine } from "./TimeRangeSelector";
import { Customized } from "recharts";
import TodayHitArea from "./ClickableTodayLine";

export default function WellbeingTab({ tl, tlM, tN, peakWB }) {
  const [range, setRange] = useState("day");
  const [showToday, setShowToday] = useState(false);
  const chartData = cleanZeroLine(filterByRange(tl, range), ["pkScore", "pdScore", "stressScore", "wellbeing"]);
  const todayData = tl.find(d => d.day === tN);

  return (
    <div>
      <div style={{ padding: "0 6px", marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#0f172a" }}>Projected Wellbeing</h2>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
          PK ceiling × PD maturation − transition stress · Gold = diary
        </p>
      </div>

      <TimeRangeSelector value={range} onChange={setRange} />

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 6, left: -14, bottom: 5 }}>
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="stg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="day" type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={xTickFormatter(range)} stroke="#e2e8f0" domain={["dataMin", "dataMax"]} />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} stroke="#e2e8f0" />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} wrapperStyle={{ pointerEvents: "none" }} offset={20} allowEscapeViewBox={{ x: true, y: true }} />
          <ReferenceLine x={0}  stroke="rgba(251,191,36,.3)"  strokeDasharray="4 3" label={{ value: "Start", fill: "#fbbf2460", fontSize: 8, position: "top" }} />
          <ReferenceLine x={tN} stroke="rgba(239,68,68,.7)" strokeDasharray="3 3" label={{ value: "Today", fill: "#ef4444", fontSize: 8, position: "top" }} />
          <Customized component={<TodayHitArea tN={tN} onToggle={() => setShowToday(v => !v)} />} />
          {/* Gradient fills — stroke fully disabled */}
          <Area type="monotone" dataKey="wellbeing"   fill="url(#wg)"  fillOpacity={1} stroke="transparent" strokeWidth={0} activeDot={false} legendType="none" tooltipType="none" name="wbFill" isAnimationActive={false} connectNulls={false} />
          <Area type="monotone" dataKey="stressScore" fill="url(#stg)" fillOpacity={1} stroke="transparent" strokeWidth={0} activeDot={false} legendType="none" tooltipType="none" name="stFill" isAnimationActive={false} connectNulls={false} />
          {/* Lines on top */}
          <Line type="monotone" dataKey="wellbeing"   stroke="#22c55e" strokeWidth={3}   dot={false} name="Wellbeing" connectNulls={false} />
          <Line type="monotone" dataKey="pkScore"     stroke="#06b6d4" strokeWidth={1.2} dot={false} strokeDasharray="5 3" name="PK Ceiling" connectNulls={false} />
          <Line type="monotone" dataKey="pdScore"     stroke="#a78bfa" strokeWidth={1.2} dot={false} strokeDasharray="5 3" name="PD Maturation" connectNulls={false} />
          <Line type="monotone" dataKey="stressScore" stroke="#ef4444" strokeWidth={1.2} dot={false} strokeDasharray="3 3" name="Transition Stress" connectNulls={false} />
          <Line
            type="monotone"
            data={tlM.filter(d => d.ms)}
            dataKey="ms"
            stroke="#fbbf24"
            strokeWidth={2}
            dot={{ fill: "#fbbf24", r: 4, stroke: "#ffffff", strokeWidth: 1.5 }}
            name="Your Mood"
            connectNulls={false}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {showToday && todayData && (
        <div style={{ margin: "8px 2px", padding: "10px 14px", borderRadius: 10, background: "#fef2f210", border: "1px solid #ef444420", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Day {tN + 1}</div>
          {[
            { l: "Wellbeing", v: todayData.wellbeing, c: "#22c55e" },
            { l: "PK Ceiling", v: todayData.pkScore, c: "#06b6d4" },
            { l: "PD Maturation", v: todayData.pdScore, c: "#a78bfa" },
            { l: "Stress", v: todayData.stressScore, c: "#ef4444" },
          ].map(m => (
            <div key={m.l} style={{ fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>{m.l}: </span>
              <span style={{ fontWeight: 700, color: m.c }}>{m.v?.toFixed(1)}</span>
            </div>
          ))}
          <button onClick={() => setShowToday(false)} style={{ marginLeft: "auto", fontSize: 9, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 6, padding: "10px 2px 0" }}>
        {[
          { l: "Now → D28", t: "Transition Zone",   d: "Norfluoxetine clearing. PD ramping. Possible dip ~D21-28.", c: "#f97316", i: "⚡" },
          { l: "D28 → D42", t: "PD Acceleration",   d: "Autoreceptors done. BDNF rising. Cognitive sharpening.",    c: "#a78bfa", i: "📈" },
          { l: "D42 → D56", t: "Full Integration",  d: "Glymphatic + DMN normalizing. Stable plateau.",             c: "#22c55e", i: "🧠" },
        ].map((p, i) => (
          <div key={i} style={{ padding: "12px 14px", borderRadius: 9, background: p.c + "06", border: "1px solid " + p.c + "18" }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{p.i}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: p.c }}>{p.t}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{p.l}</div>
            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5, marginTop: 3 }}>{p.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import TimeRangeSelector, { filterByRange, xTickFormatter, cleanZeroLine } from "./TimeRangeSelector";
import { Customized } from "recharts";
import TodayHitArea from "./ClickableTodayLine";

export default function PDTab({ tl, tN, tW }) {
  const [range, setRange] = useState("day");
  const [showToday, setShowToday] = useState(false);
  const todayData = tl.find(d => d.day === tN);
  const chartData = cleanZeroLine(filterByRange(tl, range), [
    "gabaDisinhib", "autorecept", "circadian", "bdnf", "dmn", "glymphatic"
  ]);
  return (
    <div>
      <div style={{ padding: "0 6px", marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#0f172a" }}>PD Maturation Curves</h2>
      </div>

      <TimeRangeSelector value={range} onChange={setRange} />

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 6, left: -14, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="day" type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={xTickFormatter(range)} stroke="#e2e8f0" domain={["dataMin", "dataMax"]} />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => v + "%"} stroke="#e2e8f0" />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} wrapperStyle={{ pointerEvents: "none" }} offset={20} allowEscapeViewBox={{ x: true, y: true }} />
          <ReferenceLine x={tN} stroke="rgba(239,68,68,.7)" strokeDasharray="3 3" label={{ value: "Today", fill: "#ef4444", fontSize: 8, position: "top" }} />
          <Customized component={<TodayHitArea tN={tN} onToggle={() => setShowToday(v => !v)} />} />
          <Line type="monotone" dataKey="gabaDisinhib" stroke="#f97316" strokeWidth={2}   dot={false} name="GABA Disinhibition" connectNulls={false} />
          <Line type="monotone" dataKey="autorecept"   stroke="#22d3ee" strokeWidth={2}   dot={false} name="Autoreceptor Desens." connectNulls={false} />
          <Line type="monotone" dataKey="circadian"    stroke="#818cf8" strokeWidth={1.8} dot={false} name="Circadian" connectNulls={false} />
          <Line type="monotone" dataKey="bdnf"         stroke="#22c55e" strokeWidth={2}   dot={false} name="BDNF" connectNulls={false} />
          <Line type="monotone" dataKey="dmn"          stroke="#fbbf24" strokeWidth={1.8} dot={false} name="DMN" connectNulls={false} />
          <Line type="monotone" dataKey="glymphatic"   stroke="#fb7185" strokeWidth={1.8} dot={false} name="Glymphatic" connectNulls={false} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {showToday && todayData && (
        <div style={{ margin: "8px 2px", padding: "10px 14px", borderRadius: 10, background: "#fef2f210", border: "1px solid #ef444420", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Day {tN + 1}</div>
          {[
            { l: "Autoreceptor", v: todayData.autorecept, c: "#22d3ee" },
            { l: "GABA", v: todayData.gabaDisinhib, c: "#f97316" },
            { l: "Circadian", v: todayData.circadian, c: "#818cf8" },
            { l: "BDNF", v: todayData.bdnf, c: "#22c55e" },
            { l: "DMN", v: todayData.dmn, c: "#fbbf24" },
            { l: "Glymphatic", v: todayData.glymphatic, c: "#fb7185" },
          ].map(m => (
            <div key={m.l} style={{ fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>{m.l}: </span>
              <span style={{ fontWeight: 700, color: m.c }}>{m.v?.toFixed(1)}%</span>
            </div>
          ))}
          <button onClick={() => setShowToday(false)} style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 6, padding: "10px 2px 0" }}>
        {[
          { n: "Autoreceptor",    v: tW.autorecept,   c: "#22d3ee", t: "t½≈18d" },
          { n: "GABA Disinhibition", v: tW.gabaDisinhib, c: "#f97316", t: "t½≈12d" },
          { n: "Circadian",       v: tW.circadian,    c: "#818cf8", t: "t½≈16d" },
          { n: "BDNF",            v: tW.bdnf,         c: "#22c55e", t: "t½≈32d" },
          { n: "DMN",             v: tW.dmn,          c: "#fbbf24", t: "t½≈35d" },
          { n: "Glymphatic",      v: tW.glymphatic,   c: "#fb7185", t: "t½≈45d" },
        ].map(p => (
          <div key={p.n} style={{ padding: "8px 10px", borderRadius: 9, background: p.c + "06", border: "1px solid " + p.c + "15" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: p.c }}>{p.n}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{p.v.toFixed(0)}%</div>
            <div style={{ height: 3, borderRadius: 2, background: p.c + "12", marginTop: 3 }}>
              <div style={{ height: "100%", borderRadius: 2, background: p.c, width: p.v + "%" }} />
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{p.t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

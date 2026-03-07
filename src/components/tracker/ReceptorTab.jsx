import React, { useState } from "react";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { REC } from "./pkEngine";
import ChartTooltip from "./ChartTooltip";
import TimeRangeSelector, { filterByRange, xTickFormatter, cleanZeroLine } from "./TimeRangeSelector";
import { Customized } from "recharts";
import TodayHitArea from "./ClickableTodayLine";

export default function ReceptorTab({ tl, tN }) {
  const [range, setRange] = useState("day");
  const chartData = cleanZeroLine(filterByRange(tl, range), [...Object.keys(REC), "sV"]);
  return (
    <div>
      <div style={{ padding: "0 6px", marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#0f172a" }}>5-HT Receptor Occupancy</h2>
      </div>
      <TimeRangeSelector value={range} onChange={setRange} />
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 6, left: -14, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,200,220,.05)" vertical={false} />
          <XAxis dataKey="day" type="number" tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={xTickFormatter(range)} stroke="rgba(100,200,220,.08)" domain={["dataMin", "dataMax"]} />
          <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={v => v + "%"} stroke="rgba(100,200,220,.08)" />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} wrapperStyle={{ pointerEvents: "none" }} offset={20} allowEscapeViewBox={{ x: true, y: true }} />
          <ReferenceLine x={tN} stroke="rgba(239,68,68,.7)" strokeDasharray="3 3" label={{ value: "Today", fill: "#ef4444", fontSize: 8, position: "top" }} />
          <Customized component={<TodayHitArea tN={tN} onToggle={() => {}} />} />
          {Object.entries(REC).map(([n, r]) => (
            <Line key={n} type="monotone" dataKey={n} stroke={r.c} strokeWidth={2} dot={false} name={`${n} (${r.a})`} connectNulls={false} />
          ))}
          <Line type="monotone" dataKey="sV" stroke="#06b6d4" strokeWidth={2.5} dot={false} name="SERT" strokeDasharray="6 2" connectNulls={false} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
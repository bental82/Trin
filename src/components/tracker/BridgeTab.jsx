import { useState, useMemo } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { getDose, computePD, computeAll, getTodayN } from "@/components/tracker/pkEngine";
import { BRIDGE_START, doseTaper, doseTaper14, doseStepdown, doseUptitrate } from "@/components/tracker/bridgeTimeline";

// ── Bridge stress curves ──

function makeBridgeStress(endOffset, amplitude, center, width, steepness) {
  return day => {
    const da = day - (BRIDGE_START + endOffset);
    if (da <= 0) return 0;
    return Math.max(0, amplitude * Math.exp(-0.5 * ((da - center) / width) ** 2)) * (1 / (1 + Math.exp(-steepness * (da - 1))));
  };
}

function makeBridgeBoost(coverageDays) {
  return (day, pk) => {
    return (pk.fE > 2 && day >= BRIDGE_START && day < BRIDGE_START + coverageDays)
      ? Math.min(8, (pk.fE / 20) * 8)
      : 0;
  };
}

// ── Wellbeing calculator ──

function wb(day, doseFn, pdFn, extraStressFn, boostFn) {
  const result = computeAll(day, doseFn, pdFn);
  const extraStress = extraStressFn ? extraStressFn(day) : 0;
  const boost = boostFn ? boostFn(day, result) : 0;
  const adjusted = Math.max(0, Math.min(100, result.wellbeing - extraStress + boost));
  return { ...result, wellbeing: adjusted, stressScore: result.stressScore + extraStress, day };
}

const N = 75;
function gen(doseFn, pdFn, extraStressFn, boostFn) {
  const data = [];
  for (let i = 0; i <= N; i++) data.push(wb(i, doseFn, pdFn, extraStressFn, boostFn));
  return data;
}

// ── Tooltip ──
function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const day = d.day;
  const dt = new Date("2026-02-12");
  dt.setDate(dt.getDate() + Math.floor(day));
  const ds = dt.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  const skip = new Set(["wbF", "stF", "tpF", "tp14F", "sdF", "utF"]);
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,.1)", maxWidth: 240 }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#0891b2" }}>Day {(day ?? 0) + 1} — {ds}</div>
      {payload.filter(p => p.value != null && !skip.has(p.name)).map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "1px 0" }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 600, color: p.color }}>{p.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function BridgeTab({ bridgeShow, setBridgeShow }) {
  const [extra, setExtra] = useState({ pk: false, pd: false, st: false });
  const togExtra = k => setExtra(s => ({ ...s, [k]: !s[k] }));
  const togBridge = k => setBridgeShow(s => ({ ...s, [k]: !s[k] }));

  const todayN = useMemo(() => getTodayN(), []);

  const stressTaper = useMemo(() => makeBridgeStress(15, 0.8, 5, 4, 2.5), []);
  const stressTpr14 = useMemo(() => makeBridgeStress(21, 0.6, 5, 5, 2.5), []);
  const stressSD    = useMemo(() => makeBridgeStress(21, 0.7, 5, 4.5, 2.5), []);
  const stressUT    = useMemo(() => makeBridgeStress(21, 0.65, 5, 5, 2.5), []);

  const boostTaper = useMemo(() => makeBridgeBoost(20), []);
  const boostTpr14 = useMemo(() => makeBridgeBoost(26), []);
  const boostSD    = useMemo(() => makeBridgeBoost(24), []);
  const boostUT    = useMemo(() => makeBridgeBoost(26), []);

  const tl      = useMemo(() => gen(getDose, computePD), []);
  const tlTaper = useMemo(() => gen(doseTaper, computePD, stressTaper, boostTaper), [stressTaper, boostTaper]);
  const tlTpr14 = useMemo(() => gen(doseTaper14, computePD, stressTpr14, boostTpr14), [stressTpr14, boostTpr14]);
  const tlSD    = useMemo(() => gen(doseStepdown, computePD, stressSD, boostSD), [stressSD, boostSD]);
  const tlUT    = useMemo(() => gen(doseUptitrate, computePD, stressUT, boostUT), [stressUT, boostUT]);

  const data = useMemo(() => tl.map((d, i) => ({
    ...d,
    taperWB: tlTaper[i]?.wellbeing ?? null,
    taper14WB: tlTpr14[i]?.wellbeing ?? null,
    sdWB: tlSD[i]?.wellbeing ?? null,
    utWB: tlUT[i]?.wellbeing ?? null,
  })), [tl, tlTaper, tlTpr14, tlSD, tlUT]);

  const todayD = data.find(d => d.day === todayN);
  const minA = tl.reduce((m, d) => d.wellbeing < m.wellbeing ? d : m, tl[0]);

  const Btn = ({ on, onClick, color, bg, children }) => (
    <button onClick={onClick} style={{
      padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
      fontFamily: "inherit", border: `1.5px solid ${on ? color : "#e2e8f0"}`,
      background: on ? bg : "#fff", color: on ? color : "#94a3b8",
    }}>{children}</button>
  );

  return (
    <div>
      <div style={{ padding: "0 6px", marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, background: "linear-gradient(135deg,#0891b2,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Wellbeing — Bridge Comparison
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Day {todayN + 1} · Which Prozac bridge is optimal?</p>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
        <Btn on={bridgeShow.alt8} onClick={() => togBridge("alt8")} color="#0891b2" bg="#f0f9ff">{"\u{1F48A}"} P20+alt 8d</Btn>
        <Btn on={bridgeShow.alt14} onClick={() => togBridge("alt14")} color="#7c3aed" bg="#f5f3ff">{"\u{1F48A}"} P20+alt 14d</Btn>
        <Btn on={bridgeShow.sd} onClick={() => togBridge("sd")} color="#d97706" bg="#fffbeb">{"\u{1F48A}"} Step-down</Btn>
        <Btn on={bridgeShow.ut} onClick={() => togBridge("ut")} color="#e11d48" bg="#fff1f2">{"\u{1F48A}"} 15{"\u2192"}20</Btn>
        <Btn on={extra.pk} onClick={() => togExtra("pk")} color="#06b6d4" bg="#ecfeff">PK</Btn>
        <Btn on={extra.pd} onClick={() => togExtra("pd")} color="#a78bfa" bg="#f5f3ff">PD</Btn>
        <Btn on={extra.st} onClick={() => togExtra("st")} color="#ef4444" bg="#fef2f2">Stress</Btn>
      </div>

      <ResponsiveContainer width="100%" height={370}>
        <ComposedChart data={data} margin={{ top: 5, right: 8, left: -14, bottom: 5 }}>
          <defs>
            <linearGradient id="bwg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.18} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="btpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0891b2" stopOpacity={0.12} /><stop offset="100%" stopColor="#0891b2" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="btp14g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.12} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="bsdg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d97706" stopOpacity={0.12} /><stop offset="100%" stopColor="#d97706" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="butg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e11d48" stopOpacity={0.12} /><stop offset="100%" stopColor="#e11d48" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="bstg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} /></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="day" type="number" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={v => "D" + (v + 1)} stroke="#e2e8f0" domain={[0, N]} interval={4} />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} stroke="#e2e8f0" />
          <Tooltip trigger="click" content={<Tip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} />

          <ReferenceLine x={0} stroke="#fbbf2440" strokeDasharray="4 3" label={{ value: "Start", fill: "#fbbf2460", fontSize: 7, position: "top" }} />
          <ReferenceLine x={todayN} stroke="#ef4444b0" strokeDasharray="3 3" label={{ value: "Today", fill: "#ef4444", fontSize: 8, position: "top" }} />
          {bridgeShow.alt8 && (
            <>
              <ReferenceLine x={BRIDGE_START + 7} stroke="#0891b240" strokeDasharray="3 3" label={{ value: "\u2192alt8", fill: "#0891b280", fontSize: 7, position: "top" }} />
              <ReferenceLine x={BRIDGE_START + 15} stroke="#0891b230" strokeDasharray="3 3" label={{ value: "8d off", fill: "#0891b260", fontSize: 7, position: "top" }} />
            </>
          )}
          {bridgeShow.alt14 && (
            <>
              <ReferenceLine x={BRIDGE_START + 7} stroke="#7c3aed40" strokeDasharray="3 3" label={{ value: "\u2192alt14", fill: "#7c3aed80", fontSize: 7, position: "bottom" }} />
              <ReferenceLine x={BRIDGE_START + 21} stroke="#7c3aed30" strokeDasharray="3 3" label={{ value: "14d off", fill: "#7c3aed60", fontSize: 7, position: "bottom" }} />
            </>
          )}
          {bridgeShow.sd && (
            <>
              <ReferenceLine x={BRIDGE_START + 7} stroke="#d9770640" strokeDasharray="3 3" label={{ value: "\u2192q2d", fill: "#d9770680", fontSize: 7, position: "insideTop" }} />
              <ReferenceLine x={BRIDGE_START + 15} stroke="#d9770630" strokeDasharray="3 3" label={{ value: "\u2192q3d", fill: "#d9770660", fontSize: 7, position: "insideTop" }} />
              <ReferenceLine x={BRIDGE_START + 21} stroke="#d9770620" strokeDasharray="3 3" label={{ value: "SD off", fill: "#d9770650", fontSize: 7, position: "insideTop" }} />
            </>
          )}
          {bridgeShow.ut && (
            <>
              <ReferenceLine x={BRIDGE_START + 7} stroke="#e11d4840" strokeDasharray="3 3" label={{ value: "T15 alt", fill: "#e11d4880", fontSize: 7, position: "insideBottom" }} />
              <ReferenceLine x={BRIDGE_START + 14} stroke="#e11d4840" strokeDasharray="3 3" label={{ value: "\u2192T20", fill: "#e11d4880", fontSize: 7, position: "insideBottom" }} />
              <ReferenceLine x={BRIDGE_START + 21} stroke="#e11d4820" strokeDasharray="3 3" label={{ value: "T20 only", fill: "#e11d4860", fontSize: 7, position: "insideBottom" }} />
            </>
          )}

          <Area type="monotone" dataKey="wellbeing" fill="url(#bwg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="wbF" isAnimationActive={false} />
          {extra.st && <Area type="monotone" dataKey="stressScore" fill="url(#bstg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="stF" isAnimationActive={false} />}
          {bridgeShow.alt8 && <Area type="monotone" dataKey="taperWB" fill="url(#btpg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="tpF" isAnimationActive={false} connectNulls={false} />}
          {bridgeShow.alt14 && <Area type="monotone" dataKey="taper14WB" fill="url(#btp14g)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="tp14F" isAnimationActive={false} connectNulls={false} />}
          {bridgeShow.sd && <Area type="monotone" dataKey="sdWB" fill="url(#bsdg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="sdF" isAnimationActive={false} connectNulls={false} />}
          {bridgeShow.ut && <Area type="monotone" dataKey="utWB" fill="url(#butg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="utF" isAnimationActive={false} connectNulls={false} />}

          <Line type="monotone" dataKey="wellbeing" stroke="#22c55e" strokeWidth={2.5} dot={false} name="Actual" />
          {bridgeShow.alt8 && <Line type="monotone" dataKey="taperWB" stroke="#0891b2" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="P20+alt 8d" connectNulls={false} />}
          {bridgeShow.alt14 && <Line type="monotone" dataKey="taper14WB" stroke="#7c3aed" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="P20+alt 14d" connectNulls={false} />}
          {bridgeShow.sd && <Line type="monotone" dataKey="sdWB" stroke="#d97706" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="Step-down" connectNulls={false} />}
          {bridgeShow.ut && <Line type="monotone" dataKey="utWB" stroke="#e11d48" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="15\u219220mg" connectNulls={false} />}
          {extra.pk && <Line type="monotone" dataKey="pkScore" stroke="#06b6d4" strokeWidth={1} dot={false} strokeDasharray="4 3" name="PK Ceiling" />}
          {extra.pd && <Line type="monotone" dataKey="pdScore" stroke="#a78bfa" strokeWidth={1} dot={false} strokeDasharray="4 3" name="PD Maturation" />}
          {extra.st && <Line type="monotone" dataKey="stressScore" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Stress" />}

          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Strategy cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginTop: 12 }}>
        {[
          { label: "ACTUAL", sub: "Fast taper", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0",
            val: todayD?.wellbeing, vl: "now", note: `Dip ${minA.wellbeing.toFixed(1)}`, nc: "#ef4444", on: true },
          { label: "ALT 8d", sub: "7d+8d q2d", color: "#0891b2", bg: "#f0f9ff", border: "#a5f3fc",
            val: tlTaper.find(d => d.day === BRIDGE_START + 5)?.wellbeing, vl: "mid", note: "Dip ~0.8", nc: "#16a34a", on: bridgeShow.alt8 },
          { label: "ALT 14d", sub: "7d+14d q2d", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd",
            val: tlTpr14.find(d => d.day === BRIDGE_START + 5)?.wellbeing, vl: "mid", note: "Dip ~0.6", nc: "#16a34a", on: bridgeShow.alt14 },
          { label: "STEP-DOWN", sub: "7d+8d+6d", color: "#d97706", bg: "#fffbeb", border: "#fde68a",
            val: tlSD.find(d => d.day === BRIDGE_START + 5)?.wellbeing, vl: "mid", note: "Dip ~0.7", nc: "#16a34a", on: bridgeShow.sd },
          { label: "15\u219220", sub: "T15+T20 alt", color: "#e11d48", bg: "#fff1f2", border: "#fda4af",
            val: tlUT.find(d => d.day === BRIDGE_START + 5)?.wellbeing, vl: "mid", note: "Dip ~0.65", nc: "#16a34a", on: bridgeShow.ut },
        ].map((c, i) => (
          <div key={i} style={{ padding: "10px 6px", borderRadius: 10, background: c.on ? c.bg : "#f8fafc", border: `1px solid ${c.on ? c.border : "#e2e8f0"}`, opacity: c.on ? 1 : 0.3, textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: c.color }}>{c.label}</div>
            <div style={{ fontSize: 7, color: "#64748b", marginTop: 1 }}>{c.sub}</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: c.color, marginTop: 3 }}>{c.val?.toFixed(1) ?? "\u2014"}</div>
            <div style={{ fontSize: 7, color: "#64748b" }}>{c.vl}</div>
            <div style={{ fontSize: 8, color: c.nc, marginTop: 3, fontWeight: 600 }}>{c.note}</div>
          </div>
        ))}
      </div>

      {/* Dosing comparison */}
      <div style={{ margin: "12px 0", padding: "12px 14px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0" }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: "#334155", marginBottom: 8 }}>Dosing Schedule</div>

        {/* Pre-retitration (common to all) */}
        <div style={{ padding: "8px 10px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 10, fontSize: 11 }}>
          <div style={{ fontWeight: 700, color: "#475569", marginBottom: 4 }}>Pre-Bridge (all strategies)</div>
          <div style={{ color: "#64748b" }}>D0: T5 + P20 (start)</div>
          <div style={{ color: "#64748b" }}>D1–D7: T10 + P20 (overlap)</div>
          <div style={{ color: "#64748b" }}>D8–D22: T10 only (Prozac washout)</div>
          <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>D23 (bridge start) {"\u2192"} strategies diverge below</div>
        </div>

        <div style={{ fontWeight: 600, fontSize: 11, color: "#64748b", marginBottom: 6 }}>Bridge Phase (from D23)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, fontSize: 11 }}>
          <div>
            <div style={{ fontWeight: 700, color: "#0891b2", marginBottom: 3 }}>P20+alt 8d</div>
            <div style={{ color: "#64748b" }}>P20 daily × 7d</div>
            <div style={{ color: "#64748b" }}>P20 q2d × 8d</div>
            <div style={{ color: "#64748b" }}>Then T10 only</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>11 doses · soft taper</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#7c3aed", marginBottom: 3 }}>P20+alt 14d</div>
            <div style={{ color: "#64748b" }}>P20 daily × 7d</div>
            <div style={{ color: "#64748b" }}>P20 q2d × 14d</div>
            <div style={{ color: "#64748b" }}>Then T10 only</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>14 doses · softer taper</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#d97706", marginBottom: 3 }}>Step-down</div>
            <div style={{ color: "#64748b" }}>P20 daily × 7d</div>
            <div style={{ color: "#64748b" }}>P20 q2d × 8d</div>
            <div style={{ color: "#64748b" }}>P20 q3d × 6d</div>
            <div style={{ color: "#64748b" }}>Then T10 only</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>13 doses · gradual step-down</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#e11d48", marginBottom: 3 }}>15{"\u2192"}20mg</div>
            <div style={{ color: "#64748b" }}>T15+P20 daily × 7d</div>
            <div style={{ color: "#64748b" }}>T15+P20 q2d × 7d</div>
            <div style={{ color: "#64748b" }}>T20+P20 q2d × 7d</div>
            <div style={{ color: "#64748b" }}>Then T20 only</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>14 doses · uptitrate + taper</div>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f0f9ff", border: "1.5px solid #a5f3fc" }}>
        <div style={{ fontSize: 13, color: "#164e63", lineHeight: 1.7, direction: "rtl", textAlign: "right" }}>
          <b>P20 + alt 8d</b> — כיסוי של 15 ימים עם נחיתה רכה. ה-taper המובנה מוריד את הנורפלואוקסטין בהדרגה. Dip ~0.8 בלבד. 11 מנות סה״כ.
          <br /><br />
          <b>P20 + alt 14d</b> — כיסוי ארוך יותר: 21 ימים (7d רציף + 14d יום כן יום). Dip ~0.6 — הנמוך מכל האסטרטגיות. כיסוי PD ארוך יותר.
          <br /><br />
          <b>Step-down</b> — 21 ימי כיסוי (7d רציף + 8d כל יום שני + 6d כל יום שלישי). ירידה הדרגתית בתלת-שלבים. 13 מנות. נחיתה הכי חלקה מבחינת קצב ירידת fE.
          <br /><br />
          <b>15{"\u2192"}20mg</b> — אופציית uptitrate: שבוע ראשון T15 + P20 alt, שבוע שני T20 + P20 alt, ואז T20 בלבד. מכסה את חוסר הוודאות ב-CYP2D6 (1.5×–2.2×) ונותן SERT 83–90% בטווח המלא. היתרון: מגיע למינון אופטימלי תוך כדי הגשר.
          <br /><br />
          <b>כלל אצבע:</b> alt days שובר את דפוס ההצטברות. step-down מוסיף שלב שלישי (q3d) שמאט את הירידה עוד יותר.
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ margin: "12px 0 0", padding: "10px 12px", borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa", fontSize: 12, color: "#92400e" }}>
        {"\u26A0\uFE0F"} <b>{"\u05D7\u05E9\u05D5\u05D1:"}</b> {"\u05D6\u05D5 \u05D4\u05DE\u05DC\u05E6\u05D4 \u05DE\u05D1\u05D5\u05E1\u05E1\u05EA \u05DE\u05D5\u05D3\u05DC PK/PD \u05EA\u05D9\u05D0\u05D5\u05E8\u05D8\u05D9. \u05D9\u05E9 \u05DC\u05D3\u05D5\u05DF \u05E2\u05DD \u05D4\u05E4\u05E1\u05D9\u05DB\u05D9\u05D0\u05D8\u05E8 \u05DC\u05E4\u05E0\u05D9 \u05EA\u05D7\u05D9\u05DC\u05EA \u05DB\u05DC \u05D2\u05D9\u05E9\u05D5\u05E8."}
      </div>

      <div style={{ textAlign: "center", fontSize: 9, color: "#94a3b8", padding: "10px 0 0" }}>{"\u26A0"} Theoretical PK/PD projection — not validated clinical data</div>
    </div>
  );
}

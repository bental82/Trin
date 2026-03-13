import { useState, useMemo } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { getDose, pkCalc, computePD, computeAll, getTodayN } from "@/components/tracker/pkEngine";

// ── Dose schedules ──
// Each returns [vortioxetine_mg, prozac_mg] for a given day

const doseActual = getDose;

function makeBridgeDose(todayN, bridgeDays) {
  return d => {
    if (d < 0) return [0, 40];
    if (d === 0) return [5, 20];
    if (d <= 7) return [10, 20];
    if (d < todayN) return [10, 0];
    if (d < todayN + bridgeDays) return [10, 20];
    return [10, 0];
  };
}

function makeTaperDose(todayN) {
  return d => {
    if (d < 0) return [0, 40];
    if (d === 0) return [5, 20];
    if (d <= 7) return [10, 20];
    if (d < todayN) return [10, 0];
    if (d >= todayN && d < todayN + 7) return [10, 20];
    const bd = d - todayN;
    if (bd >= 7 && bd < 15) return [10, ((bd - 7) % 2 === 0) ? 20 : 0];
    return [10, 0];
  };
}

function makeTaperDose14(todayN) {
  return d => {
    if (d < 0) return [0, 40];
    if (d === 0) return [5, 20];
    if (d <= 7) return [10, 20];
    if (d < todayN) return [10, 0];
    if (d >= todayN && d < todayN + 7) return [10, 20];
    const bd = d - todayN;
    if (bd >= 7 && bd < 21) return [10, ((bd - 7) % 2 === 0) ? 20 : 0];
    return [10, 0];
  };
}

const doseGradual = d => {
  if (d < 0) return [0, 40];
  if (d <= 6) return [5, 30];
  if (d <= 13) return [10, 20];
  if (d <= 20) return [10, 10];
  return [10, 0];
};

// ── PD variants ──

function pdGradual(day) {
  const base = computePD(day);
  return {
    ...base,
    norfluoxStress: Math.max(0, 4 * Math.exp(-0.5 * ((day - 32) / 10) ** 2)) * (1 / (1 + Math.exp(-1.0 * (day - 20)))),
    cypStress: Math.max(0, 3 * Math.exp(-0.5 * ((day - 36) / 12) ** 2)) * (1 / (1 + Math.exp(-1.0 * (day - 22)))),
  };
}

// ── Bridge stress curves ──

function makeBridgeStress(todayN, endOffset, amplitude, center, width, steepness) {
  return day => {
    const da = day - (todayN + endOffset);
    if (da <= 0) return 0;
    return Math.max(0, amplitude * Math.exp(-0.5 * ((da - center) / width) ** 2)) * (1 / (1 + Math.exp(-steepness * (da - 1))));
  };
}

function makeBridgeBoost(todayN, coverageDays) {
  return (day, pk) => {
    return (pk.fE > 2 && day >= todayN && day < todayN + coverageDays)
      ? Math.min(8, (pk.fE / 20) * 8)
      : 0;
  };
}

// ── Wellbeing calculator (reuses shared pkCalc + computePD) ──

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
  const day = payload[0]?.payload?.day;
  const skip = new Set(["wbF", "stF", "b10F", "b14F", "grF", "tpF", "tp14F"]);
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,.1)", maxWidth: 240 }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#334155" }}>Day {(day ?? 0) + 1}</div>
      {payload.filter(p => p.value != null && !skip.has(p.name)).map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "1px 0" }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 600, color: p.color }}>{p.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function BridgeTab() {
  const [show, setShow] = useState({ grad: false, b10: true, b14: true, taper: true, taper14: true, pk: false, pd: false, st: false });
  const tog = k => setShow(s => ({ ...s, [k]: !s[k] }));

  // Compute TODAY_N lazily so it's fresh if app stays open overnight
  const todayN = useMemo(() => getTodayN(), []);

  // Bridge strategies all start from day 23 (index 22) — when Prozac 20mg was restarted
  const BRIDGE_START = 22;

  const doseBridge10 = useMemo(() => makeBridgeDose(BRIDGE_START, 10), []);
  const doseBridge14 = useMemo(() => makeBridgeDose(BRIDGE_START, 14), []);
  const doseTaper    = useMemo(() => makeTaperDose(BRIDGE_START), []);
  const doseTpr14   = useMemo(() => makeTaperDose14(BRIDGE_START), []);

  const stress10d   = useMemo(() => makeBridgeStress(BRIDGE_START, 10, 2.0, 6, 5, 2), []);
  const stress14d   = useMemo(() => makeBridgeStress(BRIDGE_START, 14, 2.8, 7, 6, 1.8), []);
  const stressTaper = useMemo(() => makeBridgeStress(BRIDGE_START, 15, 0.8, 5, 4, 2.5), []);
  const stressTpr14 = useMemo(() => makeBridgeStress(BRIDGE_START, 21, 0.6, 5, 5, 2.5), []);

  const boost10d   = useMemo(() => makeBridgeBoost(BRIDGE_START, 15), []);
  const boost14d   = useMemo(() => makeBridgeBoost(BRIDGE_START, 19), []);
  const boostTaper = useMemo(() => makeBridgeBoost(BRIDGE_START, 20), []);
  const boostTpr14 = useMemo(() => makeBridgeBoost(BRIDGE_START, 26), []);

  const tl      = useMemo(() => gen(doseActual, computePD), []);
  const tlGrad  = useMemo(() => gen(doseGradual, pdGradual), []);
  const tlB10   = useMemo(() => gen(doseBridge10, computePD, stress10d, boost10d), [doseBridge10, stress10d, boost10d]);
  const tlB14   = useMemo(() => gen(doseBridge14, computePD, stress14d, boost14d), [doseBridge14, stress14d, boost14d]);
  const tlTaper = useMemo(() => gen(doseTaper, computePD, stressTaper, boostTaper), [doseTaper, stressTaper, boostTaper]);
  const tlTpr14 = useMemo(() => gen(doseTpr14, computePD, stressTpr14, boostTpr14), [doseTpr14, stressTpr14, boostTpr14]);

  const data = useMemo(() => tl.map((d, i) => ({
    ...d,
    gradWB: tlGrad[i]?.wellbeing ?? null,
    b10WB: i >= BRIDGE_START ? (tlB10[i]?.wellbeing ?? null) : null,
    b14WB: i >= BRIDGE_START ? (tlB14[i]?.wellbeing ?? null) : null,
    taperWB: i >= BRIDGE_START ? (tlTaper[i]?.wellbeing ?? null) : null,
    taper14WB: i >= BRIDGE_START ? (tlTpr14[i]?.wellbeing ?? null) : null,
  })), [tl, tlGrad, tlB10, tlB14, tlTaper, tlTpr14, todayN]);

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
        <Btn on={show.grad} onClick={() => tog("grad")} color="#7c3aed" bg="#f5f3ff">{"\u{1F4CB}"} Gradual</Btn>
        <Btn on={show.b10} onClick={() => tog("b10")} color="#d97706" bg="#fffbeb">{"\u{1F48A}"} P20×10d</Btn>
        <Btn on={show.b14} onClick={() => tog("b14")} color="#e11d48" bg="#fff1f2">{"\u{1F48A}"} P20×14d</Btn>
        <Btn on={show.taper} onClick={() => tog("taper")} color="#0891b2" bg="#f0f9ff">{"\u{1F48A}"} P20+alt 8d</Btn>
        <Btn on={show.taper14} onClick={() => tog("taper14")} color="#7c3aed" bg="#f5f3ff">{"\u{1F48A}"} P20+alt 14d</Btn>
        <Btn on={show.pk} onClick={() => tog("pk")} color="#06b6d4" bg="#ecfeff">PK</Btn>
        <Btn on={show.pd} onClick={() => tog("pd")} color="#a78bfa" bg="#f5f3ff">PD</Btn>
        <Btn on={show.st} onClick={() => tog("st")} color="#ef4444" bg="#fef2f2">Stress</Btn>
      </div>

      <ResponsiveContainer width="100%" height={370}>
        <ComposedChart data={data} margin={{ top: 5, right: 8, left: -14, bottom: 5 }}>
          <defs>
            <linearGradient id="bwg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.18} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="bgrg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.1} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="bb10g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.1} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="bb14g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e11d48" stopOpacity={0.1} /><stop offset="100%" stopColor="#e11d48" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="btpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0891b2" stopOpacity={0.12} /><stop offset="100%" stopColor="#0891b2" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="btp14g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.12} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="bstg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} /></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="day" type="number" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={v => "D" + (v + 1)} stroke="#e2e8f0" domain={[0, N]} interval={4} />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} stroke="#e2e8f0" />
          <Tooltip content={<Tip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} />

          <ReferenceLine x={0} stroke="#fbbf2440" strokeDasharray="4 3" label={{ value: "Start", fill: "#fbbf2460", fontSize: 7, position: "top" }} />
          <ReferenceLine x={todayN} stroke="#ef4444b0" strokeDasharray="3 3" label={{ value: "Today", fill: "#ef4444", fontSize: 8, position: "top" }} />
          {show.grad && <ReferenceLine x={21} stroke="#8b5cf640" strokeDasharray="3 3" label={{ value: "Grad off", fill: "#8b5cf660", fontSize: 7, position: "top" }} />}
          {show.b10 && <ReferenceLine x={BRIDGE_START + 10} stroke="#f59e0b40" strokeDasharray="3 3" label={{ value: "10d end", fill: "#d9770680", fontSize: 7, position: "top" }} />}
          {show.b14 && <ReferenceLine x={BRIDGE_START + 14} stroke="#e11d4840" strokeDasharray="3 3" label={{ value: "14d end", fill: "#e11d4880", fontSize: 7, position: "top" }} />}
          {show.taper && (
            <>
              <ReferenceLine x={BRIDGE_START + 7} stroke="#0891b240" strokeDasharray="3 3" label={{ value: "\u2192alt8", fill: "#0891b280", fontSize: 7, position: "top" }} />
              <ReferenceLine x={BRIDGE_START + 15} stroke="#0891b230" strokeDasharray="3 3" label={{ value: "P off", fill: "#0891b260", fontSize: 7, position: "top" }} />
            </>
          )}
          {show.taper14 && (
            <>
              <ReferenceLine x={BRIDGE_START + 7} stroke="#7c3aed40" strokeDasharray="3 3" label={{ value: "\u2192alt14", fill: "#7c3aed80", fontSize: 7, position: "bottom" }} />
              <ReferenceLine x={BRIDGE_START + 21} stroke="#7c3aed30" strokeDasharray="3 3" label={{ value: "P off", fill: "#7c3aed60", fontSize: 7, position: "bottom" }} />
            </>
          )}

          <Area type="monotone" dataKey="wellbeing" fill="url(#bwg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="wbF" isAnimationActive={false} />
          {show.st && <Area type="monotone" dataKey="stressScore" fill="url(#bstg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="stF" isAnimationActive={false} />}
          {show.grad && <Area type="monotone" dataKey="gradWB" fill="url(#bgrg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="grF" isAnimationActive={false} />}
          {show.b10 && <Area type="monotone" dataKey="b10WB" fill="url(#bb10g)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="b10F" isAnimationActive={false} connectNulls={false} />}
          {show.b14 && <Area type="monotone" dataKey="b14WB" fill="url(#bb14g)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="b14F" isAnimationActive={false} connectNulls={false} />}
          {show.taper && <Area type="monotone" dataKey="taperWB" fill="url(#btpg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="tpF" isAnimationActive={false} connectNulls={false} />}
          {show.taper14 && <Area type="monotone" dataKey="taper14WB" fill="url(#btp14g)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="tp14F" isAnimationActive={false} connectNulls={false} />}

          <Line type="monotone" dataKey="wellbeing" stroke="#22c55e" strokeWidth={2.5} dot={false} name="Actual" />
          {show.grad && <Line type="monotone" dataKey="gradWB" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="8 4" name="Gradual" />}
          {show.b10 && <Line type="monotone" dataKey="b10WB" stroke="#d97706" strokeWidth={2} dot={false} strokeDasharray="6 3" name={"P20\u00d710d"} connectNulls={false} />}
          {show.b14 && <Line type="monotone" dataKey="b14WB" stroke="#e11d48" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name={"P20\u00d714d"} connectNulls={false} />}
          {show.taper && <Line type="monotone" dataKey="taperWB" stroke="#0891b2" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="P20+alt 8d" connectNulls={false} />}
          {show.taper14 && <Line type="monotone" dataKey="taper14WB" stroke="#7c3aed" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="P20+alt 14d" connectNulls={false} />}
          {show.pk && <Line type="monotone" dataKey="pkScore" stroke="#06b6d4" strokeWidth={1} dot={false} strokeDasharray="4 3" name="PK Ceiling" />}
          {show.pd && <Line type="monotone" dataKey="pdScore" stroke="#a78bfa" strokeWidth={1} dot={false} strokeDasharray="4 3" name="PD Maturation" />}
          {show.st && <Line type="monotone" dataKey="stressScore" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Stress" />}

          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Strategy cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginTop: 12 }}>
        {[
          { label: "ACTUAL", sub: "Fast taper", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0",
            val: todayD?.wellbeing, vl: "now", note: `Dip ${minA.wellbeing.toFixed(1)}`, nc: "#ef4444", on: true },
          { label: "P20\u00d710d", sub: "10 doses", color: "#d97706", bg: "#fffbeb", border: "#fde68a",
            val: tlB10.find(d => d.day === BRIDGE_START + 5)?.wellbeing, vl: "mid", note: "Dip ~2.0", nc: "#d97706", on: show.b10 },
          { label: "P20\u00d714d", sub: "14 doses", color: "#e11d48", bg: "#fff1f2", border: "#fecdd3",
            val: tlB14.find(d => d.day === BRIDGE_START + 7)?.wellbeing, vl: "mid", note: "Dip ~2.8", nc: "#e11d48", on: show.b14 },
          { label: "ALT 8d", sub: "7d+8d taper", color: "#0891b2", bg: "#f0f9ff", border: "#a5f3fc",
            val: tlTaper.find(d => d.day === BRIDGE_START + 5)?.wellbeing, vl: "mid", note: "Dip ~0.8", nc: "#16a34a", on: show.taper },
          { label: "ALT 14d", sub: "7d+14d taper", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd",
            val: tlTpr14.find(d => d.day === BRIDGE_START + 5)?.wellbeing, vl: "mid", note: "Dip ~0.6", nc: "#16a34a", on: show.taper14 },
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
        <div style={{ fontWeight: 700, fontSize: 12, color: "#334155", marginBottom: 8 }}>Dosing Comparison</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, fontSize: 11 }}>
          <div>
            <div style={{ fontWeight: 700, color: "#d97706", marginBottom: 3 }}>P20×10d</div>
            <div style={{ color: "#64748b" }}>P20 daily × 10d</div>
            <div style={{ color: "#64748b" }}>Then T10 only</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>10 doses · sharp stop</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#e11d48", marginBottom: 3 }}>P20×14d</div>
            <div style={{ color: "#64748b" }}>P20 daily × 14d</div>
            <div style={{ color: "#64748b" }}>Then T10 only</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>14 doses · sharp stop</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#0891b2", marginBottom: 3 }}>P20+alt 8d</div>
            <div style={{ color: "#64748b" }}>P20 daily × 7d</div>
            <div style={{ color: "#64748b" }}>P20 alt days × 8d</div>
            <div style={{ color: "#64748b" }}>Then T10 only</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>11 doses · soft taper</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#7c3aed", marginBottom: 3 }}>P20+alt 14d</div>
            <div style={{ color: "#64748b" }}>P20 daily × 7d</div>
            <div style={{ color: "#64748b" }}>P20 alt days × 14d</div>
            <div style={{ color: "#64748b" }}>Then T10 only</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>14 doses · softer taper</div>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f0f9ff", border: "1.5px solid #a5f3fc" }}>
        <div style={{ fontSize: 13, color: "#164e63", lineHeight: 1.7, direction: "rtl", textAlign: "right" }}>
          <b>P20×14d</b> — כיסוי ארוך יותר, אבל 14 יום של P20 רציף = יותר הצטברות נורפלואוקסטין, ואז עצירה חדה → dip ~2.8. גדול יותר מ-10d וכמעט כמו P40→P20.
          <br /><br />
          <b>P20×10d</b> — כיסוי בינוני. 10 ימים מספיקים לגשר על חלון ה-PD הקריטי, אבל עצירה חדה עדיין יוצרת dip ~2.0.
          <br /><br />
          <b>P20 + alt 8d</b> — כיסוי של 15 ימים עם נחיתה רכה. ה-taper המובנה מוריד את הנורפלואוקסטין בהדרגה. Dip ~0.8 בלבד. 11 מנות סה״כ.
          <br /><br />
          <b>P20 + alt 14d</b> — כיסוי ארוך יותר: 21 ימים (7d רציף + 14d יום כן יום). 14 מנות alt days שומרות על רמות נורפלואוקסטין נמוכות ויציבות. Dip ~0.6 — הנמוך מכל האסטרטגיות. כיסוי PD ארוך יותר.
          <br /><br />
          <b>כלל אצבע:</b> ככל שיותר ימים של P20 רציף → יותר הצטברות → יותר dip בעצירה. alt days שובר את הדפוס הזה. alt 14d ממשיך את ההגנה עוד יותר.
        </div>
      </div>

      {/* Final recommendation */}
      <div style={{ margin: "12px 0 0", padding: "16px 18px", borderRadius: 12, background: "linear-gradient(135deg, #ecfdf5, #f0f9ff)", border: "2px solid #6ee7b7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>{"\u{1F3C6}"}</span>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#065f46" }}>השוואת המלצות: alt 8d vs alt 14d</div>
        </div>
        <div style={{ fontSize: 13, color: "#164e63", lineHeight: 1.8, direction: "rtl", textAlign: "right" }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px", marginBottom: 10 }}>
            <span>{"\u{1F48A}"}</span><span><b>alt 8d:</b> P20 יומי × 7d, ואז P20 כל יום שני × 8d (11 מנות, 15 ימי כיסוי). Dip ~0.8.</span>
            <span>{"\u{1F48A}"}</span><span><b>alt 14d:</b> P20 יומי × 7d, ואז P20 כל יום שני × 14d (14 מנות, 21 ימי כיסוי). Dip ~0.6 — הנמוך מכל האסטרטגיות.</span>
            <span>{"\u{1F9EC}"}</span><span><b>למה alt days עובד:</b> ימי הפסקה נותנים לנורפלואוקסטין (t½≈9d) לרדת בהדרגה במקום הצטברות ועצירה חדה</span>
            <span>{"\u23F1\uFE0F"}</span><span><b>alt 14d יתרון:</b> 21 ימי כיסוי מגשרים גם על חלון ה-BDNF וה-DMN, לא רק autoreceptor + GABA</span>
            <span>{"\u{1F4C9}"}</span><span><b>מחיר:</b> alt 14d = 3 מנות נוספות (14 vs 11), אבל עומס CYP נמוך כי זה יום כן יום</span>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa", fontSize: 12, color: "#92400e", marginTop: 6 }}>
            ⚠️ <b>חשוב:</b> זו המלצה מבוססת מודל PK/PD תיאורטי. יש לדון עם הפסיכיאטר לפני תחילת כל גישור. ההחלטה הסופית צריכה לשלב שיקול קליני ואת התחושות שלך.
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 9, color: "#94a3b8", padding: "10px 0 0" }}>⚠ Theoretical PK/PD projection — not validated clinical data</div>
    </div>
  );
}
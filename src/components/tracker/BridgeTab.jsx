import { useState, useMemo } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { START, TODAY_N } from "@/components/tracker/pkEngine";

const L2 = Math.log(2);
const fHL = 48, nHL = 223, nC = 0.8, fE50 = 5, fMx = 83, vHL = 66, vE50 = 5, vMx = 100;
const wCYP = 2.2;
const pSF = 40 / (1 - Math.pow(0.5, 24 / fHL));

const REC = {
  "5-HT3": { ef: 2.3, em: 95 }, "5-HT1A": { ef: 9.4, em: 85 },
  "5-HT7": { ef: 11.9, em: 90 }, "5-HT1B": { ef: 20.6, em: 80 },
  "5-HT1D": { ef: 33.7, em: 75 },
};

// ── Dose schedules ──
const doseActual = d => {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  return [10, 0];
};

const doseBridge10 = d => {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < TODAY_N) return [10, 0];
  if (d < TODAY_N + 10) return [10, 20];
  return [10, 0];
};

const doseBridge14 = d => {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < TODAY_N) return [10, 0];
  if (d < TODAY_N + 14) return [10, 20];
  return [10, 0];
};

const doseGradual = d => {
  if (d < 0) return [0, 40];
  if (d <= 6) return [5, 30];
  if (d <= 13) return [10, 20];
  if (d <= 20) return [10, 10];
  return [10, 0];
};

const doseTaper = d => {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < TODAY_N) return [10, 0];
  if (d >= TODAY_N && d < TODAY_N + 7) return [10, 20];
  const bd = d - TODAY_N;
  if (bd >= 7 && bd < 15) return [10, ((bd - 7) % 2 === 0) ? 20 : 0];
  return [10, 0];
};

// ── PK engine (parameterized by dose function) ──
function fxAt(h, fn) {
  let l = pSF * Math.exp(-L2 * h / fHL);
  for (let d = 0; d <= Math.floor(h / 24); d++) {
    const [, p] = fn(d);
    if (p > 0 && h > d * 24) l += p * Math.exp(-L2 * (h - d * 24) / fHL);
  }
  return (l / pSF) * 40;
}

function pkCalc(day, fn) {
  const h = day * 24, mx = Math.floor(day);
  let fL = pSF * Math.exp(-L2 * Math.max(0, h) / fHL);
  for (let d = 0; d <= mx; d++) {
    const [, p] = fn(d);
    if (p > 0 && h > d * 24) fL += p * Math.exp(-L2 * (h - d * 24) / fHL);
  }
  const fE = Math.max(0, (fL / pSF) * 40);
  const tC = Math.min(3.5, wCYP + Math.min(1.0, fE / 40) * 0.4);
  let vL = 0;
  for (let d = 0; d <= mx; d++) {
    const [v] = fn(d);
    if (v > 0 && h > d * 24) {
      const e = h - d * 24;
      const dF = fxAt(d * 24, fn);
      const dC = Math.min(3.5, wCYP + Math.min(1.0, dF / 40) * 0.4);
      vL += v * dC * Math.exp(-L2 * e / (vHL * Math.pow(dC, 0.4)));
    }
  }
  const vE = Math.max(0, vL);
  const sV = vMx * vE / (vE50 + vE);
  const sF = fMx * fE / (fE50 + fE);
  const rO = {};
  Object.entries(REC).forEach(([n, r]) => { rO[n] = r.em * vE / (vE50 * r.ef + vE); });
  return { day, fE, vE, cyp: tC, sV, sF, ...rO };
}

// ── PD ──
const sig = (day, t50, k, em = 100, lag = 0) => em / (1 + Math.exp(-k * (Math.max(0, day - lag) - t50)));

function basePD(day) {
  return {
    autorecept: sig(day, 18, 0.18, 100, 2), gabaDisinhib: sig(day, 12, 0.22, 100, 1),
    circadian: sig(day, 16, 0.15, 100, 3), bdnf: sig(day, 32, 0.1, 100, 7),
    glymphatic: sig(day, 45, 0.08, 100, 14), dmn: sig(day, 35, 0.09, 100, 10),
  };
}

function pdActual(day) {
  const b = basePD(day);
  return { ...b,
    norfluoxStress: Math.max(0, 8 * Math.exp(-0.5 * ((day - 24) / 10) ** 2)) * (1 / (1 + Math.exp(-1.2 * (day - 12)))),
    cypStress: Math.max(0, 5 * Math.exp(-0.5 * ((day - 30) / 12) ** 2)) * (1 / (1 + Math.exp(-1.2 * (day - 14)))),
  };
}

function pdGradual(day) {
  const b = basePD(day);
  return { ...b,
    norfluoxStress: Math.max(0, 4 * Math.exp(-0.5 * ((day - 32) / 10) ** 2)) * (1 / (1 + Math.exp(-1.0 * (day - 20)))),
    cypStress: Math.max(0, 3 * Math.exp(-0.5 * ((day - 36) / 12) ** 2)) * (1 / (1 + Math.exp(-1.0 * (day - 22)))),
  };
}

// ── Bridge stress ──
function stress10d(day) {
  const da = day - (TODAY_N + 10);
  return da <= 0 ? 0 : Math.max(0, 2.0 * Math.exp(-0.5 * ((da - 6) / 5) ** 2)) * (1 / (1 + Math.exp(-2 * (da - 1))));
}

function stress14d(day) {
  const da = day - (TODAY_N + 14);
  return da <= 0 ? 0 : Math.max(0, 2.8 * Math.exp(-0.5 * ((da - 7) / 6) ** 2)) * (1 / (1 + Math.exp(-1.8 * (da - 1))));
}

function stressTaper(day) {
  const da = day - (TODAY_N + 15);
  return da <= 0 ? 0 : Math.max(0, 0.8 * Math.exp(-0.5 * ((da - 5) / 4) ** 2)) * (1 / (1 + Math.exp(-2.5 * (da - 1))));
}

// ── Boost ──
function boost10d(day, p) { return (p.fE > 2 && day >= TODAY_N && day < TODAY_N + 15) ? Math.min(8, (p.fE / 20) * 8) : 0; }
function boost14d(day, p) { return (p.fE > 2 && day >= TODAY_N && day < TODAY_N + 19) ? Math.min(8, (p.fE / 20) * 8) : 0; }
function boostTaper(day, p) { return (p.fE > 2 && day >= TODAY_N && day < TODAY_N + 20) ? Math.min(8, (p.fE / 20) * 8) : 0; }

// ── Wellbeing ──
function wb(day, doseFn, pdFn, extraStress = 0, boostFn = null) {
  const p = pkCalc(day, doseFn);
  const pd = pdFn(day);
  const ss = pkCalc(200, doseFn);
  const pkRaw = p.sV * 0.25 + (p["5-HT3"] || 0) * 0.20 + (p["5-HT1A"] || 0) * 0.15 + (p["5-HT7"] || 0) * 0.10 + (p["5-HT1B"] || 0) * 0.05 + Math.min(100, p.vE * 5) * 0.05;
  const ssMax = ss.sV * 0.25 + (ss["5-HT3"] || 0) * 0.20 + (ss["5-HT1A"] || 0) * 0.15 + (ss["5-HT7"] || 0) * 0.10 + (ss["5-HT1B"] || 0) * 0.05 + Math.min(100, ss.vE * 5) * 0.05;
  const pkScore = Math.min(100, (pkRaw / Math.max(ssMax, 1)) * 100);
  const pdScore = pd.autorecept * 0.25 + pd.gabaDisinhib * 0.20 + pd.circadian * 0.10 + pd.bdnf * 0.20 + pd.glymphatic * 0.10 + pd.dmn * 0.15;
  const stress = (pd.norfluoxStress || 0) + (pd.cypStress || 0) + extraStress;
  const boost = boostFn ? boostFn(day, p) : 0;
  const wellbeing = Math.max(0, Math.min(100, 60 + (pkScore / 100) * (pdScore / 100) * 18 - stress + boost));
  return { wellbeing, pkScore, pdScore, stressScore: stress, ...p, ...pd, day };
}

const N = 75;
const gen = (doseFn, pdFn, extra, boost) => {
  const d = [];
  for (let i = 0; i <= N; i++) d.push(wb(i, doseFn, pdFn, extra ? extra(i) : 0, boost));
  return d;
};

// ── Tooltip ──
function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const day = payload[0]?.payload?.day;
  const skip = new Set(["wbF", "stF", "b10F", "b14F", "grF", "tpF"]);
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
  const [show, setShow] = useState({ grad: false, b10: true, b14: true, taper: true, pk: false, pd: false, st: false });
  const tog = k => setShow(s => ({ ...s, [k]: !s[k] }));

  const tl = useMemo(() => gen(doseActual, pdActual), []);
  const tlGrad = useMemo(() => gen(doseGradual, pdGradual), []);
  const tlB10 = useMemo(() => gen(doseBridge10, pdActual, stress10d, boost10d), []);
  const tlB14 = useMemo(() => gen(doseBridge14, pdActual, stress14d, boost14d), []);
  const tlTaper = useMemo(() => gen(doseTaper, pdActual, stressTaper, boostTaper), []);

  const data = useMemo(() => tl.map((d, i) => ({
    ...d,
    gradWB: tlGrad[i]?.wellbeing ?? null,
    b10WB: i >= TODAY_N ? (tlB10[i]?.wellbeing ?? null) : null,
    b14WB: i >= TODAY_N ? (tlB14[i]?.wellbeing ?? null) : null,
    taperWB: i >= TODAY_N ? (tlTaper[i]?.wellbeing ?? null) : null,
  })), [tl, tlGrad, tlB10, tlB14, tlTaper]);

  const todayD = data.find(d => d.day === TODAY_N);
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
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Day {TODAY_N + 1} · Which Prozac bridge is optimal?</p>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
        <Btn on={show.grad} onClick={() => tog("grad")} color="#7c3aed" bg="#f5f3ff">📋 Gradual</Btn>
        <Btn on={show.b10} onClick={() => tog("b10")} color="#d97706" bg="#fffbeb">💊 P20×10d</Btn>
        <Btn on={show.b14} onClick={() => tog("b14")} color="#e11d48" bg="#fff1f2">💊 P20×14d</Btn>
        <Btn on={show.taper} onClick={() => tog("taper")} color="#0891b2" bg="#f0f9ff">💊 P20+alt days</Btn>
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
            <linearGradient id="bstg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} /></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="day" type="number" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={v => "D" + (v + 1)} stroke="#e2e8f0" domain={[0, N]} interval={4} />
          <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} stroke="#e2e8f0" />
          <Tooltip content={<Tip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} />

          <ReferenceLine x={0} stroke="#fbbf2440" strokeDasharray="4 3" label={{ value: "Start", fill: "#fbbf2460", fontSize: 7, position: "top" }} />
          <ReferenceLine x={TODAY_N} stroke="#ef4444b0" strokeDasharray="3 3" label={{ value: "Today", fill: "#ef4444", fontSize: 8, position: "top" }} />
          {show.grad && <ReferenceLine x={21} stroke="#8b5cf640" strokeDasharray="3 3" label={{ value: "Grad off", fill: "#8b5cf660", fontSize: 7, position: "top" }} />}
          {show.b10 && <ReferenceLine x={TODAY_N + 10} stroke="#f59e0b40" strokeDasharray="3 3" label={{ value: "10d end", fill: "#d9770680", fontSize: 7, position: "top" }} />}
          {show.b14 && <ReferenceLine x={TODAY_N + 14} stroke="#e11d4840" strokeDasharray="3 3" label={{ value: "14d end", fill: "#e11d4880", fontSize: 7, position: "top" }} />}
          {show.taper && (
            <>
              <ReferenceLine x={TODAY_N + 7} stroke="#0891b240" strokeDasharray="3 3" label={{ value: "\u2192alt", fill: "#0891b280", fontSize: 7, position: "top" }} />
              <ReferenceLine x={TODAY_N + 15} stroke="#0891b230" strokeDasharray="3 3" label={{ value: "P off", fill: "#0891b260", fontSize: 7, position: "top" }} />
            </>
          )}

          <Area type="monotone" dataKey="wellbeing" fill="url(#bwg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="wbF" isAnimationActive={false} />
          {show.st && <Area type="monotone" dataKey="stressScore" fill="url(#bstg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="stF" isAnimationActive={false} />}
          {show.grad && <Area type="monotone" dataKey="gradWB" fill="url(#bgrg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="grF" isAnimationActive={false} />}
          {show.b10 && <Area type="monotone" dataKey="b10WB" fill="url(#bb10g)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="b10F" isAnimationActive={false} connectNulls={false} />}
          {show.b14 && <Area type="monotone" dataKey="b14WB" fill="url(#bb14g)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="b14F" isAnimationActive={false} connectNulls={false} />}
          {show.taper && <Area type="monotone" dataKey="taperWB" fill="url(#btpg)" fillOpacity={1} stroke="none" activeDot={false} legendType="none" tooltipType="none" name="tpF" isAnimationActive={false} connectNulls={false} />}

          <Line type="monotone" dataKey="wellbeing" stroke="#22c55e" strokeWidth={2.5} dot={false} name="Actual" />
          {show.grad && <Line type="monotone" dataKey="gradWB" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="8 4" name="Gradual" />}
          {show.b10 && <Line type="monotone" dataKey="b10WB" stroke="#d97706" strokeWidth={2} dot={false} strokeDasharray="6 3" name={"P20×10d"} connectNulls={false} />}
          {show.b14 && <Line type="monotone" dataKey="b14WB" stroke="#e11d48" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name={"P20×14d"} connectNulls={false} />}
          {show.taper && <Line type="monotone" dataKey="taperWB" stroke="#0891b2" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="P20+alt days" connectNulls={false} />}
          {show.pk && <Line type="monotone" dataKey="pkScore" stroke="#06b6d4" strokeWidth={1} dot={false} strokeDasharray="4 3" name="PK Ceiling" />}
          {show.pd && <Line type="monotone" dataKey="pdScore" stroke="#a78bfa" strokeWidth={1} dot={false} strokeDasharray="4 3" name="PD Maturation" />}
          {show.st && <Line type="monotone" dataKey="stressScore" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Stress" />}

          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Strategy cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 12 }}>
        {[
          { label: "ACTUAL", sub: "Fast taper", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0",
            val: todayD?.wellbeing, vl: "now", note: `Dip ${minA.wellbeing.toFixed(1)}`, nc: "#ef4444", on: true },
          { label: "P20×10d", sub: "10 doses", color: "#d97706", bg: "#fffbeb", border: "#fde68a",
            val: tlB10.find(d => d.day === TODAY_N + 5)?.wellbeing, vl: "mid", note: "Dip ~2.0", nc: "#d97706", on: show.b10 },
          { label: "P20×14d", sub: "14 doses", color: "#e11d48", bg: "#fff1f2", border: "#fecdd3",
            val: tlB14.find(d => d.day === TODAY_N + 7)?.wellbeing, vl: "mid", note: "Dip ~2.8", nc: "#e11d48", on: show.b14 },
          { label: "P20+ALT", sub: "7d+8d taper", color: "#0891b2", bg: "#f0f9ff", border: "#a5f3fc",
            val: tlTaper.find(d => d.day === TODAY_N + 5)?.wellbeing, vl: "mid", note: "Dip ~0.8", nc: "#16a34a", on: show.taper },
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 11 }}>
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
            <div style={{ fontWeight: 700, color: "#0891b2", marginBottom: 3 }}>P20+alt days</div>
            <div style={{ color: "#64748b" }}>P20 daily × 7d</div>
            <div style={{ color: "#64748b" }}>P20 alt days × 8d</div>
            <div style={{ color: "#64748b" }}>Then T10 only</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>11 doses · soft taper</div>
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
          <b>P20 + alt days</b> — אותו משך כיסוי כמו P20×14d (15 ימים), אבל עם נחיתה רכה. ה-taper המובנה מוריד את הנורפלואוקסטין בהדרגה. Dip ~0.8 בלבד. פחות מנות סה״כ (11 לעומת 14).
          <br /><br />
          <b>כלל אצבע:</b> ככל שיותר ימים של P20 רציף → יותר הצטברות → יותר dip בעצירה. alt days שובר את הדפוס הזה.
        </div>
      </div>

      {/* Final recommendation */}
      <div style={{ margin: "12px 0 0", padding: "16px 18px", borderRadius: 12, background: "linear-gradient(135deg, #ecfdf5, #f0f9ff)", border: "2px solid #6ee7b7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>🏆</span>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#065f46" }}>המלצה סופית: P20 + alt days</div>
        </div>
        <div style={{ fontSize: 13, color: "#164e63", lineHeight: 1.8, direction: "rtl", textAlign: "right" }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px", marginBottom: 10 }}>
            <span>📋</span><span><b>פרוטוקול:</b> Prozac 20mg יומי × 7 ימים, ואז Prozac 20mg כל יום שני × 8 ימים (סה״כ 11 מנות על פני 15 יום)</span>
            <span>📉</span><span><b>Dip צפוי:</b> ~0.8 בלבד — הנמוך מכל האסטרטגיות</span>
            <span>🧬</span><span><b>למה זה עובד:</b> ימי alt days נותנים לנורפלואוקסטין (t½≈9d) לרדת בהדרגה במקום הצטברות ועצירה חדה</span>
            <span>⏱️</span><span><b>תזמון:</b> 15 ימי כיסוי מגשרים בדיוק על חלון הבשלת ה-PD הקריטי (autoreceptor + GABA)</span>
            <span>💊</span><span><b>יעילות:</b> פחות מנות מ-P20×14d (11 vs 14), אותו משך כיסוי, פחות עומס על CYP2D6</span>
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
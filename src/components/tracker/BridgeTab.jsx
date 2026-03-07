import { useState, useMemo } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { getDose, computeAll, getTodayN, FATIGUE_DECAY, FATIGUE_WEIGHT } from "@/components/tracker/pkEngine";

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

const doseGradual = d => {
  if (d < 0) return [0, 40];
  if (d <= 6) return [5, 30];
  if (d <= 13) return [10, 20];
  if (d <= 20) return [10, 10];
  return [10, 0];
};

// ── Cumulative fatigue from serotonergic over-activation ──
// Instead of arbitrary Gaussian stress curves that simulate "withdrawal"
// (which barely exists for fluoxetine due to norfluoxetine's 9-day t½),
// we track cumulative system exhaustion from prolonged dual coverage.
// Each day of over-activation (Prozac SERT while Trintellix active) adds
// fatigue debt that decays slowly and manifests as reduced wellbeing.

// FATIGUE_DECAY and FATIGUE_WEIGHT imported from pkEngine (shared with genTimeline)

const N = 75;
function gen(doseFn) {
  const data = [];
  let fatigue = 0;
  for (let i = 0; i <= N; i++) {
    const result = computeAll(i, doseFn);
    // stressScore = instantaneous over-activation from pkEngine
    fatigue = fatigue * FATIGUE_DECAY + result.stressScore;
    const fatiguePenalty = fatigue * FATIGUE_WEIGHT;
    const adjusted = Math.max(0, Math.min(100, result.wellbeing - fatiguePenalty));
    data.push({ ...result, wellbeing: adjusted, stressScore: result.stressScore + fatiguePenalty, day: i });
  }
  return data;
}

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

  // Compute TODAY_N lazily so it's fresh if app stays open overnight
  const todayN = useMemo(() => getTodayN(), []);

  const doseBridge10 = useMemo(() => makeBridgeDose(todayN, 10), [todayN]);
  const doseBridge14 = useMemo(() => makeBridgeDose(todayN, 14), [todayN]);
  const doseTaper    = useMemo(() => makeTaperDose(todayN), [todayN]);

  const tl      = useMemo(() => gen(doseActual), []);
  const tlGrad  = useMemo(() => gen(doseGradual), []);
  const tlB10   = useMemo(() => gen(doseBridge10), [doseBridge10]);
  const tlB14   = useMemo(() => gen(doseBridge14), [doseBridge14]);
  const tlTaper = useMemo(() => gen(doseTaper), [doseTaper]);

  const data = useMemo(() => tl.map((d, i) => ({
    ...d,
    gradWB: tlGrad[i]?.wellbeing ?? null,
    b10WB: i >= todayN ? (tlB10[i]?.wellbeing ?? null) : null,
    b14WB: i >= todayN ? (tlB14[i]?.wellbeing ?? null) : null,
    taperWB: i >= todayN ? (tlTaper[i]?.wellbeing ?? null) : null,
  })), [tl, tlGrad, tlB10, tlB14, tlTaper, todayN]);

  const todayD = data.find(d => d.day === todayN);
  const minA = tl.reduce((m, d) => d.wellbeing < m.wellbeing ? d : m, tl[0]);

  // Compute peak fatigue (max stressScore) for each bridge after todayN
  const peakStress = (timeline, start) => {
    const relevant = timeline.filter(d => d.day >= start);
    return relevant.reduce((max, d) => d.stressScore > max ? d.stressScore : max, 0);
  };
  const peak10 = peakStress(tlB10, todayN);
  const peak14 = peakStress(tlB14, todayN);
  const peakTp = peakStress(tlTaper, todayN);

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
        <Btn on={show.taper} onClick={() => tog("taper")} color="#0891b2" bg="#f0f9ff">{"\u{1F48A}"} P20+alt days</Btn>
        <Btn on={show.pk} onClick={() => tog("pk")} color="#06b6d4" bg="#ecfeff">PK</Btn>
        <Btn on={show.pd} onClick={() => tog("pd")} color="#a78bfa" bg="#f5f3ff">PD</Btn>
        <Btn on={show.st} onClick={() => tog("st")} color="#ef4444" bg="#fef2f2">Over-act</Btn>
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
          <ReferenceLine x={todayN} stroke="#ef4444b0" strokeDasharray="3 3" label={{ value: "Today", fill: "#ef4444", fontSize: 8, position: "top" }} />
          {show.grad && <ReferenceLine x={21} stroke="#8b5cf640" strokeDasharray="3 3" label={{ value: "Grad off", fill: "#8b5cf660", fontSize: 7, position: "top" }} />}
          {show.b10 && <ReferenceLine x={todayN + 10} stroke="#f59e0b40" strokeDasharray="3 3" label={{ value: "10d end", fill: "#d9770680", fontSize: 7, position: "top" }} />}
          {show.b14 && <ReferenceLine x={todayN + 14} stroke="#e11d4840" strokeDasharray="3 3" label={{ value: "14d end", fill: "#e11d4880", fontSize: 7, position: "top" }} />}
          {show.taper && (
            <>
              <ReferenceLine x={todayN + 7} stroke="#0891b240" strokeDasharray="3 3" label={{ value: "\u2192alt", fill: "#0891b280", fontSize: 7, position: "top" }} />
              <ReferenceLine x={todayN + 15} stroke="#0891b230" strokeDasharray="3 3" label={{ value: "P off", fill: "#0891b260", fontSize: 7, position: "top" }} />
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
          {show.b10 && <Line type="monotone" dataKey="b10WB" stroke="#d97706" strokeWidth={2} dot={false} strokeDasharray="6 3" name={"P20\u00d710d"} connectNulls={false} />}
          {show.b14 && <Line type="monotone" dataKey="b14WB" stroke="#e11d48" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name={"P20\u00d714d"} connectNulls={false} />}
          {show.taper && <Line type="monotone" dataKey="taperWB" stroke="#0891b2" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="P20+alt days" connectNulls={false} />}
          {show.pk && <Line type="monotone" dataKey="pkScore" stroke="#06b6d4" strokeWidth={1} dot={false} strokeDasharray="4 3" name="PK Ceiling" />}
          {show.pd && <Line type="monotone" dataKey="pdScore" stroke="#a78bfa" strokeWidth={1} dot={false} strokeDasharray="4 3" name="PD Maturation" />}
          {show.st && <Line type="monotone" dataKey="stressScore" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Over-activation" />}

          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Strategy cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 12 }}>
        {[
          { label: "ACTUAL", sub: "Fast taper", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0",
            val: todayD?.wellbeing, vl: "now", note: `Dip ${minA.wellbeing.toFixed(1)}`, nc: "#ef4444", on: true },
          { label: "P20\u00d710d", sub: "10 doses", color: "#d97706", bg: "#fffbeb", border: "#fde68a",
            val: tlB10.find(d => d.day === todayN + 5)?.wellbeing, vl: "mid", note: `Load ${peak10.toFixed(1)}`, nc: "#d97706", on: show.b10 },
          { label: "P20\u00d714d", sub: "14 doses", color: "#e11d48", bg: "#fff1f2", border: "#fecdd3",
            val: tlB14.find(d => d.day === todayN + 7)?.wellbeing, vl: "mid", note: `Load ${peak14.toFixed(1)}`, nc: "#e11d48", on: show.b14 },
          { label: "P20+ALT", sub: "7d+8d taper", color: "#0891b2", bg: "#f0f9ff", border: "#a5f3fc",
            val: tlTaper.find(d => d.day === todayN + 5)?.wellbeing, vl: "mid", note: `Load ${peakTp.toFixed(1)}`, nc: "#0891b2", on: show.taper },
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
          <b>מודל Over-Activation</b> — הענישה מבוססת על עומס סרוטונינרגי כפול (Prozac SERT בזמן שטרינטלקס פעיל), לא על "גמילה" שרירותית. פרוזק עם t½≈9d של נורפלואוקסטין כמעט לא יוצר תסמונת גמילה — הבעיה היא העומס היתר בזמן החפיפה.
          <br /><br />
          <b>P20×14d</b> — 14 ימים של כיסוי כפול → הצטברות עייפות מערכתית מקסימלית. המערכת "עובדת שעות נוספות" הכי הרבה זמן.
          <br /><br />
          <b>P20×10d</b> — פחות ימי חפיפה → פחות עייפות מצטברת. מתאושש מהר יותר.
          <br /><br />
          <b>P20 + alt days</b> — ימי ההפסקה נותנים למערכת "לנשום" בין מנות, אבל עם נורפלואוקסטין (t½≈9d), הרמות בדם בקושי יורדות ביום חופש. ההבדל מ-daily מתון.
          <br /><br />
          <b>כלל אצבע:</b> ככל שפחות ימי חפיפה → פחות עייפות מצטברת → התאוששות מהירה יותר. עבור פרוזק ספציפית, ההבדלים מתונים יחסית בגלל זמן מחצית החיים הארוך.
        </div>
      </div>

      {/* Honest assessment */}
      <div style={{ margin: "12px 0 0", padding: "16px 18px", borderRadius: 12, background: "linear-gradient(135deg, #ecfdf5, #f0f9ff)", border: "2px solid #6ee7b7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>{"\u{1F9EC}"}</span>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#065f46" }}>הערכה כנה: פרוזק = גמילה מינימלית</div>
        </div>
        <div style={{ fontSize: 13, color: "#164e63", lineHeight: 1.8, direction: "rtl", textAlign: "right" }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px", marginBottom: 10 }}>
            <span>{"\u{1F4CA}"}</span><span><b>מה המודל מראה:</b> ההבדלים בין האסטרטגיות מתונים — זה לא באג, זה פיצ'ר. נורפלואוקסטין (t½≈9d) מהווה taper טבעי מובנה.</span>
            <span>{"\u26A0\uFE0F"}</span><span><b>הסיכון האמיתי:</b> לא גמילה, אלא over-activation בזמן חפיפה. עצבנות, נדודי שינה, סף תסכול נמוך — כל אלה מעומס יתר, לא מחוסר.</span>
            <span>{"\u{1F4A1}"}</span><span><b>המסקנה:</b> פחות ימי חפיפה = פחות עומס מערכתי. P20×10d מספק כיסוי PD מספיק עם פחות עייפות מצטברת מ-14d.</span>
            <span>{"\u{1F48A}"}</span><span><b>alt days:</b> יתרון תיאורטי מוגבל עבור פרוזק ספציפית — ימי ההפסקה בקושי מורידים את הרמות בדם בגלל t½ ארוך.</span>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa", fontSize: 12, color: "#92400e", marginTop: 6 }}>
            {"\u26A0\uFE0F"} <b>חשוב:</b> זו המלצה מבוססת מודל PK/PD תיאורטי. יש לדון עם הפסיכיאטר לפני תחילת כל גישור. ההחלטה הסופית צריכה לשלב שיקול קליני ואת התחושות שלך.
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 9, color: "#94a3b8", padding: "10px 0 0" }}>{"\u26A0"} Over-activation model · Based on Prozac SERT contribution during overlap · Not validated clinical data</div>
    </div>
  );
}

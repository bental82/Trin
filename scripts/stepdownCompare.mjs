/**
 * Compare flat alt 14d vs step-down taper (8d alt + 6d every-3rd-day)
 * Both start with 7d daily P20 after BRIDGE_START
 */

const LN2 = Math.log(2);
const FLUOX_HALFLIFE = 48, NORFLUOX_HALFLIFE = 223, NORFLUOX_CONV = 0.8;
const FLUOX_EC50 = 5, FLUOX_EMAX = 83, VORT_HALFLIFE = 66, VORT_EC50 = 5, VORT_EMAX = 100;
const WELLBUTRIN_CYP_FACTOR = 2.2;
const PROZAC_SS_FLUOX = 40 / (1 - Math.pow(0.5, 24 / FLUOX_HALFLIFE));
const PROZAC_SS_NORFLUOX = 40 * NORFLUOX_CONV / (1 - Math.pow(0.5, 24 / NORFLUOX_HALFLIFE));
const REC = {
  "5-HT3": { ef: 2.3, em: 95 }, "5-HT1A": { ef: 9.4, em: 85 },
  "5-HT7": { ef: 11.9, em: 90 }, "5-HT1B": { ef: 20.6, em: 80 }, "5-HT1D": { ef: 33.7, em: 75 },
};

const BRIDGE_START = 22, DAILY_PHASE = 7;

// ── Dose strategies ──

// Strategy A: Flat alt 14d (current winner)
// 7d daily → 14d every other day
function doseFlat14(d) {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < BRIDGE_START) return [10, 0];
  if (d >= BRIDGE_START && d < BRIDGE_START + DAILY_PHASE) return [10, 20];
  const bd = d - BRIDGE_START;
  if (bd >= 7 && bd < 21) return [10, ((bd - 7) % 2 === 0) ? 20 : 0];
  return [10, 0];
}

// Strategy B: Step-down (8d alt + 6d every 3rd day)
// 7d daily → 8d every other day → 6d every 3rd day
function doseStepdown(d) {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < BRIDGE_START) return [10, 0];
  if (d >= BRIDGE_START && d < BRIDGE_START + DAILY_PHASE) return [10, 20]; // 7d daily
  const bd = d - BRIDGE_START;
  if (bd >= 7 && bd < 15) return [10, ((bd - 7) % 2 === 0) ? 20 : 0];    // 8d every other day
  if (bd >= 15 && bd < 21) return [10, ((bd - 15) % 3 === 0) ? 20 : 0];   // 6d every 3rd day
  return [10, 0];
}

// Strategy C: Step-down extended (10d alt + 8d every 3rd day)
function doseStepdownExt(d) {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < BRIDGE_START) return [10, 0];
  if (d >= BRIDGE_START && d < BRIDGE_START + DAILY_PHASE) return [10, 20];
  const bd = d - BRIDGE_START;
  if (bd >= 7 && bd < 17) return [10, ((bd - 7) % 2 === 0) ? 20 : 0];    // 10d every other day
  if (bd >= 17 && bd < 25) return [10, ((bd - 17) % 3 === 0) ? 20 : 0];   // 8d every 3rd day
  return [10, 0];
}

// ── PK engine ──
function fluoxEquivAt(h, doseFn) {
  let level = PROZAC_SS_FLUOX * Math.exp(-LN2 * h / FLUOX_HALFLIFE);
  for (let d = 0; d <= Math.floor(h / 24); d++) {
    const [, p] = doseFn(d);
    if (p > 0 && h > d * 24) level += p * Math.exp(-LN2 * (h - d * 24) / FLUOX_HALFLIFE);
  }
  return (level / PROZAC_SS_FLUOX) * 40;
}

function pkCalc(day, doseFn) {
  const h = day * 24, maxDay = Math.floor(day);
  let fluoxLevel = PROZAC_SS_FLUOX * Math.exp(-LN2 * Math.max(0, h) / FLUOX_HALFLIFE);
  let norfluoxLevel = PROZAC_SS_NORFLUOX * Math.exp(-LN2 * Math.max(0, h) / NORFLUOX_HALFLIFE);
  for (let d = 0; d <= maxDay; d++) {
    const [, p] = doseFn(d);
    if (p > 0 && h > d * 24) {
      const el = h - d * 24;
      fluoxLevel += p * Math.exp(-LN2 * el / FLUOX_HALFLIFE);
      norfluoxLevel += p * NORFLUOX_CONV * Math.exp(-LN2 * el / NORFLUOX_HALFLIFE);
    }
  }
  const fE = Math.max(0, (fluoxLevel / PROZAC_SS_FLUOX) * 40);
  const cypB = Math.min(2.8, WELLBUTRIN_CYP_FACTOR + Math.min(1, fE / 40) * 0.4);
  let vL = 0;
  for (let d = 0; d <= maxDay; d++) {
    const [v] = doseFn(d);
    if (v > 0 && h > d * 24) {
      const el = h - d * 24;
      const dtF = fluoxEquivAt(d * 24, doseFn);
      const dtC = Math.min(2.8, WELLBUTRIN_CYP_FACTOR + Math.min(1, dtF / 40) * 0.4);
      vL += v * dtC * Math.exp(-LN2 * el / (VORT_HALFLIFE * Math.pow(dtC, 0.4)));
    }
  }
  const vE = Math.max(0, vL);
  const sV = VORT_EMAX * vE / (VORT_EC50 + vE);
  const sF = FLUOX_EMAX * fE / (FLUOX_EC50 + fE);
  const cS = Math.min(98, 100 * (1 - (1 - sV / 100) * (1 - sF / 100)));
  return { day, fE, nfE: norfluoxLevel, vE, cyp: cypB, sV, sF, cS };
}

function sigmoid(day, t50, k, emax = 100, lag = 0) {
  return emax / (1 + Math.exp(-k * (Math.max(0, day - lag) - t50)));
}

function computePD(day) {
  return {
    autorecept: sigmoid(day, 18, 0.18, 100, 2), gabaDisinhib: sigmoid(day, 12, 0.22, 100, 1),
    circadian: sigmoid(day, 16, 0.15, 100, 3), bdnf: sigmoid(day, 32, 0.1, 100, 7),
    glymphatic: sigmoid(day, 45, 0.08, 100, 14), dmn: sigmoid(day, 35, 0.09, 100, 10),
    norfluoxStress: Math.max(0, 8 * Math.exp(-0.5 * ((day - 24) / 10) ** 2)) * (1 / (1 + Math.exp(-1.2 * (day - 12)))),
    cypStress: Math.max(0, 5 * Math.exp(-0.5 * ((day - 30) / 12) ** 2)) * (1 / (1 + Math.exp(-1.2 * (day - 14)))),
  };
}

function computePkRaw(pk) {
  return pk.sV * 0.25 + 95 * pk.vE / (VORT_EC50 * 2.3 + pk.vE) * 0.20
    + 85 * pk.vE / (VORT_EC50 * 9.4 + pk.vE) * 0.15 + 90 * pk.vE / (VORT_EC50 * 11.9 + pk.vE) * 0.10
    + 80 * pk.vE / (VORT_EC50 * 20.6 + pk.vE) * 0.05 + Math.min(100, pk.vE * 5) * 0.05;
}

function computeAll(day, doseFn) {
  const pk = pkCalc(day, doseFn), pd = computePD(day);
  const ssMax = computePkRaw(pkCalc(200, doseFn));
  const pkScore = Math.min(100, (computePkRaw(pk) / Math.max(ssMax, 1)) * 100);
  const pdScore = pd.autorecept * 0.25 + pd.gabaDisinhib * 0.20 + pd.circadian * 0.10 + pd.bdnf * 0.20 + pd.glymphatic * 0.10 + pd.dmn * 0.15;
  const stress = (pd.norfluoxStress || 0) + (pd.cypStress || 0);
  const wb = Math.max(0, Math.min(100, 60 + (pkScore / 100) * (pdScore / 100) * 18 - stress));
  return { ...pk, pkScore, pdScore, stressScore: stress, wellbeing: wb, day };
}

// ── Analyze a strategy ──
function analyze(name, doseFn) {
  const N = 90;

  // Count doses and build schedule display
  let p20Doses = 0, schedule = [];
  for (let d = BRIDGE_START; d <= BRIDGE_START + 30; d++) {
    const [, p] = doseFn(d);
    if (p > 0) p20Doses++;
  }

  // Find bridge end (last day with P20)
  let bridgeEnd = BRIDGE_START;
  for (let d = BRIDGE_START; d <= BRIDGE_START + 40; d++) {
    const [, p] = doseFn(d);
    if (p > 0) bridgeEnd = d;
  }

  // Post-bridge analysis
  let minWB = Infinity, minDay = 0;
  const wbTimeline = [];
  for (let d = 0; d <= N; d++) {
    const r = computeAll(d, doseFn);
    const pk = pkCalc(d, doseFn);
    wbTimeline.push({ day: d, wb: r.wellbeing, fE: pk.fE, sF: pk.sF, cS: pk.cS, nfE: pk.nfE });
    if (d >= BRIDGE_START && r.wellbeing < minWB) { minWB = r.wellbeing; minDay = d; }
  }

  // fE decay profile at key points
  const fE_end = pkCalc(bridgeEnd, doseFn).fE;
  const fE_end5 = pkCalc(bridgeEnd + 5, doseFn).fE;
  const fE_end10 = pkCalc(bridgeEnd + 10, doseFn).fE;
  const nfE_end = pkCalc(bridgeEnd, doseFn).nfE;

  // SERT from fluoxetine at key points
  const sF_end = pkCalc(bridgeEnd, doseFn).sF;
  const sF_end5 = pkCalc(bridgeEnd + 5, doseFn).sF;
  const sF_end10 = pkCalc(bridgeEnd + 10, doseFn).sF;

  return { name, p20Doses, bridgeEnd, minWB, minDay, fE_end, fE_end5, fE_end10, nfE_end, sF_end, sF_end5, sF_end10, wbTimeline };
}

// ── Run comparisons ──
const strategies = [
  { name: "Flat alt 14d     (7d daily → 14d q2d)", fn: doseFlat14 },
  { name: "Step-down        (7d daily → 8d q2d → 6d q3d)", fn: doseStepdown },
  { name: "Step-down ext    (7d daily → 10d q2d → 8d q3d)", fn: doseStepdownExt },
];

console.log("═══════════════════════════════════════════════════════════════════════════════════");
console.log("  FLAT ALT 14d vs STEP-DOWN TAPER COMPARISON");
console.log("═══════════════════════════════════════════════════════════════════════════════════\n");

const results = strategies.map(s => analyze(s.name, s.fn));

for (const r of results) {
  console.log(`  ┌─ ${r.name}`);
  console.log(`  │  P20 doses: ${r.p20Doses}  │  Bridge ends: D${r.bridgeEnd + 1}  │  Total coverage: ${r.bridgeEnd - BRIDGE_START + 1}d`);
  console.log(`  │  Min WB: ${r.minWB.toFixed(2)} (D${r.minDay + 1})`);
  console.log(`  │  fE at end: ${r.fE_end.toFixed(1)}mg → ${r.fE_end5.toFixed(1)}mg (+5d) → ${r.fE_end10.toFixed(1)}mg (+10d)`);
  console.log(`  │  norfluox at end: ${r.nfE_end.toFixed(1)}`);
  console.log(`  │  SERT(fluox): ${r.sF_end.toFixed(1)}% → ${r.sF_end5.toFixed(1)}% (+5d) → ${r.sF_end10.toFixed(1)}% (+10d)`);
  console.log(`  └──────────────────────────────────────────\n`);
}

// ── Dose schedule comparison ──
console.log("═══════════════════════════════════════════════════════════════════════════════════");
console.log("  DAILY DOSE SCHEDULE (P20 mg) — Bridge period");
console.log("═══════════════════════════════════════════════════════════════════════════════════\n");

console.log("  Day │ " + strategies.map(s => s.name.split("(")[0].trim().padEnd(18)).join("│ "));
console.log("  ────┼" + strategies.map(() => "──────────────────").join("┼"));

for (let d = BRIDGE_START; d <= BRIDGE_START + 27; d++) {
  const bd = d - BRIDGE_START;
  const vals = strategies.map(s => {
    const [, p] = s.fn(d);
    const label = p > 0 ? `  ${p}mg ●` : "   —  ○";
    return label.padEnd(18);
  });
  const phase = bd < 7 ? "daily" : bd < 15 ? "q2d" : bd < 21 ? "q3d/q2d" : "off";
  console.log(`  D${String(d + 1).padStart(3)} │ ${vals.join("│ ")}│ ${phase}`);
}

// ── Wellbeing trajectory comparison (post-bridge) ──
console.log("\n═══════════════════════════════════════════════════════════════════════════════════");
console.log("  WELLBEING TRAJECTORY — Post-bridge (every 2 days)");
console.log("═══════════════════════════════════════════════════════════════════════════════════\n");

console.log("  Day │ " + results.map(r => r.name.split("(")[0].trim().padEnd(14)).join("│ "));
console.log("  ────┼" + results.map(() => "──────────────").join("┼"));

for (let d = BRIDGE_START; d <= 70; d += 2) {
  const vals = results.map(r => {
    const entry = r.wbTimeline.find(e => e.day === d);
    return entry ? entry.wb.toFixed(2).padStart(12) + "  " : "     —      ";
  });
  console.log(`  D${String(d + 1).padStart(3)} │ ${vals.join("│ ")}`);
}

// ── fE decay comparison ──
console.log("\n═══════════════════════════════════════════════════════════════════════════════════");
console.log("  FLUOXETINE EQUIVALENT DECAY — Post-bridge");
console.log("═══════════════════════════════════════════════════════════════════════════════════\n");

console.log("  Day │ " + results.map(r => r.name.split("(")[0].trim().padEnd(14)).join("│ "));
console.log("  ────┼" + results.map(() => "──────────────").join("┼"));

for (let d = BRIDGE_START; d <= 65; d += 2) {
  const vals = results.map(r => {
    const entry = r.wbTimeline.find(e => e.day === d);
    return entry ? (entry.fE.toFixed(1) + "mg").padStart(12) + "  " : "     —      ";
  });
  console.log(`  D${String(d + 1).padStart(3)} │ ${vals.join("│ ")}`);
}

// ── Verdict ──
console.log("\n═══════════════════════════════════════════════════════════════════════════════════");
console.log("  VERDICT");
console.log("═══════════════════════════════════════════════════════════════════════════════════\n");

const flat = results[0], step = results[1], stepExt = results[2];
console.log(`  Flat alt 14d:      min WB ${flat.minWB.toFixed(2)}, ${flat.p20Doses} doses, ${flat.bridgeEnd - BRIDGE_START + 1}d coverage`);
console.log(`  Step-down:         min WB ${step.minWB.toFixed(2)}, ${step.p20Doses} doses, ${step.bridgeEnd - BRIDGE_START + 1}d coverage`);
console.log(`  Step-down ext:     min WB ${stepExt.minWB.toFixed(2)}, ${stepExt.p20Doses} doses, ${stepExt.bridgeEnd - BRIDGE_START + 1}d coverage`);
console.log();

const wbDiff = step.minWB - flat.minWB;
const doseDiff = step.p20Doses - flat.p20Doses;
console.log(`  Step-down vs flat 14d: ${wbDiff >= 0 ? "+" : ""}${wbDiff.toFixed(2)} WB, ${doseDiff >= 0 ? "+" : ""}${doseDiff} doses`);
const wbDiffExt = stepExt.minWB - flat.minWB;
const doseDiffExt = stepExt.p20Doses - flat.p20Doses;
console.log(`  Step-down ext vs flat: ${wbDiffExt >= 0 ? "+" : ""}${wbDiffExt.toFixed(2)} WB, ${doseDiffExt >= 0 ? "+" : ""}${doseDiffExt} doses`);

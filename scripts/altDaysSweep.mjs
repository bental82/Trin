/**
 * Alt-days sweep v2: Focus on POST-BRIDGE discontinuation dip
 * The key differentiator between strategies is what happens AFTER Prozac stops.
 *
 * For each alt-day duration (6d to 20d):
 * 1. Compute full PK/PD timeline including norfluoxetine decay
 * 2. Measure the post-bridge wellbeing trajectory
 * 3. Track fluoxetine-equivalent levels at bridge end
 * 4. Quantify the discontinuation dip severity
 */

const LN2 = Math.log(2);

// ── PK Constants ──
const FLUOX_HALFLIFE     = 48;
const NORFLUOX_HALFLIFE  = 223;
const NORFLUOX_CONV      = 0.8;
const FLUOX_EC50         = 5;
const FLUOX_EMAX         = 83;
const VORT_HALFLIFE      = 66;
const VORT_EC50          = 5;
const VORT_EMAX          = 100;
const WELLBUTRIN_CYP_FACTOR = 2.2;
const PROZAC_SS_FLUOX    = 40 / (1 - Math.pow(0.5, 24 / FLUOX_HALFLIFE));
const PROZAC_SS_NORFLUOX = 40 * NORFLUOX_CONV / (1 - Math.pow(0.5, 24 / NORFLUOX_HALFLIFE));

const REC = {
  "5-HT3":  { ef: 2.3,  em: 95 },
  "5-HT1A": { ef: 9.4,  em: 85 },
  "5-HT7":  { ef: 11.9, em: 90 },
  "5-HT1B": { ef: 20.6, em: 80 },
  "5-HT1D": { ef: 33.7, em: 75 },
};

const BRIDGE_START = 22;
const DAILY_PHASE = 7;

function makeAltDose(altDays) {
  return d => {
    if (d < 0) return [0, 40];
    if (d === 0) return [5, 20];
    if (d <= 7) return [10, 20];
    if (d < BRIDGE_START) return [10, 0];
    if (d >= BRIDGE_START && d < BRIDGE_START + DAILY_PHASE) return [10, 20];
    const bd = d - BRIDGE_START;
    if (bd >= DAILY_PHASE && bd < DAILY_PHASE + altDays) return [10, ((bd - DAILY_PHASE) % 2 === 0) ? 20 : 0];
    return [10, 0];
  };
}

function fluoxEquivAt(h, doseFn) {
  let level = PROZAC_SS_FLUOX * Math.exp(-LN2 * h / FLUOX_HALFLIFE);
  for (let d = 0; d <= Math.floor(h / 24); d++) {
    const [, prozacDose] = doseFn(d);
    if (prozacDose > 0 && h > d * 24) {
      level += prozacDose * Math.exp(-LN2 * (h - d * 24) / FLUOX_HALFLIFE);
    }
  }
  return (level / PROZAC_SS_FLUOX) * 40;
}

function pkCalc(day, doseFn) {
  const h = day * 24;
  const maxDay = Math.floor(day);
  let fluoxLevel    = PROZAC_SS_FLUOX * Math.exp(-LN2 * Math.max(0, h) / FLUOX_HALFLIFE);
  let norfluoxLevel = PROZAC_SS_NORFLUOX * Math.exp(-LN2 * Math.max(0, h) / NORFLUOX_HALFLIFE);
  for (let d = 0; d <= maxDay; d++) {
    const [, prozacDose] = doseFn(d);
    if (prozacDose > 0 && h > d * 24) {
      const elapsed = h - d * 24;
      fluoxLevel    += prozacDose * Math.exp(-LN2 * elapsed / FLUOX_HALFLIFE);
      norfluoxLevel += prozacDose * NORFLUOX_CONV * Math.exp(-LN2 * elapsed / NORFLUOX_HALFLIFE);
    }
  }
  const fluoxEquiv = Math.max(0, (fluoxLevel / PROZAC_SS_FLUOX) * 40);
  const prozacCypContrib = Math.min(1.0, (fluoxEquiv / 40) * 1.0);
  const totalCypBoost    = Math.min(2.8, WELLBUTRIN_CYP_FACTOR + prozacCypContrib * 0.4);
  let vortLevel = 0;
  for (let d = 0; d <= maxDay; d++) {
    const [vortDose] = doseFn(d);
    if (vortDose > 0 && h > d * 24) {
      const elapsed = h - d * 24;
      const doseTimeFluox = fluoxEquivAt(d * 24, doseFn);
      const doseTimeCyp   = Math.min(2.8, WELLBUTRIN_CYP_FACTOR + Math.min(1.0, (doseTimeFluox / 40) * 1.0) * 0.4);
      vortLevel += vortDose * doseTimeCyp * Math.exp(-LN2 * elapsed / (VORT_HALFLIFE * Math.pow(doseTimeCyp, 0.4)));
    }
  }
  const vortEffective = Math.max(0, vortLevel);
  const sertFromVort  = VORT_EMAX * vortEffective / (VORT_EC50 + vortEffective);
  const sertFromFluox = FLUOX_EMAX * fluoxEquiv / (FLUOX_EC50 + fluoxEquiv);
  const combinedSert  = Math.min(98, 100 * (1 - (1 - sertFromVort / 100) * (1 - sertFromFluox / 100)));
  return { day, fE: fluoxEquiv, nfE: norfluoxLevel, vE: vortEffective, cyp: totalCypBoost, sV: sertFromVort, sF: sertFromFluox, cS: combinedSert };
}

function sigmoid(day, t50, k, emax = 100, lag = 0) {
  const t = Math.max(0, day - lag);
  return emax / (1 + Math.exp(-k * (t - t50)));
}

function computePD(day) {
  return {
    autorecept:     sigmoid(day, 18, 0.18, 100, 2),
    gabaDisinhib:   sigmoid(day, 12, 0.22, 100, 1),
    circadian:      sigmoid(day, 16, 0.15, 100, 3),
    bdnf:           sigmoid(day, 32, 0.1,  100, 7),
    glymphatic:     sigmoid(day, 45, 0.08, 100, 14),
    dmn:            sigmoid(day, 35, 0.09, 100, 10),
    norfluoxStress: Math.max(0, 8 * Math.exp(-0.5 * Math.pow((day - 24) / 10, 2))) * (1 / (1 + Math.exp(-1.2 * (day - 12)))),
    cypStress:      Math.max(0, 5 * Math.exp(-0.5 * Math.pow((day - 30) / 12, 2))) * (1 / (1 + Math.exp(-1.2 * (day - 14)))),
  };
}

function computePkRaw(pk) {
  return pk.sV * 0.25 + 0.20 * 95 * pk.vE / (VORT_EC50 * 2.3 + pk.vE) + 0.15 * 85 * pk.vE / (VORT_EC50 * 9.4 + pk.vE) + 0.10 * 90 * pk.vE / (VORT_EC50 * 11.9 + pk.vE) + 0.05 * 80 * pk.vE / (VORT_EC50 * 20.6 + pk.vE) + Math.min(100, pk.vE * 5) * 0.05;
}

function computeAll(day, doseFn) {
  const pk = pkCalc(day, doseFn);
  const pd = computePD(day);
  const ssMax = computePkRaw(pkCalc(200, doseFn));
  const pkScore = Math.min(100, (computePkRaw(pk) / Math.max(ssMax, 1)) * 100);
  const pdScore = pd.autorecept * 0.25 + pd.gabaDisinhib * 0.20 + pd.circadian * 0.10 + pd.bdnf * 0.20 + pd.glymphatic * 0.10 + pd.dmn * 0.15;
  const stress = (pd.norfluoxStress || 0) + (pd.cypStress || 0);
  const prozacBaseline = 60;
  const trinGain = (pkScore / 100) * (pdScore / 100) * 18;
  const wellbeing = Math.max(0, Math.min(100, prozacBaseline + trinGain - stress));
  return { ...pk, pkScore, pdScore, stressScore: stress, wellbeing, day };
}

// ══════════════════════════════════════════════════════════
// POST-BRIDGE ANALYSIS
// The key question: after Prozac stops, how do the metrics differ?
// ══════════════════════════════════════════════════════════

const N = 90;

console.log("═══════════════════════════════════════════════════════════════════════════════════════════════════");
console.log("  P20+alt Nd SWEEP v2 — Post-Bridge Pharmacokinetic Analysis");
console.log("  Bridge: D23 start → 7d daily P20, then Nd alternating P20, then T10 only");
console.log("═══════════════════════════════════════════════════════════════════════════════════════════════════\n");

const results = [];

for (let altDays = 6; altDays <= 20; altDays++) {
  const doseFn = makeAltDose(altDays);
  const bridgeEnd = BRIDGE_START + DAILY_PHASE + altDays; // day when last P20 could be given

  // Count P20 doses during bridge only (not pre-switch)
  let p20BridgeDoses = 0;
  for (let d = BRIDGE_START; d <= BRIDGE_START + DAILY_PHASE + altDays; d++) {
    const [, p] = doseFn(d);
    if (p > 0) p20BridgeDoses++;
  }

  const totalCoverage = DAILY_PHASE + altDays;

  // Track key PK values at and after bridge end
  const pkAtEnd = pkCalc(bridgeEnd, doseFn);
  const fE_atEnd = pkAtEnd.fE;
  const nfE_atEnd = pkAtEnd.nfE;
  const sert_atEnd = pkAtEnd.cS;

  // Track post-bridge SERT occupancy drop
  // Find when fluoxetine SERT contribution drops below 5% (effective washout)
  let sertWashoutDay = null;
  let minPostBridgeSert = Infinity;
  let minSertDay = bridgeEnd;

  // Track post-bridge wellbeing trajectory
  let minPostBridgeWB = Infinity;
  let minWBDay = bridgeEnd;
  let postBridgeAUCLoss = 0;

  // Track fluoxetine-equivalent decay
  let fE_halfDay = null; // day when fE drops to half of end value
  let fE_10pctDay = null; // day when fE drops below 10% of end value

  // Track SERT coverage from fluoxetine
  let sertFluoxBelow10Day = null;

  // Post-bridge trajectory (from bridge end to day 90)
  const postData = [];
  for (let d = bridgeEnd; d <= N; d++) {
    const result = computeAll(d, doseFn);
    const pk = pkCalc(d, doseFn);
    postData.push({ day: d, wb: result.wellbeing, fE: pk.fE, sF: pk.sF, cS: pk.cS, stress: result.stressScore });

    if (result.wellbeing < minPostBridgeWB) {
      minPostBridgeWB = result.wellbeing;
      minWBDay = d;
    }
    if (pk.cS < minPostBridgeSert) {
      minPostBridgeSert = pk.cS;
      minSertDay = d;
    }
    if (d > bridgeEnd) {
      const deficit = Math.max(0, 60 - result.wellbeing);
      postBridgeAUCLoss += deficit;
    }
    if (!fE_halfDay && pk.fE <= fE_atEnd / 2) fE_halfDay = d;
    if (!fE_10pctDay && pk.fE <= fE_atEnd * 0.1) fE_10pctDay = d;
    if (!sertFluoxBelow10Day && pk.sF < 10) sertFluoxBelow10Day = d;
  }

  // SERT drop rate: how fast does combined SERT occupancy fall in first 7 days post-bridge
  const sert7dPost = pkCalc(bridgeEnd + 7, doseFn).cS;
  const sertDropRate = (sert_atEnd - sert7dPost) / 7; // %/day

  // Norfluoxetine cushion: residual norfluoxetine provides a "buffer"
  // Higher nfE at bridge end = softer landing

  // Composite score v2:
  // Prioritize: high min post-bridge WB, low SERT drop rate, high norfluoxetine cushion
  // Penalize: total doses, excessive duration
  const score = (
    minPostBridgeWB * 3.0          // wellbeing floor (higher = better)
    - sertDropRate * 15            // SERT stability (lower drop = better)
    - postBridgeAUCLoss * 0.08     // cumulative deficit (lower = better)
    + Math.log(nfE_atEnd + 1) * 2  // norfluoxetine cushion (log scale, higher = better)
    - p20BridgeDoses * 0.5         // dose burden (fewer = better)
    - Math.max(0, altDays - 14) * 1.0  // excessive duration penalty
  );

  results.push({
    altDays, totalCoverage, p20BridgeDoses, bridgeEnd,
    fE_atEnd, nfE_atEnd, sert_atEnd, sert7dPost, sertDropRate,
    minPostBridgeWB, minWBDay, postBridgeAUCLoss,
    fE_halfDay, fE_10pctDay, sertFluoxBelow10Day,
    score
  });
}

// Sort by score
results.sort((a, b) => b.score - a.score);

console.log("┌──────┬──────────┬───────┬────────────────────────────────────────┬────────────────────────────────┬───────────┐");
console.log("│ Alt  │ Coverage │ P20   │ PK at Bridge End                       │ Post-Bridge Wellbeing          │ Composite │");
console.log("│ Days │ (total)  │ Doses │ fE(mg) │ nfE    │ SERT% │ SERT drop/d │ Min WB │ Dip Day │ AUC Loss  │ Score     │");
console.log("├──────┼──────────┼───────┼────────┼────────┼───────┼─────────────┼────────┼─────────┼───────────┼───────────┤");

for (const r of results) {
  const best = r === results[0] ? " ★" : "";
  console.log(
    `│ ${String(r.altDays).padStart(3)}d │ ${String(r.totalCoverage).padStart(5)}d   │ ${String(r.p20BridgeDoses).padStart(3)}   │ ${r.fE_atEnd.toFixed(1).padStart(5)}  │ ${r.nfE_atEnd.toFixed(1).padStart(5)}  │ ${r.sert_atEnd.toFixed(1).padStart(4)}  │ ${r.sertDropRate.toFixed(3).padStart(6)}      │ ${r.minPostBridgeWB.toFixed(2).padStart(5)}  │ D${String(r.minWBDay + 1).padStart(3)}    │ ${r.postBridgeAUCLoss.toFixed(1).padStart(7)}   │ ${r.score.toFixed(2).padStart(8)}${best} │`
  );
}

console.log("└──────┴──────────┴───────┴────────┴────────┴───────┴─────────────┴────────┴─────────┴───────────┴───────────┘");

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("  TOP 5 STRATEGIES (by composite score)");
console.log("═══════════════════════════════════════════════════════════════\n");

for (let i = 0; i < 5 && i < results.length; i++) {
  const r = results[i];
  const medal = i === 0 ? "★" : ` ${i + 1}`;
  console.log(`  ${medal}: P20+alt ${r.altDays}d (${r.totalCoverage}d total coverage)`);
  console.log(`      P20 doses in bridge: ${r.p20BridgeDoses}`);
  console.log(`      Bridge ends: D${r.bridgeEnd + 1}`);
  console.log(`      fE at end: ${r.fE_atEnd.toFixed(1)}mg equiv | norfluoxetine: ${r.nfE_atEnd.toFixed(1)}`);
  console.log(`      SERT at end: ${r.sert_atEnd.toFixed(1)}% → ${r.sert7dPost.toFixed(1)}% after 7d (drop: ${r.sertDropRate.toFixed(3)}%/d)`);
  console.log(`      Post-bridge min WB: ${r.minPostBridgeWB.toFixed(2)} (D${r.minWBDay + 1})`);
  console.log(`      Post-bridge AUC loss: ${r.postBridgeAUCLoss.toFixed(1)}`);
  console.log(`      fE half-life reached: D${r.fE_halfDay ? r.fE_halfDay + 1 : "N/A"}`);
  console.log(`      Fluox SERT < 10%: D${r.sertFluoxBelow10Day ? r.sertFluoxBelow10Day + 1 : "N/A"}`);
  console.log(`      Score: ${r.score.toFixed(2)}`);
  console.log();
}

// ── Marginal analysis ──
console.log("═══════════════════════════════════════════════════════════════");
console.log("  MARGINAL GAIN PER EXTRA ALT DAY");
console.log("═══════════════════════════════════════════════════════════════\n");

const byDays = [...results].sort((a, b) => a.altDays - b.altDays);
console.log("  Alt │ Min WB  │ Δ WB    │ SERT    │ Δ SERT   │ nfE    │ Drop/d  │ +Doses │ Δ Score");
console.log("  ────┼─────────┼─────────┼─────────┼──────────┼────────┼─────────┼────────┼────────");
for (let i = 0; i < byDays.length; i++) {
  const r = byDays[i];
  const prev = i > 0 ? byDays[i - 1] : null;
  const dWB   = prev ? `${(r.minPostBridgeWB - prev.minPostBridgeWB) >= 0 ? "+" : ""}${(r.minPostBridgeWB - prev.minPostBridgeWB).toFixed(3)}` : "   —  ";
  const dSERT = prev ? `${(r.sert_atEnd - prev.sert_atEnd) >= 0 ? "+" : ""}${(r.sert_atEnd - prev.sert_atEnd).toFixed(2)}` : "   —  ";
  const dDose = prev ? `+${r.p20BridgeDoses - prev.p20BridgeDoses}` : " —";
  const dScore = prev ? `${(r.score - prev.score) >= 0 ? "+" : ""}${(r.score - prev.score).toFixed(2)}` : "   —  ";
  console.log(
    `  ${String(r.altDays).padStart(3)}d│ ${r.minPostBridgeWB.toFixed(2).padStart(6)}  │ ${dWB.padStart(7)} │ ${r.sert_atEnd.toFixed(1).padStart(6)}  │ ${dSERT.padStart(7)}  │ ${r.nfE_atEnd.toFixed(1).padStart(5)}  │ ${r.sertDropRate.toFixed(3).padStart(6)}  │  ${dDose.padStart(3)}   │ ${dScore.padStart(7)}`
  );
}

// ── Diminishing returns inflection point ──
console.log("\n═══════════════════════════════════════════════════════════════");
console.log("  DIMINISHING RETURNS ANALYSIS");
console.log("═══════════════════════════════════════════════════════════════\n");

for (let i = 1; i < byDays.length; i++) {
  const r = byDays[i];
  const prev = byDays[i - 1];
  const marginalWB = r.minPostBridgeWB - prev.minPostBridgeWB;
  const marginalDose = r.p20BridgeDoses - prev.p20BridgeDoses;
  const efficiency = marginalDose > 0 ? marginalWB / marginalDose : marginalWB;

  if (marginalWB < 0.001 && i > 2) {
    console.log(`  ⚡ Diminishing returns inflection: alt ${prev.altDays}d → ${r.altDays}d adds only ${marginalWB.toFixed(4)} WB`);
    console.log(`     Beyond ${prev.altDays}d, extra alt days provide negligible wellbeing benefit.`);
    break;
  }
}

// Show the SERT occupancy decay curves for top strategies
console.log("\n═══════════════════════════════════════════════════════════════");
console.log("  SERT OCCUPANCY DECAY — Top strategies post-bridge");
console.log("═══════════════════════════════════════════════════════════════\n");

const topStrategies = [8, 12, 14, 16, 20];
console.log("  Day  │ " + topStrategies.map(a => `alt ${String(a).padStart(2)}d`).join(" │ "));
console.log("  ─────┼" + topStrategies.map(() => "────────").join("─┼"));

for (let offset = 0; offset <= 20; offset += 2) {
  const vals = topStrategies.map(altDays => {
    const doseFn = makeAltDose(altDays);
    const bridgeEnd = BRIDGE_START + DAILY_PHASE + altDays;
    const day = bridgeEnd + offset;
    if (day > N) return "   —  ";
    const pk = pkCalc(day, doseFn);
    return `${pk.cS.toFixed(1).padStart(5)}%`;
  });
  const displayDay = offset;
  console.log(`  +${String(displayDay).padStart(3)}d │ ${vals.join("  │ ")}`);
}

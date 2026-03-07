export const START = "2026-02-12";
export const TODAY_S = new Date().toISOString().split("T")[0];
const LN2 = Math.log(2);

// ── Default dose schedule (actual regimen) ──
export function getDose(d) {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  return [10, 0];
}

// ── PK Constants ──
const FLUOX_HALFLIFE     = 48;   // hours — fluoxetine
const NORFLUOX_HALFLIFE  = 223;  // hours — norfluoxetine (active metabolite)
const NORFLUOX_CONV      = 0.8;  // conversion ratio fluoxetine → norfluoxetine
const FLUOX_EC50         = 5;    // Michaelis-Menten EC50 for fluoxetine SERT binding
const FLUOX_EMAX         = 83;   // max SERT occupancy from fluoxetine (%)
const VORT_HALFLIFE      = 66;   // hours — vortioxetine
const VORT_EC50          = 5;    // Michaelis-Menten EC50 for vortioxetine SERT binding
const VORT_EMAX          = 100;  // max SERT occupancy from vortioxetine (%)

// Wellbutrin (bupropion) is a strong CYP2D6 inhibitor taken continuously.
// Per Chen et al. (2013, PMC3775155): AUC +128% (~2.28x), Cmax +114% (~2.14x).
// This is a constant, persistent effect independent of Prozac.
const WELLBUTRIN_CYP_FACTOR = 2.2;

// Prozac steady-state accumulation (pre-switch baseline)
const PROZAC_SS_FLUOX    = 40 / (1 - Math.pow(0.5, 24 / FLUOX_HALFLIFE));
const PROZAC_SS_NORFLUOX = 40 * NORFLUOX_CONV / (1 - Math.pow(0.5, 24 / NORFLUOX_HALFLIFE));

export const REC = {
  "5-HT3":  { ki: 3.7,  a: "Antagonist",      ef: 2.3,  em: 95, c: "#f97316" },
  "5-HT1A": { ki: 15,   a: "Agonist",          ef: 9.4,  em: 85, c: "#22d3ee" },
  "5-HT7":  { ki: 19,   a: "Antagonist",       ef: 11.9, em: 90, c: "#a78bfa" },
  "5-HT1B": { ki: 33,   a: "Partial Agonist",  ef: 20.6, em: 80, c: "#34d399" },
  "5-HT1D": { ki: 54,   a: "Antagonist",       ef: 33.7, em: 75, c: "#fb7185" },
};

// ── Core PK functions (parameterized by dose function for reuse) ──

export function fluoxEquivAt(h, doseFn = getDose) {
  let level = PROZAC_SS_FLUOX * Math.exp(-LN2 * h / FLUOX_HALFLIFE);
  for (let d = 0; d <= Math.floor(h / 24); d++) {
    const [, prozacDose] = doseFn(d);
    if (prozacDose > 0 && h > d * 24) {
      level += prozacDose * Math.exp(-LN2 * (h - d * 24) / FLUOX_HALFLIFE);
    }
  }
  return (level / PROZAC_SS_FLUOX) * 40;
}

export function pkCalc(day, doseFn = getDose) {
  const h = day * 24;
  const maxDay = Math.floor(day);

  // Fluoxetine & norfluoxetine levels (decaying from pre-switch steady state + new doses)
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

  // CYP2D6 inhibition: Wellbutrin provides constant ~2.2x baseline.
  // Prozac adds additional inhibition on top during overlap period.
  const prozacCypContrib = Math.min(1.0, (fluoxEquiv / 40) * 1.0);
  const totalCypBoost    = Math.min(3.5, WELLBUTRIN_CYP_FACTOR + prozacCypContrib * 0.4);

  // Vortioxetine accumulation (affected by CYP2D6 at time of each dose)
  let vortLevel = 0;
  for (let d = 0; d <= maxDay; d++) {
    const [vortDose] = doseFn(d);
    if (vortDose > 0 && h > d * 24) {
      const elapsed = h - d * 24;
      const doseTimeFluox = fluoxEquivAt(d * 24, doseFn);
      const doseTimeCyp   = Math.min(3.5, WELLBUTRIN_CYP_FACTOR + Math.min(1.0, (doseTimeFluox / 40) * 1.0) * 0.4);
      vortLevel += vortDose * doseTimeCyp * Math.exp(-LN2 * elapsed / (VORT_HALFLIFE * Math.pow(doseTimeCyp, 0.4)));
    }
  }
  const vortEffective = Math.max(0, vortLevel);

  // Michaelis-Menten SERT occupancy
  const sertFromVort  = VORT_EMAX * vortEffective / (VORT_EC50 + vortEffective);
  const sertFromFluox = FLUOX_EMAX * fluoxEquiv / (FLUOX_EC50 + fluoxEquiv);
  const combinedSert  = Math.min(98, 100 * (1 - (1 - sertFromVort / 100) * (1 - sertFromFluox / 100)));

  // 5-HT receptor subtype occupancy
  const receptorOccupancy = {};
  Object.entries(REC).forEach(([name, r]) => {
    receptorOccupancy[name] = r.em * vortEffective / (VORT_EC50 * r.ef + vortEffective);
  });

  return {
    day,
    fE: fluoxEquiv,
    vE: vortEffective,
    vN: doseFn(Math.floor(day))[0],
    pN: doseFn(Math.floor(day))[1],
    cyp: totalCypBoost,
    sV: sertFromVort,
    sF: sertFromFluox,
    cS: combinedSert,
    ...receptorOccupancy,
  };
}

// ── PD (pharmacodynamic maturation — Trintellix neuroadaptation only) ──

function sigmoid(day, t50, k, emax = 100, lag = 0) {
  const t = Math.max(0, day - lag);
  return emax / (1 + Math.exp(-k * (t - t50)));
}

// PD reflects Trintellix neuroadaptation ONLY — no Prozac baseline carried over.
// Prozac's influence is visible only through shared metrics (SERT occupancy, wellbeing).
export function computePD(day) {
  return {
    autorecept:     sigmoid(day, 18, 0.18, 100, 2),
    gabaDisinhib:   sigmoid(day, 12, 0.22, 100, 1),
    circadian:      sigmoid(day, 16, 0.15, 100, 3),
    bdnf:           sigmoid(day, 32, 0.1,  100, 7),
    glymphatic:     sigmoid(day, 45, 0.08, 100, 14),
    dmn:            sigmoid(day, 35, 0.09, 100, 10),
    // Fluoxetine has the lowest discontinuation syndrome risk among SSRIs
    // due to norfluoxetine's ultra-long half-life acting as a natural taper.
    // Amplitudes softened (25→8, 15→5) and Gaussians widened to reflect this.
    norfluoxStress: Math.max(0, 8 * Math.exp(-0.5 * Math.pow((day - 24) / 10, 2))) * (1 / (1 + Math.exp(-1.2 * (day - 12)))),
    cypStress:      Math.max(0, 5 * Math.exp(-0.5 * Math.pow((day - 30) / 12, 2))) * (1 / (1 + Math.exp(-1.2 * (day - 14)))),
  };
}

// ── PK score weighting ──
function computePkRaw(pk) {
  return (
    pk.sV * 0.25 +
    (pk["5-HT3"]  || 0) * 0.20 +
    (pk["5-HT1A"] || 0) * 0.15 +
    (pk["5-HT7"]  || 0) * 0.10 +
    (pk["5-HT1B"] || 0) * 0.05 +
    Math.min(100, pk.vE * 5) * 0.05
  );
}

// Precompute steady-state reference once (day 200 with default dose)
const STEADY_STATE_PK = pkCalc(200);
const STEADY_STATE_PK_MAX = computePkRaw(STEADY_STATE_PK);

export function computeAll(day, doseFn = getDose, pdFn = computePD) {
  const pk = pkCalc(day, doseFn);
  const pd = pdFn(day);

  // PK score reflects plasma steady-state receptor occupancy
  // No artificial lag — PK should plateau by ~14 days (5× vortioxetine half-lives)
  // Normalize against steady-state achievable max
  const ssMax = doseFn === getDose
    ? STEADY_STATE_PK_MAX
    : computePkRaw(pkCalc(200, doseFn));
  const pkScore = Math.min(100, (computePkRaw(pk) / Math.max(ssMax, 1)) * 100);

  const pdScore = pd.autorecept * 0.25 + pd.gabaDisinhib * 0.20 + pd.circadian * 0.10 + pd.bdnf * 0.20 + pd.glymphatic * 0.10 + pd.dmn * 0.15;
  const stress = (pd.norfluoxStress || 0) + (pd.cypStress || 0);

  // Prozac baseline ~60% — you were functional but not optimal
  const prozacBaseline = 60;
  // Trintellix therapeutic gain on top of baseline (modest ~18 points max)
  const trinGain = (pkScore / 100) * (pdScore / 100) * 18;
  // Transition dip: stress pulls you below baseline temporarily
  const wellbeing = Math.max(0, Math.min(100, prozacBaseline + trinGain - stress));
  return { ...pk, ...pd, pkScore, pdScore, stressScore: stress, wellbeing, day };
}

export function genTimeline(n = 56) {
  const data = [];
  const s = new Date(START);
  for (let i = 0; i <= n; i += 0.5) {
    const w = computeAll(i);
    const dt = new Date(s);
    dt.setDate(s.getDate() + Math.floor(i));
    dt.setHours(s.getHours() + (i % 1) * 24);
    data.push({
      ...w,
      ds: dt.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      di: dt.toISOString().split("T")[0],
    });
  }
  return data;
}

export function getTodayN() {
  return Math.round((new Date(new Date().toISOString().split("T")[0]) - new Date(START)) / 864e5);
}

export const TODAY_N = getTodayN();

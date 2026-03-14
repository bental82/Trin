export const START = "2026-02-12";
export const TODAY_S = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
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
const FLUOX_EC50         = 6;    // Hill EC50 for fluoxetine SERT (PET-calibrated, n=2)
const FLUOX_EMAX         = 88;   // max SERT occupancy from fluoxetine (%) — PET ceiling (Meyer 2004)
const VORT_HALFLIFE      = 66;   // hours — vortioxetine
const VORT_EC50          = 5;    // reference EC50 for receptor subtype occupancy calculations
const VORT_EMAX          = 100;  // max SERT occupancy from vortioxetine (%)
const VORT_SERT_EC50     = 45;   // Hill EC50 for vortioxetine SERT (PET-calibrated: 10mg→50%)
const SERT_HILL_N        = 2;    // Hill coefficient — fitted to PET dose-response (Stenkrona 2015)

// Wellbutrin (bupropion) is a strong CYP2D6 inhibitor taken continuously.
// Per Chen et al. (2013, PMC3775155): AUC +128% (~2.28x), Cmax +114% (~2.14x).
// cypBase parameter allows exploring the 1.5×–2.2× uncertainty range.
export const DEFAULT_CYP_BASE = 2.2;

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

export function pkCalc(day, doseFn = getDose, cypBase = DEFAULT_CYP_BASE) {
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
  // Cap at 2.8x — CYP2D6 saturates well before 3.5x when both inhibitors present.
  const prozacCypContrib = Math.min(1.0, (fluoxEquiv / 40) * 1.0);
  const totalCypBoost    = Math.min(2.8, cypBase + prozacCypContrib * 0.4);

  // Vortioxetine accumulation (affected by CYP2D6 at time of each dose)
  let vortLevel = 0;
  for (let d = 0; d <= maxDay; d++) {
    const [vortDose] = doseFn(d);
    if (vortDose > 0 && h > d * 24) {
      const elapsed = h - d * 24;
      const doseTimeFluox = fluoxEquivAt(d * 24, doseFn);
      const doseTimeCyp   = Math.min(2.8, cypBase + Math.min(1.0, (doseTimeFluox / 40) * 1.0) * 0.4);
      // CYP inhibition reduces clearance → extends t½ and proportionally increases AUC.
      // Using t½ × CYP factor (not dose × CYP) avoids double-counting.
      // At CYP=2.2 (bupropion alone): t½ ≈ 145h, AUC ≈ 2.2× — matches CYP2D6 PM literature.
      vortLevel += vortDose * Math.exp(-LN2 * elapsed / (VORT_HALFLIFE * doseTimeCyp));
    }
  }
  const vortEffective = Math.max(0, vortLevel);

  // Hill equation SERT occupancy (n=2, PET-calibrated EC50s)
  // 10mg normal→50%, 20mg normal→80%, 10mg+Wellbutrin→81% (Stenkrona 2015)
  const vEn = Math.pow(vortEffective, SERT_HILL_N);
  const fEn = Math.pow(fluoxEquiv, SERT_HILL_N);
  const sertFromVort  = VORT_EMAX * vEn / (Math.pow(VORT_SERT_EC50, SERT_HILL_N) + vEn);
  const sertFromFluox = FLUOX_EMAX * fEn / (Math.pow(FLUOX_EC50, SERT_HILL_N) + fEn);
  // Bliss independence of PET-calibrated Hill values — appropriate here because
  // each drug has a different Emax, and individual values are already PET-matched.
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

// ── PD (pharmacodynamic maturation) ──
// Prozac already matured several shared downstream mechanisms over years of use.
// Each sigmoid gets a carryover floor so it doesn't start from zero.
// Only Trintellix-specific mechanisms (GABA disinhibition via 5-HT3) start fresh.

function sigmoid(day, t50, k, emax = 100, lag = 0) {
  const t = Math.max(0, day - lag);
  return emax / (1 + Math.exp(-k * (t - t50)));
}

// carryover: fraction of emax already achieved from prior Prozac use (0–1).
// The sigmoid grows from carryover×emax toward emax.
function sigmoidWithCarryover(day, t50, k, emax, lag, carryover) {
  const raw = sigmoid(day, t50, k, emax, lag);
  return carryover * emax + (1 - carryover) * raw;
}

export function computePD(day) {
  return {
    // Autoreceptor desensitization: Prozac already desensitized 5-HT1A autoreceptors;
    // Trintellix hits the same receptors (partial agonist). ~55% carryover.
    autorecept:     sigmoidWithCarryover(day, 18, 0.18, 100, 2, 0.55),
    // GABA disinhibition: Trintellix-specific (5-HT3 antagonism). No carryover.
    gabaDisinhib:   sigmoidWithCarryover(day, 12, 0.22, 100, 1, 0),
    // Circadian entrainment: partial overlap via serotonergic tone. ~30% carryover.
    circadian:      sigmoidWithCarryover(day, 16, 0.15, 100, 3, 0.30),
    // BDNF upregulation: all SSRIs drive this robustly. ~65% carryover.
    bdnf:           sigmoidWithCarryover(day, 32, 0.1,  100, 7, 0.65),
    // Glymphatic: weak serotonergic overlap. ~10% carryover.
    glymphatic:     sigmoidWithCarryover(day, 45, 0.08, 100, 14, 0.10),
    // DMN reconfiguration: partial overlap. ~25% carryover.
    dmn:            sigmoidWithCarryover(day, 35, 0.09, 100, 10, 0.25),
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
    (pk["5-HT1D"] || 0) * 0.05 +
    Math.min(100, pk.vE * 5) * 0.05
  );
}

// Precompute steady-state reference for default CYP; cache others on demand
const _ssCache = {};
function getSteadyStatePkMax(cypBase = DEFAULT_CYP_BASE) {
  if (!_ssCache[cypBase]) {
    _ssCache[cypBase] = computePkRaw(pkCalc(200, getDose, cypBase));
  }
  return _ssCache[cypBase];
}

export function computeAll(day, doseFn = getDose, pdFn = computePD, cypBase = DEFAULT_CYP_BASE) {
  const pk = pkCalc(day, doseFn, cypBase);
  const pd = pdFn(day);

  // PK score: always normalize against 10mg steady state so higher doses
  // can exceed 100% — reflecting their higher SERT/receptor occupancy ceiling.
  // Clinical data (pooled 6 trials): 20mg → +1 MADRS point vs 10mg,
  // 51.4% vs 46.0% response, onset 4 weeks earlier (Thase 2023, Baldwin 2016).
  const pkRaw = computePkRaw(pk);
  const pkScore = (pkRaw / Math.max(getSteadyStatePkMax(cypBase), 1)) * 100;

  const pdScore = pd.autorecept * 0.25 + pd.gabaDisinhib * 0.20 + pd.circadian * 0.10 + pd.bdnf * 0.20 + pd.glymphatic * 0.10 + pd.dmn * 0.15;
  const stress = (pd.norfluoxStress || 0) + (pd.cypStress || 0);

  // Prozac baseline ~60% — you were functional but not optimal
  const prozacBaseline = 60;
  // Dose-response: pkScore >100% for doses above 10mg reference.
  // Diminishing returns above 100% — going from 80→90% SERT adds less
  // marginal benefit than 50→80%. Factor of 0.5 on excess matches the
  // ~1 MADRS point (≈1.5 wellbeing points) advantage of 20mg over 10mg.
  const pkFactor = pkScore <= 100
    ? pkScore / 100
    : 1 + (pkScore - 100) / 100 * 0.5;
  const trinGain = pkFactor * (pdScore / 100) * 12;
  // Transition dip: stress pulls you below baseline temporarily
  const wellbeing = Math.max(0, Math.min(100, prozacBaseline + trinGain - stress));
  return { ...pk, ...pd, pkScore, pdScore, stressScore: stress, wellbeing, day };
}

export function genTimeline(n = 56, cypBase = DEFAULT_CYP_BASE) {
  const data = [];
  const s = new Date(START);
  for (let i = 0; i <= n; i += 0.5) {
    const w = computeAll(i, getDose, computePD, cypBase);
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
  // Use Israel timezone so the day rolls over at local midnight
  const todayLocal = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" }); // "YYYY-MM-DD"
  return Math.round((new Date(todayLocal) - new Date(START)) / 864e5);
}

export const TODAY_N = getTodayN();
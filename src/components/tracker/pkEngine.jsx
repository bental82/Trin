export const START = "2026-02-12";
export const TODAY_S = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
const LN2 = Math.log(2);

// Bridge phase starts Day 22 — Prozac 20mg reintroduced for uptitration support
export const BRIDGE_DAY = 22;

// ── Actual dose schedule (T20-fast regimen) ──
// Pre-switch → overlap → washout → bridge → uptitrate → maintenance
export function getDose(d) {
  if (d < 0) return [0, 40];                                                  // Pre-switch: Prozac 40mg
  if (d === 0) return [5, 20];                                                 // Day 0: Vort 5mg intro, Prozac halved
  if (d <= 7) return [10, 20];                                                 // Week 1: Vort 10mg + Prozac 20mg overlap
  if (d < BRIDGE_DAY) return [10, 0];                                          // Weeks 2-3: Vort 10mg, Prozac washout
  const bd = d - BRIDGE_DAY;
  if (bd < 7) return [10, 20];                                                 // Bridge days 0-6: Vort 10mg + Prozac 20mg daily
  if (bd === 7) return [10, 20];                                               // Bridge day 7: last T10 + P20
  if (bd === 8) return [15, 0];                                                // Bridge day 8: uptitrate to T15 (P20 off-day)
  if (bd >= 9 && bd < 21) return [20, ((bd - 7) % 2 === 0) ? 20 : 0];        // Bridge day 9+: T20 + P20 alternating
  return [20, 0];                                                              // Maintenance: T20 only
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
const VORT_SERT_EC50     = 24;   // Hill EC50 for vortioxetine SERT (PET-calibrated: 10mg→65%, Stenkrona 2013)
const VORT_SERT_HILL_N   = 1;    // Hill coefficient for vortioxetine — n=1 fits PET across 5-60mg range
const FLUOX_SERT_HILL_N  = 2;    // Hill coefficient for fluoxetine — n=2 matches Meyer 2004 SSRI curve

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
  let fluoxLevel    = PROZAC_SS_FLUOX * Math.exp(-LN2 * h / FLUOX_HALFLIFE);
  let norfluoxLevel = PROZAC_SS_NORFLUOX * Math.exp(-LN2 * h / NORFLUOX_HALFLIFE);
  for (let d = 0; d <= Math.floor(h / 24); d++) {
    const [, prozacDose] = doseFn(d);
    if (prozacDose > 0 && h > d * 24) {
      const elapsed = h - d * 24;
      fluoxLevel    += prozacDose * Math.exp(-LN2 * elapsed / FLUOX_HALFLIFE);
      norfluoxLevel += prozacDose * NORFLUOX_CONV * Math.exp(-LN2 * elapsed / NORFLUOX_HALFLIFE);
    }
  }
  const fE = (fluoxLevel / PROZAC_SS_FLUOX) * 40;
  const nE = (norfluoxLevel / PROZAC_SS_NORFLUOX) * 40;
  return { fE, nE };
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
  const norfluoxEquiv = Math.max(0, (norfluoxLevel / PROZAC_SS_NORFLUOX) * 40);

  // CYP2D6 inhibition: Wellbutrin provides constant ~2.2x baseline.
  // Both fluoxetine and norfluoxetine (t½=223h) are potent CYP2D6 inhibitors.
  // Norfluoxetine maintains CYP inhibition weeks after fluoxetine clears.
  // Cap at 2.8x — CYP2D6 saturates well before 3.5x when both inhibitors present.
  const fluoxCypContrib    = Math.min(1.0, fluoxEquiv / 40);
  const norfluoxCypContrib = Math.min(1.0, norfluoxEquiv / 40);
  const prozacCypContrib   = Math.min(1.0, fluoxCypContrib * 0.5 + norfluoxCypContrib * 0.5);
  const totalCypBoost      = Math.min(2.8, cypBase + prozacCypContrib * 0.4);

  // Vortioxetine accumulation (affected by CYP2D6 at time of each dose)
  let vortLevel = 0;
  for (let d = 0; d <= maxDay; d++) {
    const [vortDose] = doseFn(d);
    if (vortDose > 0 && h > d * 24) {
      const elapsed = h - d * 24;
      const { fE: dtFluox, nE: dtNorfluox } = fluoxEquivAt(d * 24, doseFn);
      const dtCypContrib = Math.min(1.0, Math.min(1.0, dtFluox / 40) * 0.5 + Math.min(1.0, dtNorfluox / 40) * 0.5);
      const doseTimeCyp  = Math.min(2.8, cypBase + dtCypContrib * 0.4);
      // CYP inhibition reduces clearance → extends t½ and proportionally increases AUC.
      // Using t½ × CYP factor (not dose × CYP) avoids double-counting.
      // At CYP=2.2 (bupropion alone): t½ ≈ 145h, AUC ≈ 2.2× — matches CYP2D6 PM literature.
      vortLevel += vortDose * Math.exp(-LN2 * elapsed / (VORT_HALFLIFE * doseTimeCyp));
    }
  }
  const vortEffective = Math.max(0, vortLevel);

  // Hill equation SERT occupancy (PET-calibrated EC50s, separate Hill coefficients)
  // Vortioxetine n=1: 10mg→65%, 10mg+WB→79%, 20mg→79%, 20mg+WB→89% (Stenkrona 2013, Areberg 2012)
  // Fluoxetine n=2: 40mg→86%, 20mg→81% (Meyer 2004)
  const vEn = Math.pow(vortEffective, VORT_SERT_HILL_N);
  const fEn = Math.pow(fluoxEquiv, FLUOX_SERT_HILL_N);
  const sertFromVort  = VORT_EMAX * vEn / (Math.pow(VORT_SERT_EC50, VORT_SERT_HILL_N) + vEn);
  const sertFromFluox = FLUOX_EMAX * fEn / (Math.pow(FLUOX_EC50, FLUOX_SERT_HILL_N) + fEn);
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
// Uses combined SERT (cS) — not vort-only (sV) — so fluoxetine's SERT
// contribution during bridge phases flows through the PK pathway.
// SERT weight 50%: primary antidepressant mechanism for all SRIs including
// vortioxetine (Thase 2016 meta-analysis: clear dose-dependent MADRS response,
// 20mg Δ-4.57 vs 10mg Δ-3.57 vs 5mg Δ-2.27; Stenkrona 2013 PET: SERT
// occupancy drives dose-response 50%→65%→80% at 5/10/20mg).
// Multimodal receptors (5-HT3/1A/7/1B/1D) modulate the response — cognition,
// tolerability, anxiolysis — but saturate at low doses and don't independently
// drive antidepressant efficacy.
function computePkRaw(pk) {
  return (
    pk.cS * 0.50 +
    (pk["5-HT3"]  || 0) * 0.12 +
    (pk["5-HT1A"] || 0) * 0.12 +
    (pk["5-HT7"]  || 0) * 0.08 +
    (pk["5-HT1B"] || 0) * 0.04 +
    (pk["5-HT1D"] || 0) * 0.03 +
    Math.min(100, pk.vE * 5) * 0.11
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

  // PD dose-sensitivity: higher SERT occupancy drives faster downstream
  // maturation (autoreceptor desens, BDNF, etc). Evaluate PD sigmoids at
  // an accelerated timepoint. Reference: 10mg+Wellbutrin steady-state SERT ~79%.
  // Clamped to 0.85×–1.15× to keep within biologically plausible range.
  const refSert = 79;
  const pdAccel = Math.max(0.85, Math.min(1.15, 1 + 0.2 * (pk.cS - refSert) / refSert));
  const pdMat = pdFn(day * pdAccel);    // maturation at accelerated time
  const pdStress = pdFn(day);           // stress uses real time (fluoxetine clearance)
  const pd = {
    ...pdMat,
    norfluoxStress: pdStress.norfluoxStress,
    cypStress: pdStress.cypStress,
  };

  // PK score: normalize against T20-fast steady state (getDose day 200).
  // Uses combined SERT (cS) so fluoxetine bridge coverage is visible.
  // Clinical data (Thase 2016, 11 RCTs): 20mg Δ-4.57 vs 10mg Δ-3.57 MADRS;
  // 20mg vs 10mg direct: −1.03 MADRS points, onset 2 weeks earlier.
  const pkRaw = computePkRaw(pk);
  const pkScore = (pkRaw / Math.max(getSteadyStatePkMax(DEFAULT_CYP_BASE), 1)) * 100;

  const pdScore = pd.autorecept * 0.25 + pd.gabaDisinhib * 0.20 + pd.circadian * 0.10 + pd.bdnf * 0.20 + pd.glymphatic * 0.10 + pd.dmn * 0.15;
  const stress = (pd.norfluoxStress || 0) + (pd.cypStress || 0);

  // Prozac baseline ~60% — you were functional but not optimal
  const prozacBaseline = 60;
  // Dose-response: pkScore >100% for doses above reference.
  // Diminishing returns above 100% — going from 80→90% SERT adds less
  // marginal benefit than 50→80%. Factor of 0.6 on excess calibrated to
  // Thase 2016: 20mg vs 10mg = −1.03 MADRS points (Cambridge Core 2021).
  // trinGain range of 30 gives wellbeing a meaningful arc (60→~90) and
  // allows strategies to visibly separate on the chart.
  const pkFactor = pkScore <= 100
    ? pkScore / 100
    : 1 + (pkScore - 100) / 100 * 0.6;
  const trinGain = pkFactor * (pdScore / 100) * 30;
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
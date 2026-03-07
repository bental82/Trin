export const START = "2026-02-12";
export const TODAY_S = new Date().toISOString().split("T")[0];
const L2 = Math.log(2);

export function getDose(d) {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  return [10, 0];
}

const fHL = 48, nHL = 223, nC = 0.8, fE50 = 5, fMx = 83, vHL = 66, vE50 = 5, vMx = 100;
// Wellbutrin (bupropion) is a strong CYP2D6 inhibitor taken continuously.
// Per Chen et al. (2013, PMC3775155): AUC +128% (~2.28x), Cmax +114% (~2.14x).
// This is a constant, persistent effect independent of Prozac.
const wCYP = 2.2;
const pSF = 40 / (1 - Math.pow(0.5, 24 / fHL));
const pSN = 40 * nC / (1 - Math.pow(0.5, 24 / nHL));

export const REC = {
  "5-HT3":  { ki: 3.7,  a: "Antagonist",      ef: 2.3,  em: 95, c: "#f97316" },
  "5-HT1A": { ki: 15,   a: "Agonist",          ef: 9.4,  em: 85, c: "#22d3ee" },
  "5-HT7":  { ki: 19,   a: "Antagonist",       ef: 11.9, em: 90, c: "#a78bfa" },
  "5-HT1B": { ki: 33,   a: "Partial Agonist",  ef: 20.6, em: 80, c: "#34d399" },
  "5-HT1D": { ki: 54,   a: "Antagonist",       ef: 33.7, em: 75, c: "#fb7185" },
};

function fxAt(h) {
  let l = pSF * Math.exp(-L2 * h / fHL);
  for (let d = 0; d <= Math.floor(h / 24); d++) {
    const [, p] = getDose(d);
    if (p > 0 && h > d * 24) l += p * Math.exp(-L2 * (h - d * 24) / fHL);
  }
  return (l / pSF) * 40;
}

export function pkCalc(day) {
  const h = day * 24;
  const mx = Math.floor(day);
  let fL = pSF * Math.exp(-L2 * Math.max(0, h) / fHL);
  let nL = pSN * Math.exp(-L2 * Math.max(0, h) / nHL);
  for (let d = 0; d <= mx; d++) {
    const [, p] = getDose(d);
    if (p > 0 && h > d * 24) {
      const e = h - d * 24;
      fL += p * Math.exp(-L2 * e / fHL);
      nL += p * nC * Math.exp(-L2 * e / nHL);
    }
  }
  const fE = Math.max(0, (fL / pSF) * 40);
  // CYP2D6 inhibition: Wellbutrin provides constant ~2.2x baseline.
  // Prozac adds additional inhibition on top during overlap period.
  const fC = Math.min(1.0, (fE / 40) * 1.0); // Prozac's additional CYP contribution (0→1)
  const tC = Math.min(3.5, wCYP + fC * 0.4); // Wellbutrin baseline + Prozac boost
  let vL = 0;
  for (let d = 0; d <= mx; d++) {
    const [v] = getDose(d);
    if (v > 0 && h > d * 24) {
      const e = h - d * 24;
      const dF = fxAt(d * 24);
      const dC = Math.min(3.5, wCYP + Math.min(1.0, (dF / 40) * 1.0) * 0.4);
      vL += v * dC * Math.exp(-L2 * e / (vHL * Math.pow(dC, 0.4)));
    }
  }
  const vE = Math.max(0, vL);
  const sV = vMx * vE / (vE50 + vE);
  const sF = fMx * fE / (fE50 + fE);
  const cS = Math.min(98, 100 * (1 - (1 - sV / 100) * (1 - sF / 100)));
  const rO = {};
  Object.entries(REC).forEach(([n, r]) => { rO[n] = r.em * vE / (vE50 * r.ef + vE); });
  return { day, fE, vE, vN: getDose(Math.floor(day))[0], pN: getDose(Math.floor(day))[1], cyp: tC, sV, sF, cS, ...rO };
}

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

export function computeAll(day) {
  const p = pkCalc(day);
  const pd = computePD(day);

  // PK score reflects plasma steady-state receptor occupancy
  // No artificial lag — PK should plateau by ~14 days (5× vortioxetine half-lives)
  // Compute steady-state reference (day 200) to normalize against achievable max
  const ss = pkCalc(200);
  const pkRaw =
    p.sV * 0.25 +
    (p["5-HT3"]  || 0) * 0.20 +
    (p["5-HT1A"] || 0) * 0.15 +
    (p["5-HT7"]  || 0) * 0.10 +
    (p["5-HT1B"] || 0) * 0.05 +
    Math.min(100, p.vE * 5) * 0.05;
  const ssMax =
    ss.sV * 0.25 +
    (ss["5-HT3"]  || 0) * 0.20 +
    (ss["5-HT1A"] || 0) * 0.15 +
    (ss["5-HT7"]  || 0) * 0.10 +
    (ss["5-HT1B"] || 0) * 0.05 +
    Math.min(100, ss.vE * 5) * 0.05;
  const pkScore = Math.min(100, (pkRaw / ssMax) * 100);

  const pdScore = pd.autorecept * 0.25 + pd.gabaDisinhib * 0.20 + pd.circadian * 0.10 + pd.bdnf * 0.20 + pd.glymphatic * 0.10 + pd.dmn * 0.15;
  const stress = pd.norfluoxStress + pd.cypStress;

  // Prozac baseline ~60% — you were functional but not optimal
  const prozacBaseline = 60;
  // Trintellix therapeutic gain on top of baseline (modest ~18 points max)
  const trinGain = (pkScore / 100) * (pdScore / 100) * 18;
  // Transition dip: stress pulls you below baseline temporarily
  const wellbeing = Math.max(0, Math.min(100, prozacBaseline + trinGain - stress));
  return { ...p, ...pd, pkScore, pdScore, stressScore: stress, wellbeing, day };
}

export function genTimeline(n = 56) {
  const data = [];
  const s = new Date(START);
  for (let i = 0; i <= n; i += 0.5) {
    const w = computeAll(i);
    const dt = new Date(s);
    dt.setHours(dt.getHours() + i * 24);
    data.push({
      ...w,
      ds: dt.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      di: dt.toISOString().split("T")[0],
    });
  }
  return data;
}

export const TODAY_N = Math.round((new Date(TODAY_S) - new Date(START)) / 864e5);
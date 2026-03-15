import { computeAll, computePD, getDose, BRIDGE_DAY } from "./pkEngine";

// Re-export for backward compat (Tracker.jsx imports BRIDGE_START from here)
export const BRIDGE_START = BRIDGE_DAY;

// P20+alt days dose function
export function doseTaper(d) {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < BRIDGE_START) return [10, 0];
  if (d >= BRIDGE_START && d < BRIDGE_START + 7) return [10, 20];
  const bd = d - BRIDGE_START;
  if (bd >= 7 && bd < 15) return [10, ((bd - 7) % 2 === 0) ? 20 : 0];
  return [10, 0];
}

// P20+alt days ×14d variant: 7d daily then 14d alternating
export function doseTaper14(d) {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < BRIDGE_START) return [10, 0];
  if (d >= BRIDGE_START && d < BRIDGE_START + 7) return [10, 20];
  const bd = d - BRIDGE_START;
  if (bd >= 7 && bd < 21) return [10, ((bd - 7) % 2 === 0) ? 20 : 0];
  return [10, 0];
}

// Option A — "T20 fast": T10 alt day 1 (bd 7), T15 day 2 (bd 8, today), T20 from bd 9 (tomorrow).
// Pre-bridge: T10+P20 daily 7d, then T10 washout, then T10+P20 bridge daily 7d.
export function doseUptitrate(d) {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < BRIDGE_START) return [10, 0];
  const bd = d - BRIDGE_START;
  if (bd < 7) return [10, 20];                                              // 7d daily P20 + T10
  if (bd === 7) return [10, 20];                                             // alt day 1: T10 (yesterday)
  if (bd === 8) return [15, 0];                                              // alt day 2: T15 (today, P20 off)
  if (bd >= 9 && bd < 21) return [20, ((bd - 7) % 2 === 0) ? 20 : 0];      // T20 + P20 alt from tomorrow
  return [20, 0];                                                            // T20 only
}

// Option B — "T15 wk": T10 alt day 1 (bd 7), T15 for rest of first alt week (bd 8-13), T20 from bd 14.
export function doseUptitrate15w(d) {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < BRIDGE_START) return [10, 0];
  const bd = d - BRIDGE_START;
  if (bd < 7) return [10, 20];                                              // 7d daily P20 + T10
  if (bd === 7) return [10, 20];                                             // alt day 1: T10 (yesterday)
  if (bd >= 8 && bd < 14) return [15, ((bd - 7) % 2 === 0) ? 20 : 0];      // T15 + P20 alt (rest of wk1)
  if (bd >= 14 && bd < 21) return [20, ((bd - 14) % 2 === 0) ? 20 : 0];    // T20 + P20 alt (wk2)
  return [20, 0];                                                            // T20 only
}

// P20 step-down: 7d daily → 8d every other day → 6d every 3rd day
export function doseStepdown(d) {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < BRIDGE_START) return [10, 0];
  if (d >= BRIDGE_START && d < BRIDGE_START + 7) return [10, 20];
  const bd = d - BRIDGE_START;
  if (bd >= 7 && bd < 15) return [10, ((bd - 7) % 2 === 0) ? 20 : 0];
  if (bd >= 15 && bd < 21) return [10, ((bd - 15) % 3 === 0) ? 20 : 0];
  return [10, 0];
}

// ── Shared stress/boost helpers with configurable parameters ──

function makeBridgeStress(endOffset, amplitude, center, width, steepness) {
  return (day) => {
    const da = day - (BRIDGE_START + endOffset);
    if (da <= 0) return 0;
    return Math.max(0, amplitude * Math.exp(-0.5 * ((da - center) / width) ** 2))
      * (1 / (1 + Math.exp(-steepness * (da - 1))));
  };
}

function makeBridgeBoost(coverageDays) {
  return (day, fE) => {
    return (fE > 2 && day >= BRIDGE_START && day < BRIDGE_START + coverageDays)
      ? Math.min(8, (fE / 20) * 8) : 0;
  };
}

// Stress amplitudes calibrated from PK-computed SERT occupancy cliffs:
//   Alt 8d:  SERT drops 26.1pp over 10d post-bridge → amp 0.80
//   Alt 14d: SERT drops 26.5pp over 10d post-bridge → amp 0.80 (same cliff, just delayed)
//   Step-down: SERT drops 24.0pp over 10d → amp 0.73 (q3d phase pre-tapers SERT)
// The real advantage of longer bridges is more Trintellix PD maturation time,
// not a softer discontinuation cliff (norfluoxetine t½=223h dominates either way).
export const bridgeStress   = makeBridgeStress(15, 0.80, 5, 4,   2.5);
export const bridgeBoost    = makeBridgeBoost(20);

export const bridgeStress14 = makeBridgeStress(21, 0.80, 5, 5,   2.5);
export const bridgeBoost14  = makeBridgeBoost(26);

export const bridgeStressSD = makeBridgeStress(21, 0.73, 5, 4.5, 2.5);
export const bridgeBoostSD  = makeBridgeBoost(24);

// T20 fast: T20 from bd 9, higher SERT means softer cliff
export const bridgeStressUT = makeBridgeStress(21, 0.60, 5, 5, 2.5);
export const bridgeBoostUT  = makeBridgeBoost(26);

// T15 wk: T15 first week then T20, slightly higher stress than T20 fast
// (less SERT coverage during first alt week)
export const bridgeStressUT15w = makeBridgeStress(21, 0.65, 5, 5, 2.5);
export const bridgeBoostUT15w  = makeBridgeBoost(26);

// ── Timeline generators ──

function genTimeline(n, doseFn, stressFn, boostFn, cypBase) {
  const data = [];
  for (let i = 0; i <= n; i += 0.5) {
    const result = computeAll(i, doseFn, computePD, cypBase);
    const extra = stressFn(i);
    const boost = boostFn(i, result.fE);
    const adjustedWB = Math.max(0, Math.min(100, result.wellbeing - extra + boost));
    data.push({
      ...result,
      wellbeing: adjustedWB,
      stressScore: result.stressScore + extra,
      day: i,
    });
  }
  return data;
}

export function genBridgeTimeline(n = 90, cypBase) {
  return genTimeline(n, doseTaper, bridgeStress, bridgeBoost, cypBase);
}

export function genBridgeTimeline14(n = 90, cypBase) {
  return genTimeline(n, doseTaper14, bridgeStress14, bridgeBoost14, cypBase);
}

export function genBridgeTimelineSD(n = 90, cypBase) {
  return genTimeline(n, doseStepdown, bridgeStressSD, bridgeBoostSD, cypBase);
}

export function genBridgeTimelineUT(n = 90, cypBase) {
  return genTimeline(n, doseUptitrate, bridgeStressUT, bridgeBoostUT, cypBase);
}

export function genBridgeTimelineUT15w(n = 90, cypBase) {
  return genTimeline(n, doseUptitrate15w, bridgeStressUT15w, bridgeBoostUT15w, cypBase);
}

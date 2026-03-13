import { computeAll, computePD, getDose } from "./pkEngine";

// Bridge starts at D23 (index 22) — when Prozac 20mg was restarted
export const BRIDGE_START = 22;

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
const bridgeStress   = makeBridgeStress(15, 0.80, 5, 4,   2.5);
const bridgeBoost    = makeBridgeBoost(20);

const bridgeStress14 = makeBridgeStress(21, 0.80, 5, 5,   2.5);
const bridgeBoost14  = makeBridgeBoost(26);

const bridgeStressSD = makeBridgeStress(21, 0.73, 5, 4.5, 2.5);
const bridgeBoostSD  = makeBridgeBoost(24);

// ── Timeline generators ──

function genTimeline(n, doseFn, stressFn, boostFn) {
  const data = [];
  for (let i = 0; i <= n; i += 0.5) {
    const result = computeAll(i, doseFn, computePD);
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

export function genBridgeTimeline(n = 90) {
  return genTimeline(n, doseTaper, bridgeStress, bridgeBoost);
}

export function genBridgeTimeline14(n = 90) {
  return genTimeline(n, doseTaper14, bridgeStress14, bridgeBoost14);
}

export function genBridgeTimelineSD(n = 90) {
  return genTimeline(n, doseStepdown, bridgeStressSD, bridgeBoostSD);
}

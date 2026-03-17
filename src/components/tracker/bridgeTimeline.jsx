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

// T15 strategy: alternating P20+T10 / T20 for 14d, then T10/T20 forever (avg T15)
export function doseT15(d) {
  if (d < 0) return [0, 40];
  if (d === 0) return [5, 20];
  if (d <= 7) return [10, 20];
  if (d < BRIDGE_START) return [10, 0];
  const bd = d - BRIDGE_START;
  // Bridge phase: 14 days alternating P20+T10 / T20
  if (bd >= 0 && bd < 14) {
    return (bd % 2 === 0) ? [10, 20] : [20, 0];
  }
  // Maintenance: T10/T20 alternating forever (avg T15), no P20
  return (bd % 2 === 0) ? [10, 0] : [20, 0];
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

export function genBridgeTimelineT15(n = 90) {
  const data = [];
  for (let i = 0; i <= n; i += 0.5) {
    const result = computeAll(i, doseT15, computePD);
    const da = i - (BRIDGE_START + 14);
    const extra = da <= 0 ? 0 : Math.max(0, 0.5 * Math.exp(-0.5 * ((da - 4) / 5) ** 2)) * (1 / (1 + Math.exp(-2.5 * (da - 1))));
    const boost = (result.fE > 2 && i >= BRIDGE_START && i < BRIDGE_START + 20)
      ? Math.min(8, (result.fE / 20) * 8) : 0;
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

export function genBridgeTimeline14(n = 90) {
  const data = [];
  for (let i = 0; i <= n; i += 0.5) {
    const result = computeAll(i, doseTaper14, computePD);
    const da = i - (BRIDGE_START + 21);
    const extra = da <= 0 ? 0 : Math.max(0, 0.6 * Math.exp(-0.5 * ((da - 5) / 5) ** 2)) * (1 / (1 + Math.exp(-2.5 * (da - 1))));
    const boost = (result.fE > 2 && i >= BRIDGE_START && i < BRIDGE_START + 26)
      ? Math.min(8, (result.fE / 20) * 8) : 0;
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

// Bridge stress (post-taper dip)
function bridgeStress(day) {
  const da = day - (BRIDGE_START + 15);
  if (da <= 0) return 0;
  return Math.max(0, 0.8 * Math.exp(-0.5 * ((da - 5) / 4) ** 2)) * (1 / (1 + Math.exp(-2.5 * (da - 1))));
}

// Bridge boost from residual fluoxetine coverage
function bridgeBoost(day, fE) {
  return (fE > 2 && day >= BRIDGE_START && day < BRIDGE_START + 20)
    ? Math.min(8, (fE / 20) * 8) : 0;
}

// Generate full bridge timeline with all metrics
export function genBridgeTimeline(n = 90) {
  const data = [];
  for (let i = 0; i <= n; i += 0.5) {
    const result = computeAll(i, doseTaper, computePD);
    const extra = bridgeStress(i);
    const boost = bridgeBoost(i, result.fE);
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
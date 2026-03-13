import React from "react";

/**
 * Invisible wider hit-area rendered via Recharts <Customized> 
 * so the user can actually click the thin "Today" dashed line.
 */
export default function TodayHitArea({ xAxisMap, yAxisMap, tN, onToggle }) {
  if (!xAxisMap || !yAxisMap) return null;
  const xAxis = Object.values(xAxisMap)[0];
  const yAxis = Object.values(yAxisMap)[0];
  if (!xAxis || !yAxis) return null;

  const x = xAxis.scale(tN);
  if (x == null || isNaN(x)) return null;

  const y1 = yAxis.y;
  const y2 = yAxis.y + yAxis.height;

  return (
    <rect
      x={x - 10}
      y={y1}
      width={20}
      height={y2 - y1}
      fill="transparent"
      style={{ cursor: "pointer" }}
      onClick={onToggle}
    />
  );
}
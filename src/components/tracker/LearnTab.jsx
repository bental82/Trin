import React, { useState } from "react";
import { CONCEPTS, CATS, TV } from "./concepts";


function DeepDive({ selC, setSelC, tN, liveTV, onBack }) {
  const concept = CONCEPTS[selC];
  return (
    <div>
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "#f8fafc", padding: "10px 0 8px",
      }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 20px", borderRadius: 10, border: "1px solid #bae6fd",
          background: "#f0f9ff", cursor: "pointer", fontSize: 14, fontWeight: 700,
          color: "#0891b2", minHeight: 44,
        }}>
          ← Back to Map
        </button>
      </div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 12 }}>
        {Object.entries(CONCEPTS).map(([key, c]) => (
          <button key={key} onClick={() => setSelC(key)} style={{
            padding: "4px 9px", borderRadius: 14, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: selC === key ? 700 : 400,
            background: selC === key ? c.color + "18" : "#f1f5f9",
            color: selC === key ? c.color : "#64748b",
          }}>
            {c.emoji} {c.short}
          </button>
        ))}
      </div>

      <div style={{ padding: 18, borderRadius: 12, background: concept.color + "06", border: "1px solid " + concept.color + "20" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 34 }}>{concept.emoji}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: concept.color }}>{concept.short}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{concept.name}</div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>D{tN + 1} Progress</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: concept.color }}>{liveTV[selC]}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: concept.color + "12" }}>
          <div style={{ height: "100%", borderRadius: 3, background: concept.color, width: liveTV[selC] + "%" }} />
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>⏱ {concept.time}</div>
        </div>

        {[["WHAT IT IS", concept.simple], ["SIMPLE ANALOGY", concept.analogy], ["YOUR STATUS NOW", concept.status]].map(([t, c2], i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: concept.color, marginBottom: 3 }}>{t}</div>
            <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.8 }}>{c2}</div>
          </div>
        ))}

        {concept.feeds && concept.feeds.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: concept.color, marginBottom: 5 }}>ENABLES NEXT →</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {concept.feeds.map(f => {
                const fc = CONCEPTS[f];
                if (!fc) return null;
                return (
                  <button key={f} onClick={() => setSelC(f)} style={{
                    padding: "4px 9px", borderRadius: 7, cursor: "pointer",
                    border: "1px solid " + fc.color + "25", background: fc.color + "08",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ fontSize: 13 }}>{fc.emoji}</span>
                    <span style={{ fontSize: 12, color: fc.color, fontWeight: 600 }}>{fc.short}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {concept.subconcepts && concept.subconcepts.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: concept.color, marginBottom: 8 }}>WHAT'S INSIDE ↓</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {concept.subconcepts.map(sk => {
                const sc = CONCEPTS[sk];
                if (!sc) return null;
                return (
                  <button key={sk} onClick={() => setSelC(sk)} style={{
                    padding: "10px 12px", borderRadius: 9, cursor: "pointer", textAlign: "left",
                    border: "1px solid " + sc.color + "25", background: sc.color + "06",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>{sc.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: sc.color }}>{sc.short}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{sc.name}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: sc.color }}>{liveTV[sk] || 0}%</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConceptMap({ setSelC, setLv, tN, liveTV }) {
  return (
    <div>
      <div style={{ padding: "14px 16px", marginBottom: 12, borderRadius: 11, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 14, lineHeight: 1.8, color: "#334155" }}>
        <b style={{ color: "#22c55e", fontSize: 14 }}>The Big Picture: </b>
        Recovery is a relay race.{" "}
        <b style={{ color: "#06b6d4" }}>Leg 1 (PK)</b>: drug arrives — days.{" "}
        <b style={{ color: "#a78bfa" }}>Leg 2 (PD)</b>: brain adapts — weeks.{" "}
        <b style={{ color: "#22c55e" }}>Leg 3</b>: structural repair — months. You're handing off from Leg 1 to Leg 2.
      </div>

      {Object.entries(CATS).map(([ck, cat]) => {
        const items = Object.entries(CONCEPTS).filter(([k, c]) => c.cat === ck && !Object.values(CONCEPTS).some(parent => parent.subconcepts && parent.subconcepts.includes(k)));
        if (!items.length) return null;
        return (
          <div key={ck} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "0 4px" }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: cat.c }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", color: cat.c }}>{cat.l}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{cat.s}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", padding: "0 4px" }}>
              {items.map(([key, c]) => (
                <button key={key} onClick={() => { setSelC(key); setLv("deep"); }} style={{
                  padding: "8px 12px", borderRadius: 9, cursor: "pointer",
                  border: "1px solid " + c.color + "30", background: "#ffffff",
                  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3,
                  minWidth: 130, maxWidth: 190, flex: "1 1 130px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                    <span style={{ fontSize: 16 }}>{c.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.color, flex: 1, textAlign: "left" }}>{c.short}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", textAlign: "left" }}>{c.name}</div>
                  <div style={{ width: "100%", height: 3, borderRadius: 2, background: c.color + "12" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: c.color, width: (liveTV[key] || 0) + "%" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>D{tN + 1}: {liveTV[key] || 0}%</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Flow diagram */}
      <div style={{ marginTop: 8, padding: 16, borderRadius: 11, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".1em", color: "#0891b2", marginBottom: 12 }}>HOW THEY CONNECT</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 500 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ padding: "5px 10px", borderRadius: 7, background: "#a78bfa12", border: "1px solid #a78bfa30", fontSize: 13, color: "#a78bfa", fontWeight: 700 }}>🚰 CYP2D6</span>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>→</span>
            <span style={{ padding: "5px 10px", borderRadius: 7, background: "#f0abfc12", border: "1px solid #f0abfc30", fontSize: 13 }}>
              <b style={{ color: "#f0abfc" }}>🅿️ SERT</b> + <b style={{ color: "#06b6d4" }}>🔑 Receptors</b>
            </span>
          </div>
          <div style={{ padding: "2px 0 2px 36px", color: "#334155", fontSize: 14 }}>↓ <span style={{ fontSize: 12, color: "#475569" }}>serotonin + multimodal</span></div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ padding: "5px 10px", borderRadius: 7, background: "#22d3ee12", border: "1px solid #22d3ee30", fontSize: 13, color: "#22d3ee", fontWeight: 700 }}>🛑 Brake Off</span>
            <span style={{ color: "#94a3b8" }}>+</span>
            <span style={{ padding: "5px 10px", borderRadius: 7, background: "#f9731612", border: "1px solid #f9731630", fontSize: 13, color: "#f97316", fontWeight: 700 }}>🔊 Unmuted</span>
          </div>
          <div style={{ padding: "2px 0 2px 36px", color: "#334155", fontSize: 14 }}>↓ <span style={{ fontSize: 12, color: "#475569" }}>early PD</span></div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ padding: "5px 10px", borderRadius: 7, background: "#818cf812", border: "1px solid #818cf830", fontSize: 13, color: "#818cf8", fontWeight: 700 }}>🌙 Sleep</span>
            <span style={{ color: "#94a3b8" }}>+</span>
            <span style={{ padding: "5px 10px", borderRadius: 7, background: "#22c55e12", border: "1px solid #22c55e30", fontSize: 13, color: "#22c55e", fontWeight: 700 }}>🌱 BDNF</span>
          </div>
          <div style={{ padding: "2px 0 2px 36px", color: "#334155", fontSize: 14 }}>↓ <span style={{ fontSize: 12, color: "#475569" }}>structural repair</span></div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ padding: "5px 10px", borderRadius: 7, background: "#fbbf2412", border: "1px solid #fbbf2430", fontSize: 13, color: "#fbbf24", fontWeight: 700 }}>🧩 DMN</span>
            <span style={{ color: "#94a3b8" }}>+</span>
            <span style={{ padding: "5px 10px", borderRadius: 7, background: "#fb718512", border: "1px solid #fb718530", fontSize: 13, color: "#fb7185", fontWeight: 700 }}>🧹 Glymphatic</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LearnTab({ tN, tW }) {
  const [lv, setLv] = useState("map");
  const [selC, setSelC] = useState("sert");

  // Build live progress values from tW (today's computed PK/PD data)
  const liveTV = tW ? {
    sert:       Math.round(tW.cS),
    receptors:  Math.round(Math.min(95, tW.cS * 1.05)),
    cyp2d6:     Math.round(Math.min(100, ((tW.cyp - 1) / 2) * 100)),
    autorecept: Math.round(tW.autorecept),
    gaba:       Math.round(tW.gabaDisinhib),
    circadian:  Math.round(tW.circadian),
    bdnf:       Math.round(tW.bdnf),
    dmn:        Math.round(tW.dmn),
    glymphatic: Math.round(tW.glymphatic),
    stress:     Math.round(tW.stressScore),
    norfluox:   Math.round(Math.max(0, 100 - (tW.stressScore * 1.2))),
    recbalance: Math.round(Math.max(0, Math.min(100, tW.autorecept * 0.8))),
    gabalag:    Math.round(tW.gabaDisinhib),
    circDisrupt:Math.round(tW.circadian),
    psychAdj:   Math.round(Math.max(0, 100 - tW.stressScore)),
  } : TV;

  return (
    <div>
      <div style={{ padding: "0 6px", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#0f172a" }}>📖 Learn</h2>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
          {lv === "map" ? "Tap a concept to explore" : CONCEPTS[selC]?.short}
        </p>
      </div>

      {lv === "map" ? (
        <ConceptMap setSelC={setSelC} setLv={setLv} tN={tN} liveTV={liveTV} />
      ) : (
        <DeepDive selC={selC} setSelC={setSelC} tN={tN} liveTV={liveTV} onBack={() => setLv("map")} />
      )}
    </div>
  );
}
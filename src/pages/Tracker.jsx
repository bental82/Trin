import React, { useState, useMemo } from "react";
import { genTimeline, computeAll, getDose, computePD, TODAY_N } from "@/components/tracker/pkEngine";
import { genBridgeTimeline, genBridgeTimeline14, genBridgeTimelineSD, genBridgeTimelineUT, BRIDGE_START } from "@/components/tracker/bridgeTimeline";
import TodayTab      from "@/components/tracker/TodayTab";
import WellbeingTab  from "@/components/tracker/WellbeingTab";
import PDTab         from "@/components/tracker/PDTab";
import SERTTab       from "@/components/tracker/SERTTab";
import ReceptorTab   from "@/components/tracker/ReceptorTab";
import PlasmaTab     from "@/components/tracker/PlasmaTab";
import LearnTab      from "@/components/tracker/LearnTab";
import DiaryTab      from "@/components/tracker/DiaryTab";
import GlossaryTab   from "@/components/tracker/GlossaryTab";
import BridgeTab     from "@/components/tracker/BridgeTab";
import { Pill } from "lucide-react";

const DATA_TABS = [
  { id: "wellbeing",label: "🧠 Wellbeing" },
  { id: "pd",       label: "PD Curves"   },
  { id: "sert",     label: "SERT"        },
  { id: "rec",      label: "5-HT"        },
  { id: "plasma",   label: "Plasma"      },
  { id: "bridge",   label: "🌉 Bridge"   },
];

const INFO_TABS = [
  { id: "learn",    label: "📖 Learn"    },
  { id: "glossary", label: "🔤 Glossary" },
  { id: "diary",    label: "📝 Diary"    },
];

export default function Tracker() {
  const [tab,      setTab]      = useState("today");
  const [showRx,   setShowRx]   = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [tabGroup, setTabGroup] = useState("data"); // "data" | "info"
  const [viewDay,  setViewDay]  = useState(TODAY_N);
  const [strategy, setStrategy] = useState("alt14");  // "alt8" | "alt14" | "stepdown" | "uptitrate"

  const tl     = useMemo(() => genTimeline(90), []);
  const tlBridge = useMemo(() => genBridgeTimeline(90), []);
  const tlBridge14 = useMemo(() => genBridgeTimeline14(90), []);
  const tlBridgeSD = useMemo(() => genBridgeTimelineSD(90), []);
  const tlBridgeUT = useMemo(() => genBridgeTimelineUT(90), []);
  const tlByStrategy = { alt8: tlBridge, alt14: tlBridge14, stepdown: tlBridgeSD, uptitrate: tlBridgeUT };
  const tlActive = tlByStrategy[strategy] || tlBridge14;
  const tN     = viewDay;
  const tW     = useMemo(() => computeAll(tN), [tN]);
  const peakWB = useMemo(() => tl.reduce((b, d) => d.wellbeing > b.wellbeing ? d : b, tl[0]), [tl]);
  const tlM    = useMemo(() => tl.filter(d => d.day % 1 === 0), [tl]);
  const day1WB = useMemo(() => computeAll(0).wellbeing, []);

  const altDaysWB = useMemo(() => {
    const bd = tlActive.find(d => d.day === tN);
    return bd ? bd.wellbeing : 0;
  }, [tN, tlActive]);

  const statCards = [
    {
      label: "SERT Occupancy",
      value: tW.cS.toFixed(0) + "%",
      color: "#f0abfc",
      icon: "🅿️",
      detail: "Combined vortioxetine + residual fluoxetine occupancy of serotonin transporter. Well above the 50% minimum therapeutic threshold.",
    },
    {
      label: "PD Maturation",
      value: tW.pdScore.toFixed(0) + "%",
      color: "#a78bfa",
      icon: "🧬",
      detail: "Weighted composite of autoreceptor desensitization, GABA disinhibition, circadian remodeling, BDNF, DMN, and glymphatic restoration.",
    },
    {
      label: "Wellbeing Score",
      value: tW.wellbeing.toFixed(1),
      color: "#22c55e",
      icon: "💚",
      detail: `Model projection: PK ceiling × PD access − transition stress. Peak projected at Day ${Math.round(peakWB.day) + 1} (score ${peakWB.wellbeing.toFixed(0)}).`,
    },
    {
      label: "Bridge Wellbeing",
      value: altDaysWB.toFixed(1),
      color: "#0891b2",
      icon: "🌉",
      detail: `Projected wellbeing for selected bridge strategy (${strategy === "alt8" ? "P20+alt 8d" : strategy === "alt14" ? "P20+alt 14d" : strategy === "uptitrate" ? "Uptitrate 15→20" : "Step-down"}).`,
    },
    {
      label: "Transition Stress",
      value: tW.stressScore.toFixed(0),
      color: "#f97316",
      icon: "⚡",
      detail: "Temporary destabilization as norfluoxetine (Prozac metabolite, t½≈9d) clears. Expected peak ~D21-28, then resolves weeks 5-6.",
    },
    {
      label: "CYP2D6 Boost",
      value: tW.cyp.toFixed(2) + "×",
      color: "#818cf8",
      icon: "🚰",
      detail: "Liver enzyme inhibition from Wellbutrin + residual Prozac makes each 10mg vortioxetine act like ~21mg. Will settle to ~2.1× as Prozac clears.",
    },
    {
      label: "BDNF / Neuroplasticity",
      value: tW.bdnf.toFixed(0) + "%",
      color: "#34d399",
      icon: "🌱",
      detail: "Brain-derived neurotrophic factor — the 'grow new wiring' process. Slowest but most powerful. Barely started now; significant changes weeks 4-8.",
    },
    {
      label: "Day 1 Anchor",
      value: day1WB.toFixed(1),
      color: "#94a3b8",
      icon: "⚓",
      detail: `Your modeled wellbeing on Day 1 (Feb 12) was ${day1WB.toFixed(1)}. Use as a baseline to gauge progress.`,
    },
  ];

  const activeGroup = tab === "today" ? "today" : DATA_TABS.some(t => t.id === tab) ? "data" : "info";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      color: "#0f172a",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      fontSize: 16,
    }}>
      {/* HEADER */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "20px 20px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,.06)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#06b6d4", boxShadow: "0 0 10px rgba(6,182,212,.4)" }} />
              <h1 style={{
                margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-.02em",
                background: "linear-gradient(135deg,#0891b2,#06b6d4,#7c3aed)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Trintellix PK+PD
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              {(() => {
                const d = new Date("2026-02-12");
                d.setDate(d.getDate() + viewDay);
                return d.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
              })()} · D{viewDay + 1} · Trintellix 10mg · Wellbutrin
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={() => setShowRx(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#f0f9ff", border: "1px solid #bae6fd",
                borderRadius: 8, padding: "7px 12px", cursor: "pointer",
                color: "#0891b2", fontSize: 12, fontWeight: 600,
              }}
            >
              <Pill size={16} /> Rx
            </button>
            <button
              onClick={() => setShowHelp(o => !o)}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "#f0f9ff", border: "1px solid #bae6fd",
                cursor: "pointer", color: "#0891b2", fontSize: 14, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >?</button>
          </div>
        </div>

        {/* Rx Panel */}
        {showRx && (
          <div style={{ marginTop: 14, padding: 16, background: "#f0f9ff", borderRadius: 12, border: "1px solid #bae6fd" }}>
            <div style={{ fontWeight: 700, color: "#0891b2", marginBottom: 8, fontSize: 14 }}>DOSING SCHEDULE</div>
            {[
              ["Before Feb 12", "—",    "40mg", "Steady state"],
              ["Feb 12 (D0)",   "5mg",  "29mg", "Start"],
              ["Feb 13–18",     "10mg", "29mg", "Overlap"],
              ["Feb 19+",       "10mg", "—",    "Trintellix only"],
            ].map((r, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1.4fr 54px 54px 1fr", gap: 8,
                padding: "5px 0", borderBottom: i < 3 ? "1px solid #e2e8f0" : "none",
                fontSize: 13,
              }}>
                <span style={{ color: "#475569" }}>{r[0]}</span>
                <span style={{ color: "#0891b2", textAlign: "center", fontWeight: 600 }}>{r[1]}</span>
                <span style={{ color: "#f97316", textAlign: "center", fontWeight: 600 }}>{r[2]}</span>
                <span style={{ color: "#64748b" }}>{r[3]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Help Panel */}
        {showHelp && (
          <div style={{ marginTop: 14, padding: 16, background: "#f0f9ff", borderRadius: 12, border: "1px solid #bae6fd", fontSize: 14, lineHeight: 1.8, color: "#334155" }}>
            <b style={{ color: "#0891b2" }}>PK: </b>Michaelis-Menten SERT from PET data (Stenkrona 2013, Areberg 2012). CYP2D6 from Wellbutrin (2.1×) + residual fluoxetine.<br />
            <b style={{ color: "#7c3aed" }}>PD: </b>Sigmoid maturation curves for autoreceptor desensitization, GABAergic disinhibition, BDNF, glymphatic, DMN.<br />
            <b style={{ color: "#16a34a" }}>Wellbeing: </b>(PK ceiling × PD access) − transient stressors.<br />
            <span style={{ color: "#f97316" }}>⚠ Theoretical projection — not validated clinical data.</span>
          </div>
        )}
      </div>

      {/* DAY NAVIGATOR */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        background: "#ffffff", borderBottom: "1px solid #e2e8f0",
        padding: "8px 16px",
      }}>
        <button
          onClick={() => setViewDay(d => Math.max(0, d - 1))}
          disabled={viewDay === 0}
          style={{
            width: 30, height: 30, borderRadius: "50%", border: "1px solid #e2e8f0",
            background: viewDay === 0 ? "#f8fafc" : "#f0f9ff", cursor: viewDay === 0 ? "not-allowed" : "pointer",
            color: viewDay === 0 ? "#cbd5e1" : "#0891b2", fontSize: 16, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >‹</button>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {viewDay === TODAY_N && (
            <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "2px 6px" }}>TODAY</span>
          )}
          {viewDay !== TODAY_N && (
            <button onClick={() => setViewDay(TODAY_N)} style={{
              fontSize: 10, color: "#0891b2", fontWeight: 700,
              background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, padding: "2px 6px",
              cursor: "pointer",
            }}>↩ Today</button>
          )}
          <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
            D{viewDay + 1} · {(() => {
              const d = new Date("2026-02-12");
              d.setDate(d.getDate() + viewDay);
              return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            })()}
          </span>
          {viewDay > TODAY_N && (
            <span style={{ fontSize: 10, color: "#f97316", fontWeight: 700, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 6, padding: "2px 6px" }}>FORECAST</span>
          )}
        </div>

        <button
          onClick={() => setViewDay(d => Math.min(90, d + 1))}
          disabled={viewDay === 90}
          style={{
            width: 30, height: 30, borderRadius: "50%", border: "1px solid #e2e8f0",
            background: viewDay === 90 ? "#f8fafc" : "#f0f9ff", cursor: viewDay === 90 ? "not-allowed" : "pointer",
            color: viewDay === 90 ? "#cbd5e1" : "#0891b2", fontSize: 16, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >›</button>
      </div>

      {/* TAB GROUP SWITCHER */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
      }}>
        {/* Group pills */}
        <div style={{ display: "flex", gap: 6, padding: "10px 16px 0", borderBottom: "1px solid #e2e8f0" }}>
          {/* Today pill */}
          <button
            onClick={() => { setTabGroup("today"); setTab("today"); }}
            style={{
              padding: "6px 14px", borderRadius: "8px 8px 0 0",
              border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700,
              background: tab === "today" ? "#f0fdf4" : "transparent",
              color: tab === "today" ? "#16a34a" : "#64748b",
              borderBottom: tab === "today" ? "2px solid #16a34a" : "2px solid transparent",
            }}
          >
            📊 Today
          </button>
          {[["data", "📈 Charts"], ["info", "📚 Learn"]].map(([g, lbl]) => (
            <button
              key={g}
              onClick={() => {
                setTabGroup(g);
                if (g === "data") setTab("wellbeing");
                else setTab("learn");
              }}
              style={{
                padding: "6px 14px", borderRadius: "8px 8px 0 0",
                border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700,
                background: activeGroup === g && tab !== "today" ? (g === "data" ? "#f0f9ff" : "#f5f3ff") : "transparent",
                color: activeGroup === g && tab !== "today" ? (g === "data" ? "#0891b2" : "#7c3aed") : "#64748b",
                borderBottom: activeGroup === g && tab !== "today" ? `2px solid ${g === "data" ? "#0891b2" : "#7c3aed"}` : "2px solid transparent",
              }}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Sub-tabs — hidden when Today is active */}
        <div style={{
          display: activeGroup === "today" ? "none" : "flex", gap: 2, padding: "8px 16px 0",
          overflowX: "auto", scrollbarWidth: "none",
        }}>
          {(activeGroup === "data" ? DATA_TABS : INFO_TABS).map(({ id, label }) => {
            const isActive = tab === id;
            const ac = activeGroup === "data" ? "#0891b2" : "#7c3aed";
            const bg = activeGroup === "data" ? "#f0f9ff" : "#f5f3ff";
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                padding: "6px 11px", border: "none", cursor: "pointer",
                borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: 600,
                whiteSpace: "nowrap", transition: "all 0.15s ease",
                background: isActive ? bg : "transparent",
                color: isActive ? ac : "#64748b",
                borderBottom: isActive ? `2px solid ${ac}` : "2px solid transparent",
              }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: "16px 12px 32px" }}>
        {tab === "today"    && <TodayTab tN={tN} statCards={statCards} strategy={strategy} setStrategy={setStrategy} />}
        {tab === "wellbeing"&& <WellbeingTab tl={tl} tlM={tlM} tN={tN} peakWB={peakWB} tlBridge={tlActive} strategy={strategy} />}
        {tab === "pd"       && <PDTab tl={tl} tN={tN} tW={tW} />}
        {tab === "sert"     && <SERTTab tl={tl} tN={tN} tlBridge={tlActive} />}
        {tab === "rec"      && <ReceptorTab tl={tl} tN={tN} tlBridge={tlActive} />}
        {tab === "plasma"   && <PlasmaTab tl={tl} tN={tN} tlBridge={tlActive} />}
        {tab === "bridge"   && <BridgeTab />}
        {tab === "learn"    && <LearnTab tN={tN} tW={tW} />}
        {tab === "glossary" && <GlossaryTab />}
        {tab === "diary"    && <DiaryTab />}
      </div>

      {/* FOOTER */}
      <div style={{ padding: "12px 20px 24px", textAlign: "center", fontSize: 10, color: "#94a3b8", borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
        PK: Stenkrona 2013, Areberg 2012/2014 PET data · Theoretical projection — not for clinical decisions
      </div>
    </div>
  );
}
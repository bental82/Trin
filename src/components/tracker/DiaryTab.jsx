import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "trin-pill-diary";
const DAILY_KEY = "trin-daily-checkin";

const DRUGS = [
  { id: "trintellix", label: "Trintellix", color: "#0891b2", doses: ["5mg", "10mg", "15mg", "20mg"] },
  { id: "prozac",     label: "Prozac",     color: "#f97316", doses: ["10mg", "20mg", "40mg"] },
];

const SIDE_EFFECTS = [
  "Nausea", "Headache", "Dizziness", "Insomnia", "Drowsiness",
  "Dry mouth", "Anxiety", "GI issues", "Sweating", "Fatigue",
];

const MOODS = [
  { value: 1, label: "Very low",  color: "#dc2626" },
  { value: 2, label: "Low",       color: "#f97316" },
  { value: 3, label: "Neutral",   color: "#a3a3a3" },
  { value: 4, label: "Good",      color: "#22c55e" },
  { value: 5, label: "Great",     color: "#16a34a" },
];

const START_DATE = new Date("2026-02-12");

function dayToDateStr(dayN) {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + dayN);
  return d.toISOString().slice(0, 10);
}

function dayToLabel(dayN) {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + dayN);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// localStorage helpers
function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveLocal(diary) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diary));
}
function loadDailyLocal() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveDailyLocal(data) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(data));
}

function rowToEntry(row) {
  return {
    id: row.id,
    drug: row.drug,
    dose: row.dose,
  };
}

function rowToDaily(row) {
  return {
    id: row.id,
    mood: row.mood,
    sideEffects: row.side_effects || [],
    notes: row.notes || "",
  };
}

export default function DiaryTab({ tN }) {
  const [entries, setEntries] = useState([]);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(null);
  const [totalStats, setTotalStats] = useState({ entries: 0, days: 0 });

  const dateKey = dayToDateStr(tN);

  // Pill form state
  const [drug, setDrug] = useState("trintellix");
  const [dose, setDose] = useState("");
  const [showPillForm, setShowPillForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);

  // Daily check-in form state
  const [dailyMood, setDailyMood] = useState(3);
  const [dailySE, setDailySE] = useState([]);
  const [dailyNotes, setDailyNotes] = useState("");
  const [showDailyForm, setShowDailyForm] = useState(false);

  // Fetch entries for current day
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch pill entries
      const { data, error } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("date", dateKey)
        .neq("drug", "__daily__")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setEntries(data.map(rowToEntry));

      // Fetch daily check-in
      const { data: dData, error: dErr } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("date", dateKey)
        .eq("drug", "__daily__")
        .limit(1);
      if (dErr) throw dErr;
      setDaily(dData.length > 0 ? rowToDaily(dData[0]) : null);

      setSynced(true);

      // Cache locally
      const local = loadLocal();
      local[dateKey] = data.map(rowToEntry);
      saveLocal(local);
      const dLocal = loadDailyLocal();
      dLocal[dateKey] = dData.length > 0 ? rowToDaily(dData[0]) : null;
      saveDailyLocal(dLocal);
    } catch {
      const local = loadLocal();
      setEntries(local[dateKey] || []);
      const dLocal = loadDailyLocal();
      setDaily(dLocal[dateKey] || null);
      setSynced(false);
    }
    setLoading(false);
  }, [dateKey]);

  const fetchStats = useCallback(async () => {
    try {
      const { count } = await supabase
        .from("diary_entries")
        .select("*", { count: "exact", head: true })
        .neq("drug", "__daily__");
      const { data: dates } = await supabase
        .from("diary_entries")
        .select("date")
        .neq("drug", "__daily__");
      const uniqueDays = new Set(dates?.map(d => d.date)).size;
      setTotalStats({ entries: count || 0, days: uniqueDays });
    } catch {
      const local = loadLocal();
      const totalEntries = Object.values(local).reduce((sum, arr) => sum + arr.length, 0);
      setTotalStats({ entries: totalEntries, days: Object.keys(local).length });
    }
  }, []);

  useEffect(() => { fetchEntries(); fetchStats(); }, [fetchEntries, fetchStats]);

  useEffect(() => {
    const d = DRUGS.find(d => d.id === drug);
    if (d) setDose(d.doses[0]);
  }, [drug]);

  // Pill entry handlers
  const handlePillSubmit = async () => {
    const row = { date: dateKey, drug, dose, time: "00:00", mood: 0, side_effects: [], notes: "" };
    try {
      if (editIdx !== null) {
        const entry = entries[editIdx];
        const { error } = await supabase.from("diary_entries").update({ drug, dose }).eq("id", entry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("diary_entries").insert(row);
        if (error) throw error;
      }
      setSynced(true);
    } catch {
      const local = loadLocal();
      const dayEntries = [...(local[dateKey] || [])];
      const localEntry = { id: editIdx !== null ? entries[editIdx].id : Date.now(), drug, dose };
      if (editIdx !== null) dayEntries[editIdx] = localEntry;
      else dayEntries.push(localEntry);
      local[dateKey] = dayEntries;
      saveLocal(local);
      setSynced(false);
    }
    resetPillForm();
    fetchEntries();
    fetchStats();
  };

  const handlePillDelete = async (idx) => {
    const entry = entries[idx];
    try {
      const { error } = await supabase.from("diary_entries").delete().eq("id", entry.id);
      if (error) throw error;
    } catch {
      const local = loadLocal();
      const dayEntries = [...(local[dateKey] || [])];
      dayEntries.splice(idx, 1);
      if (dayEntries.length === 0) delete local[dateKey];
      else local[dateKey] = dayEntries;
      saveLocal(local);
      setSynced(false);
    }
    fetchEntries();
    fetchStats();
  };

  const handlePillEdit = (idx) => {
    const e = entries[idx];
    setDrug(e.drug);
    setDose(e.dose);
    setEditIdx(idx);
    setShowPillForm(true);
  };

  const resetPillForm = () => {
    setDrug("trintellix");
    setDose(DRUGS[0].doses[0]);
    setShowPillForm(false);
    setEditIdx(null);
  };

  // Daily check-in handlers
  const handleDailySubmit = async () => {
    const row = {
      date: dateKey, drug: "__daily__", dose: "",
      time: "00:00", mood: dailyMood,
      side_effects: dailySE, notes: dailyNotes,
    };
    try {
      if (daily?.id) {
        const { error } = await supabase.from("diary_entries")
          .update({ mood: dailyMood, side_effects: dailySE, notes: dailyNotes })
          .eq("id", daily.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("diary_entries").insert(row);
        if (error) throw error;
      }
      setSynced(true);
    } catch {
      const dLocal = loadDailyLocal();
      dLocal[dateKey] = { id: daily?.id || Date.now(), mood: dailyMood, sideEffects: dailySE, notes: dailyNotes };
      saveDailyLocal(dLocal);
      setSynced(false);
    }
    setShowDailyForm(false);
    fetchEntries();
  };

  const openDailyForm = () => {
    if (daily) {
      setDailyMood(daily.mood);
      setDailySE(daily.sideEffects || []);
      setDailyNotes(daily.notes || "");
    } else {
      setDailyMood(3);
      setDailySE([]);
      setDailyNotes("");
    }
    setShowDailyForm(true);
  };

  const toggleSE = (se) => {
    setDailySE(prev => prev.includes(se) ? prev.filter(s => s !== se) : [...prev, se]);
  };

  const drugInfo = DRUGS.find(d => d.id === drug);

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            Pill Diary · D{tN + 1}
          </h2>
          {synced !== null && (
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
              background: synced ? "#dcfce7" : "#fef3c7",
              color: synced ? "#166534" : "#92400e",
            }}>
              {synced ? "☁ Synced" : "📱 Offline"}
            </span>
          )}
        </div>
        <p style={{ margin: "3px 0 0", fontSize: 14, color: "#64748b" }}>
          {dayToLabel(tN)} · {entries.length} {entries.length === 1 ? "pill" : "pills"} logged
          {totalStats.days > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8" }}>({totalStats.entries} total across {totalStats.days} days)</span>}
        </p>
      </div>

      {loading && (
        <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          Loading...
        </div>
      )}

      {/* Pill entries */}
      {!loading && entries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {entries.map((e, idx) => {
            const di = DRUGS.find(d => d.id === e.drug);
            return (
              <div key={e.id} style={{
                padding: "10px 14px", borderRadius: 10,
                background: "#fff", border: `1px solid ${di?.color || "#e2e8f0"}22`,
                boxShadow: "0 1px 3px rgba(0,0,0,.04)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                    background: di?.color + "18", color: di?.color || "#334155",
                  }}>
                    {di?.label || e.drug}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>{e.dose}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => handlePillEdit(idx)} style={{
                    border: "none", background: "#f1f5f9", borderRadius: 6,
                    padding: "4px 8px", cursor: "pointer", fontSize: 11, color: "#64748b",
                  }}>Edit</button>
                  <button onClick={() => handlePillDelete(idx)} style={{
                    border: "none", background: "#fef2f2", borderRadius: 6,
                    padding: "4px 8px", cursor: "pointer", fontSize: 11, color: "#ef4444",
                  }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && entries.length === 0 && !showPillForm && (
        <div style={{
          padding: 20, borderRadius: 10, background: "#f8fafc",
          border: "1px dashed #cbd5e1", textAlign: "center", marginBottom: 12,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No pills logged today</p>
        </div>
      )}

      {/* Pill log form */}
      {!showPillForm ? (
        <button
          onClick={() => setShowPillForm(true)}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: "1.5px dashed #0891b2", background: "#f0f9ff",
            cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#0891b2",
          }}
        >
          + Log pill
        </button>
      ) : (
        <div style={{
          padding: 16, borderRadius: 12,
          background: "#fff", border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 12 }}>
            {editIdx !== null ? "Edit Pill" : "Log Pill"}
          </div>

          {/* Drug selector */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Drug</label>
            <div style={{ display: "flex", gap: 6 }}>
              {DRUGS.map(d => (
                <button key={d.id} onClick={() => setDrug(d.id)} style={{
                  flex: 1, padding: "8px 6px", borderRadius: 8, cursor: "pointer",
                  border: `1.5px solid ${drug === d.id ? d.color : "#e2e8f0"}`,
                  background: drug === d.id ? d.color + "12" : "#f8fafc",
                  fontSize: 12, fontWeight: 600,
                  color: drug === d.id ? d.color : "#94a3b8",
                }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dose selector */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Dose</label>
            <div style={{ display: "flex", gap: 6 }}>
              {drugInfo?.doses.map(d => (
                <button key={d} onClick={() => setDose(d)} style={{
                  padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1.5px solid ${dose === d ? drugInfo.color : "#e2e8f0"}`,
                  background: dose === d ? drugInfo.color + "12" : "#f8fafc",
                  fontSize: 13, fontWeight: 600,
                  color: dose === d ? drugInfo.color : "#94a3b8",
                }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePillSubmit} style={{
              flex: 1, padding: "10px 16px", borderRadius: 10,
              border: "none", background: "#0891b2", color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              {editIdx !== null ? "Save" : "Log"}
            </button>
            <button onClick={resetPillForm} style={{
              padding: "10px 16px", borderRadius: 10,
              border: "1px solid #e2e8f0", background: "#f8fafc",
              fontSize: 14, fontWeight: 600, color: "#64748b", cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Daily check-in summary */}
      {!loading && daily && !showDailyForm && (
        <div
          onClick={openDailyForm}
          style={{
            padding: "12px 14px", borderRadius: 12, marginTop: 12, cursor: "pointer",
            background: "#f8fafc", border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Daily check-in</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>tap to edit</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {(() => {
              const m = MOODS.find(m => m.value === daily.mood);
              return m ? (
                <span style={{
                  display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                  background: m.color, flexShrink: 0,
                }} />
              ) : null;
            })()}
            <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
              {MOODS.find(m => m.value === daily.mood)?.label || "—"}
            </span>
            {daily.sideEffects?.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {daily.sideEffects.map(se => (
                  <span key={se} style={{
                    fontSize: 10, padding: "2px 6px", borderRadius: 4,
                    background: "#fef3c7", color: "#92400e",
                  }}>{se}</span>
                ))}
              </div>
            )}
          </div>
          {daily.notes && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
              {daily.notes}
            </p>
          )}
        </div>
      )}

      {/* Daily check-in form */}
      {!loading && showDailyForm && (
        <div style={{
          padding: 16, borderRadius: 12, marginTop: 12,
          background: "#fff", border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,.06)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 12 }}>
            Daily Check-in
          </div>

          {/* Mood */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Overall mood</label>
            <div style={{ display: "flex", gap: 4 }}>
              {MOODS.map(m => (
                <button key={m.value} onClick={() => setDailyMood(m.value)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer",
                  border: `1.5px solid ${dailyMood === m.value ? m.color : "#e2e8f0"}`,
                  background: dailyMood === m.value ? m.color + "14" : "#f8fafc",
                  textAlign: "center",
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%", margin: "0 auto 4px",
                    background: dailyMood === m.value ? m.color : "#d1d5db",
                  }} />
                  <div style={{ fontSize: 10, color: dailyMood === m.value ? m.color : "#94a3b8", fontWeight: 600 }}>{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Side effects */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Side effects</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {SIDE_EFFECTS.map(se => {
                const active = dailySE.includes(se);
                return (
                  <button key={se} onClick={() => toggleSE(se)} style={{
                    padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                    border: `1px solid ${active ? "#f59e0b" : "#e2e8f0"}`,
                    background: active ? "#fef3c7" : "#f8fafc",
                    fontSize: 11, fontWeight: active ? 600 : 400,
                    color: active ? "#92400e" : "#64748b",
                  }}>
                    {se}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Notes</label>
            <textarea
              value={dailyNotes} onChange={e => setDailyNotes(e.target.value)}
              placeholder="How was your day overall..."
              rows={2}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                border: "1px solid #e2e8f0", fontSize: 13, color: "#334155",
                resize: "vertical", boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleDailySubmit} style={{
              flex: 1, padding: "10px 16px", borderRadius: 10,
              border: "none", background: "#334155", color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              {daily ? "Update" : "Save"}
            </button>
            <button onClick={() => setShowDailyForm(false)} style={{
              padding: "10px 16px", borderRadius: 10,
              border: "1px solid #e2e8f0", background: "#f8fafc",
              fontSize: 14, fontWeight: 600, color: "#64748b", cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Prompt to add daily check-in */}
      {!loading && !daily && !showDailyForm && (
        <button
          onClick={openDailyForm}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, marginTop: 12,
            border: "1.5px dashed #94a3b8", background: "#f8fafc",
            cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b",
          }}
        >
          + Daily check-in
        </button>
      )}
    </div>
  );
}

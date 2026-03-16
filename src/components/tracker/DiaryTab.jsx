import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "trin-pill-diary";

const DRUGS = [
  { id: "trintellix", label: "Trintellix", color: "#0891b2", doses: ["5mg", "10mg", "15mg", "20mg"] },
  { id: "wellbutrin", label: "Wellbutrin", color: "#7c3aed", doses: ["150mg", "300mg"] },
  { id: "prozac",     label: "Prozac",     color: "#f97316", doses: ["10mg", "20mg", "40mg"] },
];

const SIDE_EFFECTS = [
  "Nausea", "Headache", "Dizziness", "Insomnia", "Drowsiness",
  "Dry mouth", "Anxiety", "GI issues", "Sweating", "Fatigue",
];

const MOODS = [
  { value: 1, label: "Very low",  emoji: "\u{1F61E}" },
  { value: 2, label: "Low",       emoji: "\u{1F615}" },
  { value: 3, label: "Neutral",   emoji: "\u{1F610}" },
  { value: 4, label: "Good",      emoji: "\u{1F642}" },
  { value: 5, label: "Great",     emoji: "\u{1F60A}" },
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

// localStorage fallback
function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveLocal(diary) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diary));
}

// Convert Supabase row to local entry shape
function rowToEntry(row) {
  return {
    id: row.id,
    drug: row.drug,
    dose: row.dose,
    time: row.time,
    mood: row.mood,
    sideEffects: row.side_effects || [],
    notes: row.notes || "",
  };
}

export default function DiaryTab({ tN }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(null); // null=loading, true=cloud, false=offline
  const [totalStats, setTotalStats] = useState({ entries: 0, days: 0 });

  const dateKey = dayToDateStr(tN);

  // Form state
  const [drug, setDrug] = useState("trintellix");
  const [dose, setDose] = useState("");
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [mood, setMood] = useState(3);
  const [sideEffects, setSideEffects] = useState([]);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);

  // Fetch entries for current day
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("date", dateKey)
        .order("time", { ascending: true });

      if (error) throw error;
      setEntries(data.map(rowToEntry));
      setSynced(true);

      // Also cache to localStorage
      const local = loadLocal();
      local[dateKey] = data.map(rowToEntry);
      saveLocal(local);
    } catch {
      // Fallback to localStorage
      const local = loadLocal();
      setEntries(local[dateKey] || []);
      setSynced(false);
    }
    setLoading(false);
  }, [dateKey]);

  // Fetch total stats
  const fetchStats = useCallback(async () => {
    try {
      const { count } = await supabase
        .from("diary_entries")
        .select("*", { count: "exact", head: true });

      const { data: dates } = await supabase
        .from("diary_entries")
        .select("date");

      const uniqueDays = new Set(dates?.map(d => d.date)).size;
      setTotalStats({ entries: count || 0, days: uniqueDays });
    } catch {
      const local = loadLocal();
      const totalEntries = Object.values(local).reduce((sum, arr) => sum + arr.length, 0);
      setTotalStats({ entries: totalEntries, days: Object.keys(local).length });
    }
  }, []);

  useEffect(() => { fetchEntries(); fetchStats(); }, [fetchEntries, fetchStats]);

  // Reset dose when drug changes
  useEffect(() => {
    const d = DRUGS.find(d => d.id === drug);
    if (d) setDose(d.doses[0]);
  }, [drug]);

  const handleSubmit = async () => {
    const row = {
      date: dateKey,
      drug, dose, time, mood,
      side_effects: sideEffects,
      notes,
    };

    try {
      if (editIdx !== null) {
        const entry = entries[editIdx];
        const { error } = await supabase
          .from("diary_entries")
          .update(row)
          .eq("id", entry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("diary_entries")
          .insert(row);
        if (error) throw error;
      }
      setSynced(true);
    } catch {
      // Offline fallback: save to localStorage
      const local = loadLocal();
      const dayEntries = [...(local[dateKey] || [])];
      const localEntry = { id: editIdx !== null ? entries[editIdx].id : Date.now(), drug, dose, time, mood, sideEffects, notes };
      if (editIdx !== null) {
        dayEntries[editIdx] = localEntry;
      } else {
        dayEntries.push(localEntry);
      }
      local[dateKey] = dayEntries;
      saveLocal(local);
      setSynced(false);
    }

    resetForm();
    fetchEntries();
    fetchStats();
  };

  const handleDelete = async (idx) => {
    const entry = entries[idx];
    try {
      const { error } = await supabase
        .from("diary_entries")
        .delete()
        .eq("id", entry.id);
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

  const handleEdit = (idx) => {
    const e = entries[idx];
    setDrug(e.drug);
    setDose(e.dose);
    setTime(e.time);
    setMood(e.mood);
    setSideEffects(e.sideEffects || []);
    setNotes(e.notes || "");
    setEditIdx(idx);
    setShowForm(true);
  };

  const resetForm = () => {
    setDrug("trintellix");
    setDose(DRUGS[0].doses[0]);
    const now = new Date();
    setTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setMood(3);
    setSideEffects([]);
    setNotes("");
    setShowForm(false);
    setEditIdx(null);
  };

  const toggleSE = (se) => {
    setSideEffects(prev => prev.includes(se) ? prev.filter(s => s !== se) : [...prev, se]);
  };

  const drugInfo = DRUGS.find(d => d.id === drug);

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            Pill Diary \u00B7 D{tN + 1}
          </h2>
          {synced !== null && (
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
              background: synced ? "#dcfce7" : "#fef3c7",
              color: synced ? "#166534" : "#92400e",
            }}>
              {synced ? "\u2601 Synced" : "\u{1F4F1} Offline"}
            </span>
          )}
        </div>
        <p style={{ margin: "3px 0 0", fontSize: 14, color: "#64748b" }}>
          {dayToLabel(tN)} \u00B7 {entries.length} {entries.length === 1 ? "entry" : "entries"}
          {totalStats.days > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8" }}>({totalStats.entries} total across {totalStats.days} days)</span>}
        </p>
      </div>

      {loading && (
        <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          Loading...
        </div>
      )}

      {/* Entries for selected day */}
      {!loading && entries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {entries.map((e, idx) => {
            const di = DRUGS.find(d => d.id === e.drug);
            const moodInfo = MOODS.find(m => m.value === e.mood);
            return (
              <div key={e.id} style={{
                padding: "12px 14px", borderRadius: 12,
                background: "#fff", border: `1px solid ${di?.color || "#e2e8f0"}22`,
                boxShadow: "0 1px 3px rgba(0,0,0,.04)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                      background: di?.color + "18", color: di?.color || "#334155",
                    }}>
                      {di?.label || e.drug}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>{e.dose}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{e.time}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleEdit(idx)} style={{
                      border: "none", background: "#f1f5f9", borderRadius: 6,
                      padding: "4px 8px", cursor: "pointer", fontSize: 11, color: "#64748b",
                    }}>Edit</button>
                    <button onClick={() => handleDelete(idx)} style={{
                      border: "none", background: "#fef2f2", borderRadius: 6,
                      padding: "4px 8px", cursor: "pointer", fontSize: 11, color: "#ef4444",
                    }}>Delete</button>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  {moodInfo && (
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      {moodInfo.emoji} {moodInfo.label}
                    </span>
                  )}
                  {e.sideEffects?.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {e.sideEffects.map(se => (
                        <span key={se} style={{
                          fontSize: 10, padding: "2px 6px", borderRadius: 4,
                          background: "#fef3c7", color: "#92400e",
                        }}>{se}</span>
                      ))}
                    </div>
                  )}
                </div>
                {e.notes && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                    {e.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && entries.length === 0 && !showForm && (
        <div style={{
          padding: 24, borderRadius: 12, background: "#f8fafc",
          border: "1px dashed #cbd5e1", textAlign: "center", marginBottom: 14,
        }}>
          <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>No entries for this day</p>
        </div>
      )}

      {/* Add / Edit form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
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
            {editIdx !== null ? "Edit Entry" : "Log Pill"}
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
          <div style={{ marginBottom: 12 }}>
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

          {/* Time */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Time</label>
            <input
              type="time" value={time} onChange={e => setTime(e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                fontSize: 14, color: "#334155", width: "100%", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Mood */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Mood</label>
            <div style={{ display: "flex", gap: 4 }}>
              {MOODS.map(m => (
                <button key={m.value} onClick={() => setMood(m.value)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer",
                  border: `1.5px solid ${mood === m.value ? "#22c55e" : "#e2e8f0"}`,
                  background: mood === m.value ? "#f0fdf4" : "#f8fafc",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 18 }}>{m.emoji}</div>
                  <div style={{ fontSize: 9, color: mood === m.value ? "#16a34a" : "#94a3b8", fontWeight: 600, marginTop: 2 }}>{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Side effects */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Side Effects</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {SIDE_EFFECTS.map(se => {
                const active = sideEffects.includes(se);
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
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any observations..."
              rows={2}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                border: "1px solid #e2e8f0", fontSize: 13, color: "#334155",
                resize: "vertical", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSubmit} style={{
              flex: 1, padding: "10px 16px", borderRadius: 10,
              border: "none", background: "#0891b2", color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              {editIdx !== null ? "Save" : "Log"}
            </button>
            <button onClick={resetForm} style={{
              padding: "10px 16px", borderRadius: 10,
              border: "1px solid #e2e8f0", background: "#f8fafc",
              fontSize: 14, fontWeight: 600, color: "#64748b", cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

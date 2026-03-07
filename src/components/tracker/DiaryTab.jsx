import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { MOODS, TAGS } from "./concepts";
import { computeAll, pkCalc, START, TODAY_S } from "./pkEngine";

export default function DiaryTab() {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sel, setSel]           = useState(TODAY_S);
  const [note, setNote]         = useState("");
  const [mood, setMood]         = useState(null);
  const [symp, setSymp]         = useState([]);
  const [saving, setSaving]     = useState(false);

  const dayNum = d => Math.round((new Date(d) - new Date(START)) / 864e5);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.DiaryEntry.list("-entry_date");
      setEntries(data);
    } catch (err) {
      console.error("Failed to load diary entries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!sel || !mood) return;
    setSaving(true);
    try {
      const existing = entries.find(e => e.entry_date === sel);
      if (existing) {
        await base44.entities.DiaryEntry.update(existing.id, { mood, note, symptoms: symp });
      } else {
        await base44.entities.DiaryEntry.create({ entry_date: sel, mood, note, symptoms: symp });
      }
      await load();
      setNote("");
      setMood(null);
      setSymp([]);
    } catch (err) {
      console.error("Failed to save diary entry:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.DiaryEntry.delete(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error("Failed to delete diary entry:", err);
    }
  };

  const sN = sel ? dayNum(sel) : null;

  return (
    <div>
      <div style={{ padding: "0 6px", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#0f172a" }}>📝 Diary</h2>
      </div>

      {/* Entry Form */}
      <div style={{ padding: 12, borderRadius: 10, marginBottom: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <input
            type="date"
            value={sel || TODAY_S}
            onChange={e => setSel(e.target.value)}
            style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, padding: "6px 10px", color: "#0f172a", fontSize: 14 }}
          />
          {sN !== null && sN >= 0 && (
            <span style={{ fontSize: 12, color: "#0891b2" }}>
              D{sN} · SERT {pkCalc(sN).cS.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Mood */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
          {MOODS.map(m => (
            <button key={m.v} onClick={() => setMood(m.v)} style={{
              padding: "6px 9px", borderRadius: 9, cursor: "pointer",
              border: mood === m.v ? "2px solid " + m.c : "2px solid #e2e8f0",
              background: mood === m.v ? m.c + "18" : "#ffffff",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
            }}>
              <span style={{ fontSize: 18 }}>{m.e}</span>
              <span style={{ fontSize: 10, color: mood === m.v ? m.c : "#475569" }}>{m.l}</span>
            </button>
          ))}
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
          {TAGS.map(t => (
            <button key={t} onClick={() => setSymp(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])} style={{
              padding: "5px 12px", borderRadius: 14, cursor: "pointer", fontSize: 13,
              border: symp.includes(t) ? "1px solid #06b6d4" : "1px solid #e2e8f0",
              background: symp.includes(t) ? "rgba(6,182,212,.1)" : "#ffffff",
              color: symp.includes(t) ? "#0891b2" : "#64748b",
            }}>
              {t}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Notes..."
          style={{ width: "100%", minHeight: 60, padding: 10, borderRadius: 7, background: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
        />
        <button
          onClick={handleSave}
          disabled={!mood || saving}
          style={{
            marginTop: 6, padding: "7px 18px", borderRadius: 7,
            cursor: mood && !saving ? "pointer" : "not-allowed",
            background: mood ? "linear-gradient(135deg,#06b6d4,#0891b2)" : "#e2e8f0",
            border: "none", color: mood ? "#fff" : "#94a3b8", fontSize: 14, fontWeight: 600,
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Entries list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 14 }}>Loading…</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 14 }}>No entries yet</div>
      ) : (
        entries.map(entry => {
          const dn = dayNum(entry.entry_date);
          const p = dn >= 0 && dn <= 90 ? computeAll(dn) : null;
          const m = MOODS.find(x => x.v === entry.mood);
          return (
            <div key={entry.id} style={{ padding: "10px 12px", borderRadius: 9, marginBottom: 5, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ fontSize: 24, lineHeight: 1 }}>{m?.e || "?"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    {new Date(entry.entry_date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "rgba(6,182,212,.1)", color: "#0891b2" }}>D{dn}</span>
                  {m && <span style={{ fontSize: 12, color: m.c, fontWeight: 600 }}>{m.l}</span>}
                </div>
                {entry.symptoms?.length > 0 && (
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 2 }}>
                    {entry.symptoms.map(s => (
                      <span key={s} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>{s}</span>
                    ))}
                  </div>
                )}
                {entry.note && <p style={{ margin: "3px 0 0", fontSize: 14, color: "#475569", lineHeight: 1.5 }}>{entry.note}</p>}
                {p && <div style={{ marginTop: 5, fontSize: 12, color: "#94a3b8" }}>SERT {p.cS.toFixed(0)}% · PD {p.pdScore.toFixed(0)}% · WB {p.wellbeing.toFixed(0)}</div>}
              </div>
              <button onClick={() => handleDelete(entry.id)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14, padding: 2 }}>×</button>
            </div>
          );
        })
      )}
    </div>
  );
}
import React, { useState, useMemo } from "react";
import { GLOSSARY } from "./glossary";
import { Search, ChevronDown } from "lucide-react";

export default function GlossaryTab() {
  const [query, setQuery]   = useState("");
  const [open,  setOpen]    = useState(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(g =>
      g.term.toLowerCase().includes(q) ||
      g.full.toLowerCase().includes(q) ||
      g.def.toLowerCase().includes(q) ||
      g.related?.some(r => r.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div>
      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#f8fafc", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: "10px 14px", marginBottom: 16,
      }}>
        <Search size={16} color="#475569" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search terms… e.g. BDNF, synapse, CYP2D6"
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: "#0f172a", fontSize: 14, fontFamily: "inherit",
          }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
        )}
      </div>

      <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
        {filtered.length} term{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Term cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(g => (
          <div
            key={g.term}
            onClick={() => setOpen(open === g.term ? null : g.term)}
            style={{
              borderRadius: 14,
              border: `1px solid ${g.color}25`,
              background: open === g.term ? g.color + "0d" : "#ffffff",
              cursor: "pointer",
              overflow: "hidden",
              transition: "background 0.15s ease",
            }}
          >
            {/* Header row */}
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{g.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: g.color }}>{g.term}</span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{g.full}</span>
                </div>
                {open !== g.term && (
                  <p style={{ margin: "3px 0 0", fontSize: 13, color: "#64748b", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {g.def.slice(0, 70)}…
                  </p>
                )}
              </div>
              <ChevronDown
                size={18}
                color={g.color}
                style={{ transform: open === g.term ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0, opacity: 0.7 }}
              />
            </div>

            {/* Expanded */}
            {open === g.term && (
              <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${g.color}18` }}>
                <p style={{ margin: "12px 0 10px", fontSize: 14, color: "#334155", lineHeight: 1.8, fontFamily: "Georgia, serif" }}>
                  {g.def}
                </p>
                {g.related?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>see also:</span>
                    {g.related.map(r => (
                      <button
                        key={r}
                        onClick={e => { e.stopPropagation(); setQuery(r); setOpen(r); }}
                        style={{
                          padding: "3px 10px", borderRadius: 10, cursor: "pointer",
                          border: `1px solid ${g.color}25`, background: g.color + "0a",
                          color: g.color, fontSize: 13, fontWeight: 600,
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
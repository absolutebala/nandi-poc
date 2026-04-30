import React, { useState, useRef } from "react";
import { C, Badge } from "../App.jsx";
import { extractVimeoId } from "../components/VimeoPlayer.jsx";

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function DropZone({ label, subLabel, accept, onChange }) {
  const [over, setOver] = useState(false);
  return (
    <label
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: "20px 16px", border: `1px dashed ${over ? C.purple : "#ccc"}`,
        borderRadius: 8, cursor: "pointer", color: over ? C.purple : "#888",
        fontSize: 13, transition: "all .15s", background: over ? C.purpleLight : "transparent" }}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onChange({ target: { files: [f] } }); }}
    >
      <input type="file" accept={accept} style={{ display: "none" }} onChange={onChange} />
      <span style={{ fontSize: 22 }}>📎</span>
      <span style={{ fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 11, color: "#bbb" }}>{subLabel}</span>
    </label>
  );
}

function SectionCard({ icon, iconBg, iconColor, title, note, children }) {
  return (
    <div style={{ background: C.bg, border: `0.5px solid ${C.border}`,
      borderRadius: 12, padding: "18px 20px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, background: iconBg, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: iconColor, fontWeight: 700 }}>
          {icon}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</span>
      </div>
      {children}
      {note && <p style={{ fontSize: 11, color: "#aaa", marginTop: 8, lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

export default function UploadPage({ materials, onAdd, onRemove, showToast }) {
  const [vimeoUrl,   setVimeoUrl]   = useState("");
  const [vimeoTitle, setVimeoTitle] = useState("");
  const [urlErr,     setUrlErr]     = useState("");

  const inp = { width: "100%", padding: "9px 12px", border: `0.5px solid ${C.border}`,
    borderRadius: 8, fontSize: 13, outline: "none", color: C.text, background: "#fff" };

  function handleVimeo() {
    const id = extractVimeoId(vimeoUrl);
    if (!id) { setUrlErr("No Vimeo video ID found in that URL"); return; }
    setUrlErr("");
    onAdd({ id: uid(), type: "video", title: vimeoTitle.trim() || "Training Video", vimeoId: id });
    setVimeoUrl(""); setVimeoTitle("");
    showToast("Video added to library");
  }

  function handlePdf(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      onAdd({ id: uid(), type: "pdf", title: file.name, arrayBuffer: ev.target.result });
      showToast("PDF added");
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  function handlePpt(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      onAdd({ id: uid(), type: "ppt", title: file.name, arrayBuffer: ev.target.result });
      showToast("PPT added");
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 57px)", overflow: "hidden" }}>

      {/* Left: Upload forms */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px",
        borderRight: `0.5px solid ${C.border}` }}>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
          Upload training materials. Trainers can <strong>view</strong> but never <strong>download</strong> without a watermark.
        </p>

        <SectionCard icon="▶" iconBg={C.purpleLight} iconColor={C.purple}
          title="Add Vimeo video"
          note="Paste your Vimeo URL. The player embeds with download disabled.">
          <input style={{ ...inp, marginBottom: 8 }} type="text"
            placeholder="Video title (optional)"
            value={vimeoTitle} onChange={e => setVimeoTitle(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inp, flex: 1 }} type="url"
              placeholder="https://vimeo.com/your-video-id"
              value={vimeoUrl}
              onChange={e => { setVimeoUrl(e.target.value); setUrlErr(""); }}
              onKeyDown={e => e.key === "Enter" && handleVimeo()} />
            <button onClick={handleVimeo}
              style={{ padding: "9px 18px", borderRadius: 8, border: `0.5px solid ${C.purpleMid}`,
                background: C.purpleLight, color: C.purple, fontSize: 13, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap" }}>
              Add
            </button>
          </div>
          {urlErr && <p style={{ fontSize: 11, color: "#A32D2D", marginTop: 6 }}>{urlErr}</p>}
        </SectionCard>

        <SectionCard icon="P" iconBg={C.coralLight} iconColor={C.coral}
          title="Upload PDF"
          note="Rendered to canvas via PDF.js. Watermark applied only on download.">
          <DropZone label="Drop PDF here" subLabel="Click to browse · .pdf"
            accept=".pdf" onChange={handlePdf} />
        </SectionCard>

        <SectionCard icon="S" iconBg={C.amberLight} iconColor={C.amber}
          title="Upload PPT / PPTX"
          note="Slides parsed and displayed in-browser. Watermark applied on download.">
          <DropZone label="Drop PPT / PPTX here" subLabel="Click to browse · .ppt .pptx"
            accept=".ppt,.pptx" onChange={handlePpt} />
        </SectionCard>
      </div>

      {/* Right: Library panel */}
      <div style={{ width: 260, flexShrink: 0, overflowY: "auto",
        padding: "24px 16px", background: C.bg }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase",
          letterSpacing: ".05em", marginBottom: 14 }}>
          Library {materials.length > 0 && `· ${materials.length}`}
        </p>

        {materials.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <p style={{ fontSize: 12 }}>No materials yet</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {materials.map(m => (
            <div key={m.id} style={{ background: "#fff", border: `0.5px solid ${C.border}`,
              borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 6 }}>
                <Badge type={m.type} />
                <button onClick={() => onRemove(m.id)}
                  style={{ fontSize: 11, color: "#ccc", background: "none",
                    border: "none", cursor: "pointer", padding: "2px 4px" }}>
                  ✕
                </button>
              </div>
              <p style={{ fontSize: 12, color: C.text, lineHeight: 1.4,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {m.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

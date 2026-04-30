import React, { useState, useRef } from "react";
import { C, Badge } from "../App.jsx";
import { extractVimeoId } from "../components/VimeoPlayer.jsx";
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function DropZone({ label, subLabel, accept, onChange }) {
  const [over, setOver] = useState(false);
  const ref = useRef();

  function handleDrop(e) {
    e.preventDefault(); setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onChange({ target: { files: [file] } });
  }

  return (
    <label
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: "22px 16px", border: `1px dashed ${over ? C.purple : "#ccc"}`,
        borderRadius: 8, cursor: "pointer", color: over ? C.purple : "#888",
        fontSize: 13, transition: "all .15s", background: over ? C.purpleLight : "transparent" }}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
    >
      <input type="file" accept={accept} ref={ref} style={{ display: "none" }} onChange={onChange} />
      <span style={{ fontSize: 24 }}>📎</span>
      <span style={{ fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 11, color: "#bbb" }}>{subLabel}</span>
    </label>
  );
}

function SectionCard({ icon, iconBg, iconColor, title, note, children }) {
  return (
    <div style={{ background: C.bg, border: `0.5px solid ${C.border}`,
      borderRadius: 12, padding: "20px 22px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, background: iconBg, borderRadius: 9,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: iconColor, fontWeight: 700 }}>
          {icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</span>
      </div>
      {children}
      {note && <p style={{ fontSize: 11, color: "#aaa", marginTop: 10, lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

export default function UploadPage({ materials, onAdd, onRemove, showToast }) {
  const [vimeoUrl,   setVimeoUrl]   = useState("");
  const [vimeoTitle, setVimeoTitle] = useState("");
  const [urlErr,     setUrlErr]     = useState("");
  const pdfRef = useRef(); const pptRef = useRef();

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
    onAdd({ id: uid(), type: "ppt", title: file.name });
    showToast("PPT registered");
    e.target.value = "";
  }

  const inp = { width: "100%", padding: "10px 13px", border: `0.5px solid ${C.border}`,
    borderRadius: 8, fontSize: 13, outline: "none", color: C.text, background: "#fff" };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px" }}>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
        Upload training materials. Trainers can <strong>view</strong> but never <strong>download</strong> any content.
      </p>

      {/* ── Vimeo ── */}
      <SectionCard icon="▶" iconBg={C.purpleLight} iconColor={C.purple}
        title="Add Vimeo video"
        note="Paste your private Vimeo video URL. The player embeds with download disabled. Set domain whitelist in Vimeo privacy settings for full protection.">
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
            style={{ padding: "10px 20px", borderRadius: 8, border: `0.5px solid ${C.purpleMid}`,
              background: C.purpleLight, color: C.purple, fontSize: 13, fontWeight: 600,
              cursor: "pointer", whiteSpace: "nowrap" }}>
            Add video
          </button>
        </div>
        {urlErr && <p style={{ fontSize: 11, color: "#A32D2D", marginTop: 6 }}>{urlErr}</p>}
      </SectionCard>

      {/* ── PDF ── */}
      <SectionCard icon="P" iconBg={C.coralLight} iconColor={C.coral}
        title="Upload PDF"
        note="Rendered page-by-page to HTML canvas via PDF.js. Trainer name + date watermark painted on every page. Original file never exposed.">
        <DropZone label="Drop PDF here" subLabel="Click to browse · .pdf"
          accept=".pdf" onChange={handlePdf} />
      </SectionCard>

      {/* ── PPT ── */}
      <SectionCard icon="S" iconBg={C.amberLight} iconColor={C.amber}
        title="Upload PPT / PPTX"
        note="In production, the server converts PPT → PDF via LibreOffice, then delivers it through the same protected canvas viewer. This POC registers the upload and shows the flow.">
        <DropZone label="Drop PPT / PPTX here" subLabel="Click to browse · .ppt .pptx"
          accept=".ppt,.pptx" onChange={handlePpt} />
      </SectionCard>

      {/* ── Library ── */}
      {materials.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase",
            letterSpacing: ".05em", marginBottom: 10 }}>
            Library — {materials.length} item{materials.length !== 1 ? "s" : ""}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {materials.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", background: "#fff",
                border: `0.5px solid ${C.border}`, borderRadius: 9 }}>
                <Badge type={m.type} />
                <span style={{ fontSize: 12, flex: 1, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.text }}>
                  {m.title}
                </span>
                <button onClick={() => onRemove(m.id)}
                  style={{ fontSize: 11, color: "#bbb", background: "none",
                    border: "none", cursor: "pointer", padding: "2px 6px" }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

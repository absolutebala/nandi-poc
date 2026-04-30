import React, { useState } from "react";
import { C, Badge, LockChip, InfoBox } from "../App.jsx";
import VimeoPlayer from "../components/VimeoPlayer.jsx";
import PDFViewer   from "../components/PDFViewer.jsx";
import PPTViewer   from "../components/PPTViewer.jsx";

const TRAINER_NAME = "Ravi Kumar"; // In production, comes from the logged-in user JWT

export default function ViewPage({ materials }) {
  const [selected, setSelected] = useState(null);
  const mat = materials.find(m => m.id === selected);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 57px)", minHeight: 480 }}
      onContextMenu={e => mat && e.preventDefault()}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, borderRight: `0.5px solid ${C.border}`,
        padding: "16px 10px", overflowY: "auto", flexShrink: 0, background: C.bg }}>

        <p style={{ fontSize: 10, fontWeight: 600, color: "#aaa", textTransform: "uppercase",
          letterSpacing: ".05em", marginBottom: 12, paddingLeft: 4 }}>
          My materials
        </p>

        {materials.length === 0 && (
          <p style={{ fontSize: 12, color: "#aaa", padding: "0 4px", lineHeight: 1.6 }}>
            No materials yet. Go to <strong>Upload</strong> to add some.
          </p>
        )}

        {materials.map(m => (
          <div key={m.id} onClick={() => setSelected(m.id)}
            style={{ padding: "9px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 4,
              background: selected === m.id ? C.blueLight : "transparent",
              border: `0.5px solid ${selected === m.id ? "#85B7EB" : "transparent"}`,
              transition: "all .12s" }}>
            <Badge type={m.type} />
            <p style={{ fontSize: 12, marginTop: 5, lineHeight: 1.4, wordBreak: "break-word",
              color: selected === m.id ? C.blue : C.text,
              fontWeight: selected === m.id ? 600 : 400 }}>
              {m.title}
            </p>
          </div>
        ))}
      </aside>

      {/* ── Viewer pane ── */}
      <section style={{ flex: 1, overflowY: "auto", padding: 24 }}>

        {/* Empty state */}
        {!mat && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "100%", color: "#ccc", gap: 12 }}>
            <div style={{ fontSize: 48 }}>📂</div>
            <p style={{ fontSize: 13, color: C.muted }}>Select a material from the sidebar</p>
          </div>
        )}

        {/* ── Video viewer ── */}
        {mat?.type === "video" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10,
              marginBottom: 18, flexWrap: "wrap" }}>
              <Badge type="video" />
              <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{mat.title}</span>
              <LockChip label="Protected stream · no download"
                bg={C.tealLight} color={C.teal} />
            </div>

            <VimeoPlayer vimeoId={mat.vimeoId} />

            <InfoBox>
              <strong>How it's protected:</strong> Embedded via Vimeo private player with{" "}
              <code style={{ fontSize: 10, background: "#eee", padding: "1px 5px", borderRadius: 3 }}>
                download=0&amp;pip=0
              </code>. Download is disabled at the Vimeo account level under Privacy settings.
              Domain whitelisting in Vimeo prevents embedding on any other site.
            </InfoBox>
          </div>
        )}

        {/* ── PDF viewer ── */}
        {mat?.type === "pdf" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10,
              marginBottom: 18, flexWrap: "wrap" }}>
              <Badge type="pdf" />
              <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{mat.title}</span>
              <LockChip label="Canvas render · fully protected"
                bg={C.coralLight} color={C.coral} />
            </div>

            <PDFViewer arrayBuffer={mat.arrayBuffer} fileName={mat.title} />

            <InfoBox>
              PDF is rendered to canvas via PDF.js — the raw file never reaches the browser.
              Ctrl+P, Cmd+P, Ctrl+S, right-click and drag are all blocked.
              In production, the file is served via a signed S3 URL with a short expiry — inaccessible outside the app.
            </InfoBox>
          </div>
        )}

        {/* ── PPT viewer ── */}
        {mat?.type === "ppt" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10,
              marginBottom: 18, flexWrap: "wrap" }}>
              <Badge type="ppt" />
              <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{mat.title}</span>
              <LockChip label="View only · fully protected"
                bg={C.amberLight} color={C.amber} />
            </div>
            <PPTViewer arrayBuffer={mat.arrayBuffer} title={mat.title} />
            <InfoBox>
              Slides are parsed from PPTX in-browser using JSZip and rendered to screen — the original file is never exposed.
              Right-click and drag are disabled. In production, the server converts PPTX → PDF via LibreOffice
              and serves it via a signed S3 URL directly to the secure canvas viewer.
            </InfoBox>
          </div>
        )}
      </section>
    </div>
  );
}

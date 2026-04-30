import React, { useState } from "react";
import { C, Badge, LockChip, InfoBox } from "../App.jsx";
import VimeoPlayer from "../components/VimeoPlayer.jsx";
import PDFViewer   from "../components/PDFViewer.jsx";

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
              <LockChip label="Watermarked · canvas · no download"
                bg={C.coralLight} color={C.coral} />
            </div>

            <PDFViewer arrayBuffer={mat.arrayBuffer} trainerName={TRAINER_NAME} />

            <InfoBox>
              <strong>How it's protected:</strong> Rendered page-by-page to an HTML canvas via PDF.js.
              The original PDF binary is never exposed — only canvas pixels.
              Watermark (trainer name + date) is painted directly onto the canvas on every page.
              Right-click, drag and context menu are disabled.{" "}
              <strong>In production:</strong> the file lives in a private S3 bucket, served via a
              short-lived signed URL, and the watermark is injected server-side before delivery.
            </InfoBox>
          </div>
        )}

        {/* ── PPT info ── */}
        {mat?.type === "ppt" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10,
              marginBottom: 18, flexWrap: "wrap" }}>
              <Badge type="ppt" />
              <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{mat.title}</span>
              <LockChip label="Server-side conversion in production"
                bg={C.amberLight} color={C.amber} />
            </div>

            <div style={{ padding: "32px 24px", textAlign: "center",
              background: C.bg, borderRadius: 12, border: `0.5px solid ${C.border}` }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>📊</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>
                {mat.title}
              </p>
              <p style={{ fontSize: 13, color: C.muted, maxWidth: 440,
                margin: "0 auto 24px", lineHeight: 1.7 }}>
                PPT/PPTX files are converted server-side to a protected PDF, then delivered
                through the same watermarked canvas viewer — with download completely disabled.
              </p>

              {/* Production flow steps */}
              <div style={{ display: "inline-flex", flexDirection: "column", gap: 8,
                textAlign: "left", background: "#fff", border: `0.5px solid ${C.border}`,
                borderRadius: 10, padding: "16px 22px" }}>
                {[
                  ["1", "PPT uploaded to private S3 bucket"],
                  ["2", "Server converts PPT → PDF (LibreOffice)"],
                  ["3", "Original PPT permanently discarded"],
                  ["4", "PDF served via signed URL (30 min TTL)"],
                  ["5", "Canvas viewer renders with trainer watermark"],
                ].map(([n, label]) => (
                  <div key={n} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%",
                      background: C.tealLight, color: C.teal, fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0 }}>
                      {n}
                    </span>
                    <span style={{ fontSize: 12, color: C.text }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

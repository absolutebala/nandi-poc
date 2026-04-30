import React from "react";
import { C } from "../App.jsx";

const BLOCKED = [
  { action: "Cmd / Ctrl + P",               detail: "Print dialog — blocked, security alert shown" },
  { action: "Cmd / Ctrl + S",               detail: "Save page — blocked, security alert shown" },
  { action: "Cmd / Ctrl + U",               detail: "View page source — blocked, security alert shown" },
  { action: "Cmd / Ctrl + Shift + I / J / C", detail: "Browser dev tools — blocked, security alert shown" },
  { action: "F12",                           detail: "Dev tools shortcut — blocked, security alert shown" },
  { action: "Right-click anywhere",          detail: "Context menu — blocked, security alert shown" },
  { action: "Ctrl / Cmd + C  (copy)",        detail: "Clipboard copy — blocked, security alert shown" },
  { action: "Ctrl / Cmd + A  (select all)",  detail: "Text selection — blocked, security alert shown" },
  { action: "Drag & drop content",           detail: "Drag to desktop or other app — blocked" },
  { action: "Print via browser menu",        detail: "Browser File → Print — page hidden, protection message shown instead" },
  { action: "window.print() from console",   detail: "Programmatic print call — intercepted, security alert shown" },
  { action: "Explicit download button",      detail: "Removed entirely — no download option exposed in UI" },
  { action: "Vimeo download button",         detail: "Disabled at Vimeo account level + embed parameter download=0" },
  { action: "PDF direct file access",        detail: "File never sent to browser — rendered to canvas pixels only" },
];

const CANNOT = [
  { action: "Cmd+Shift+3 / 4  (macOS screenshot)", detail: "OS-level capture — no browser API can intercept this" },
  { action: "Print Screen key  (Windows / Linux)",  detail: "OS-level capture — cannot be blocked by any web app" },
  { action: "QuickTime / OBS screen recording",     detail: "OS-level recording — no browser API can detect or stop this" },
  { action: "Physical camera pointed at screen",    detail: "Physical world — outside any software control" },
  { action: "Dev tools opened before page load",    detail: "Browser state before JS runs — cannot be intercepted" },
  { action: "Screen capture via mobile phone",      detail: "External device — beyond any software protection" },
];

const PRODUCTION = [
  { label: "Video — DRM",           detail: "Vimeo Enterprise / OTT with Widevine + FairPlay DRM prevents OS-level screen capture of video on supported devices." },
  { label: "PDF — Server watermark", detail: "Every PDF is watermarked server-side with the trainer's name, email and date before delivery. The original file never reaches the browser." },
  { label: "PDF — Signed S3 URL",   detail: "Files served via time-limited signed S3 URLs (30 min TTL). The URL expires and cannot be reused." },
  { label: "PPT — Converted",       detail: "PPT/PPTX converted server-side to protected PDF via LibreOffice. Original file discarded." },
  { label: "Password encryption",   detail: "Downloaded files can be password-encrypted server-side using qpdf / ghostscript before delivery." },
  { label: "Audit logging",         detail: "Every view and download attempt logged with trainer ID, timestamp and IP address for compliance." },
];

function Section({ title, accent, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 4, height: 20, background: accent, borderRadius: 2 }} />
        <h2 style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Row({ icon, iconBg, action, detail, last }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr",
      gap: 0, borderBottom: last ? "none" : `0.5px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8,
        padding: "11px 14px", background: iconBg }}>
        <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>
          {action}
        </span>
      </div>
      <div style={{ padding: "11px 16px", display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{detail}</span>
      </div>
    </div>
  );
}

function InfoRow({ label, detail, last }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr",
      borderBottom: last ? "none" : `0.5px solid ${C.border}` }}>
      <div style={{ padding: "11px 14px", background: "#F0EEF9" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.purple }}>{label}</span>
      </div>
      <div style={{ padding: "11px 16px" }}>
        <span style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{detail}</span>
      </div>
    </div>
  );
}

function Table({ children }) {
  return (
    <div style={{ border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      {children}
    </div>
  );
}

export default function ConditionsPage() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 28px",
      overflowY: "auto", height: "calc(100vh - 57px)", overflowX: "hidden" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 38, height: 38, background: C.purpleLight, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            🔒
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
              Security conditions
            </h1>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              Nandi Foundation · Material protection POC
            </p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginTop: 12,
          padding: "12px 16px", background: C.purpleLight, borderRadius: 8,
          borderLeft: `3px solid ${C.purple}` }}>
          This document outlines every protection mechanism implemented, the known browser limitations,
          and what additional controls are applied in the production backend.
        </p>
      </div>

      {/* Blocked */}
      <Section title="Blocked — security alert shown to user" accent="#1D9E75">
        <Table>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr",
            background: "#1D9E75", padding: "9px 14px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff",
              textTransform: "uppercase", letterSpacing: ".05em" }}>Action / attack</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff",
              textTransform: "uppercase", letterSpacing: ".05em", paddingLeft: 16 }}>
              What happens
            </span>
          </div>
          {BLOCKED.map((r, i) => (
            <Row key={i} icon="✅" iconBg={i % 2 === 0 ? "#fff" : "#F9F9F7"}
              action={r.action} detail={r.detail} last={i === BLOCKED.length - 1} />
          ))}
        </Table>
      </Section>

      {/* Cannot block */}
      <Section title="Cannot be blocked — browser-level limitation" accent="#A32D2D">
        <div style={{ padding: "10px 14px", background: "#FCEBEB",
          borderRadius: 8, marginBottom: 12, fontSize: 12, color: "#A32D2D",
          lineHeight: 1.6, borderLeft: "3px solid #A32D2D" }}>
          These are OS-level actions that no browser-based application — including Netflix,
          Disney+, or any major streaming platform — can fully prevent on desktop. The only
          solution is OS-level DRM (see Production controls below).
        </div>
        <Table>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr",
            background: "#A32D2D", padding: "9px 14px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff",
              textTransform: "uppercase", letterSpacing: ".05em" }}>Action / attack</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff",
              textTransform: "uppercase", letterSpacing: ".05em", paddingLeft: 16 }}>
              Why it cannot be blocked
            </span>
          </div>
          {CANNOT.map((r, i) => (
            <Row key={i} icon="⚠️" iconBg={i % 2 === 0 ? "#fff" : "#F9F9F7"}
              action={r.action} detail={r.detail} last={i === CANNOT.length - 1} />
          ))}
        </Table>
      </Section>

      {/* Production controls */}
      <Section title="Production controls — applied in the real backend" accent={C.purple}>
        <Table>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr",
            background: C.purple, padding: "9px 14px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff",
              textTransform: "uppercase", letterSpacing: ".05em" }}>Control</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff",
              textTransform: "uppercase", letterSpacing: ".05em", paddingLeft: 16 }}>
              How it works
            </span>
          </div>
          {PRODUCTION.map((r, i) => (
            <InfoRow key={i} label={r.label} detail={r.detail}
              last={i === PRODUCTION.length - 1} />
          ))}
        </Table>
      </Section>

      {/* Footer note */}
      <div style={{ padding: "14px 16px", background: C.bg, border: `0.5px solid ${C.border}`,
        borderRadius: 8, fontSize: 11, color: "#888", lineHeight: 1.7 }}>
        <strong style={{ color: C.text }}>Note:</strong> This POC runs entirely in the browser
        (no backend). All production controls marked above require the Node.js + Express backend
        (nandi-backend) connected to AWS S3, Vimeo API, and a PDF processing service.
        The security blocking and alerts on this page are fully functional in this POC.
      </div>
    </div>
  );
}

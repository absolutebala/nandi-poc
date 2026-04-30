import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/**
 * Renders a PDF from an ArrayBuffer using PDF.js canvas rendering.
 * No download button. No watermark on view — clean experience.
 * All protection shortcuts handled globally by useSecurityBlock in App.jsx.
 */
export default function PDFViewer({ arrayBuffer }) {
  const canvasRef = useRef(null);
  const pdfRef    = useRef(null);
  const [total,   setTotal]   = useState(0);
  const [current, setCurrent] = useState(1);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!arrayBuffer) return;
    let cancelled = false;
    (async () => {
      setBusy(true); setError("");
      try {
        // slice(0) — PDF.js transfers ownership; we keep the original intact
        const pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer.slice(0))
        }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setTotal(pdf.numPages);
        await renderPage(pdf, 1);
      } catch (e) {
        if (!cancelled) setError("Could not render PDF: " + e.message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [arrayBuffer]);

  async function renderPage(pdf, pageNum) {
    setBusy(true);
    try {
      const page     = await pdf.getPage(pageNum);
      const scale    = window.devicePixelRatio > 1 ? 1.8 : 1.4;
      const viewport = page.getViewport({ scale });
      const canvas   = canvasRef.current;
      const ctx      = canvas.getContext("2d");
      canvas.width       = viewport.width;
      canvas.height      = viewport.height;
      canvas.style.width = "100%";
      await page.render({ canvasContext: ctx, viewport }).promise;
      setCurrent(pageNum);
    } finally {
      setBusy(false);
    }
  }

  function go(n) {
    if (!pdfRef.current || busy || n < 1 || n > total) return;
    renderPage(pdfRef.current, n);
  }

  const block = e => e.preventDefault();

  if (error) return (
    <div style={{ padding: 20, background: "#FCEBEB", color: "#A32D2D",
      borderRadius: 8, fontSize: 13 }}>{error}</div>
  );

  return (
    <div>
      {/* Toolbar — page nav only, no download */}
      <div style={{ display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", background: "#F5F5F5", borderRadius: 8, marginBottom: 10 }}>
        <button onClick={() => go(current - 1)} disabled={current <= 1 || busy}
          style={{ padding: "5px 14px", border: "1px solid #ddd", borderRadius: 6,
            background: "#fff", cursor: "pointer", fontSize: 13,
            opacity: current <= 1 ? 0.4 : 1 }}>
          ‹ Prev
        </button>
        <span style={{ fontSize: 12, color: "#666", flex: 1, textAlign: "center" }}>
          {busy ? "Rendering…" : `Page ${current} of ${total}`}
        </span>
        <button onClick={() => go(current + 1)} disabled={current >= total || busy}
          style={{ padding: "5px 14px", border: "1px solid #ddd", borderRadius: 6,
            background: "#fff", cursor: "pointer", fontSize: 13,
            opacity: current >= total ? 0.4 : 1 }}>
          Next ›
        </button>
        <span style={{ fontSize: 11, background: "#E1F5EE", color: "#085041",
          padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
          🔒 Protected · view only
        </span>
      </div>

      {/* Canvas */}
      <div style={{ position: "relative", borderRadius: 8, overflow: "hidden",
          userSelect: "none", opacity: busy ? 0.65 : 1, transition: "opacity .2s",
          WebkitUserSelect: "none", MozUserSelect: "none" }}
        onContextMenu={block}
        onDragStart={block}
        onMouseDown={e => e.button === 2 && block(e)}>
        <canvas ref={canvasRef}
          style={{ display: "block", width: "100%", borderRadius: 8,
            border: "0.5px solid #e5e5e5", pointerEvents: "none" }} />
        {busy && (
          <div style={{ position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.75)", borderRadius: 8 }}>
            <div style={{ width: 28, height: 28, border: "3px solid #ddd",
              borderTopColor: "#534AB7", borderRadius: "50%",
              animation: "spin 0.8s linear infinite" }} />
          </div>
        )}
      </div>
    </div>
  );
}

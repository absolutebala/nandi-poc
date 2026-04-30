import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Use the CDN worker to avoid Vite bundling complexity
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const WATERMARK = "Nandi Foundation · Confidential";

export default function PDFViewer({ arrayBuffer, trainerName }) {
  const canvasRef  = useRef(null);
  const pdfRef     = useRef(null);
  const [total,    setTotal]    = useState(0);
  const [current,  setCurrent]  = useState(1);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");

  /* Load PDF once arrayBuffer is ready */
  useEffect(() => {
    if (!arrayBuffer) return;
    let cancelled = false;
    (async () => {
      setBusy(true); setError("");
      try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setTotal(pdf.numPages);
        await renderPage(pdf, 1, trainerName);
      } catch (e) {
        if (!cancelled) setError("Could not render PDF: " + e.message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [arrayBuffer, trainerName]);

  async function renderPage(pdf, pageNum, name) {
    setBusy(true);
    try {
      const page     = await pdf.getPage(pageNum);
      const scale    = window.devicePixelRatio > 1 ? 1.8 : 1.4;
      const viewport = page.getViewport({ scale });
      const canvas   = canvasRef.current;
      const ctx      = canvas.getContext("2d");

      canvas.width        = viewport.width;
      canvas.height       = viewport.height;
      canvas.style.width  = "100%";

      /* 1 — Render the PDF page */
      await page.render({ canvasContext: ctx, viewport }).promise;

      /* 2 — Diagonal tiled watermark */
      const fontSize  = Math.max(14, Math.min(viewport.width, viewport.height) * 0.042);
      const wText     = name ? `${name} · ${WATERMARK}` : WATERMARK;
      const dateStr   = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

      ctx.save();
      ctx.font        = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle   = "rgba(40,30,120,0.10)";
      ctx.textAlign   = "center";

      const textW  = ctx.measureText(wText).width;
      const stepX  = textW + 60;
      const stepY  = fontSize + 55;
      const cols   = Math.ceil(viewport.width  / stepX) + 3;
      const rows   = Math.ceil(viewport.height / stepY) + 3;

      ctx.translate(viewport.width / 2, viewport.height / 2);
      ctx.rotate(-Math.PI / 6);

      for (let r = -rows; r < rows; r++) {
        for (let c = -cols; c < cols; c++) {
          ctx.fillText(wText, c * stepX + (r % 2 === 0 ? 0 : stepX / 2), r * stepY);
        }
      }
      ctx.restore();

      /* 3 — Corner stamp */
      const stamp     = `${name || "Viewer"} · ${dateStr}`;
      const stampSize = Math.max(9, Math.min(viewport.width, viewport.height) * 0.017);
      ctx.save();
      ctx.font        = `600 ${stampSize}px sans-serif`;
      ctx.fillStyle   = "rgba(60,40,160,0.50)";
      ctx.textAlign   = "right";
      ctx.fillText(stamp, viewport.width - 14, viewport.height - 12);
      ctx.restore();

      setCurrent(pageNum);
    } finally {
      setBusy(false);
    }
  }

  function go(n) {
    if (!pdfRef.current || busy || n < 1 || n > total) return;
    renderPage(pdfRef.current, n, trainerName);
  }

  const block = e => e.preventDefault();

  if (error) return (
    <div style={{ padding: 20, background: "#FCEBEB", color: "#A32D2D", borderRadius: 8, fontSize: 13 }}>
      {error}
    </div>
  );

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10,
        padding: "8px 14px", background: "#F5F5F5", borderRadius: 8, marginBottom: 10 }}>
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
        <span style={{ fontSize: 11, background: "#FAECE7", color: "#712B13",
          padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
          🔒 Watermarked · no download
        </span>
      </div>

      {/* Canvas — all download/copy vectors disabled */}
      <div
        style={{ position: "relative", borderRadius: 8, overflow: "hidden",
          userSelect: "none", opacity: busy ? 0.65 : 1, transition: "opacity .2s" }}
        onContextMenu={block}
        onDragStart={block}
        onMouseDown={e => e.button === 2 && block(e)}
      >
        <canvas ref={canvasRef}
          style={{ display: "block", width: "100%", borderRadius: 8,
            border: "0.5px solid #e5e5e5" }} />

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

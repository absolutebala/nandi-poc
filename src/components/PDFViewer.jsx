import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/** Block all print / save / devtools shortcuts while this component is mounted */
function useBlockShortcuts() {
  useEffect(() => {
    const BLOCKED = new Set(["p", "s", "u", "i", "j"]);
    function handler(e) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && BLOCKED.has(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
      if (e.key === "F12") {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
    }
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);
}

export default function PDFViewer({ arrayBuffer, trainerName, title }) {
  const canvasRef = useRef(null);
  const pdfRef    = useRef(null);
  const [total,   setTotal]   = useState(0);
  const [current, setCurrent] = useState(1);
  const [busy,    setBusy]    = useState(false);
  const [dlBusy,  setDlBusy]  = useState(false);
  const [error,   setError]   = useState("");
  const [dlDone,  setDlDone]  = useState(false);

  useBlockShortcuts();

  useEffect(() => {
    if (!arrayBuffer) return;
    let cancelled = false;
    (async () => {
      setBusy(true); setError("");
      try {
        // Slice a copy — PDF.js transfers ownership of the buffer (detaches it).
        // We keep the original for the download path.
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise;
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
      /* Clean render — no watermark on view */
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

  /** Download: apply watermark via pdf-lib, then trigger browser download */
  const handleDownload = useCallback(async () => {
    if (!arrayBuffer) return;
    setDlBusy(true);
    try {
      const pdfDoc = await PDFDocument.load(arrayBuffer.slice(0));
      const font   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const date   = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const stamp  = `${trainerName || "Trainer"} · ${date} · Nandi Foundation`;

      for (const page of pdfDoc.getPages()) {
        const { width, height } = page.getSize();
        const size = Math.min(width, height) * 0.045;

        /* Diagonal repeating watermark */
        const tileW = font.widthOfTextAtSize(stamp, size) + 50;
        const tileH = size + 50;
        const cols  = Math.ceil(Math.sqrt(width * width + height * height) / tileW) + 2;
        const rows  = Math.ceil(Math.sqrt(width * width + height * height) / tileH) + 2;

        for (let r = -rows; r < rows; r++) {
          for (let c = -cols; c < cols; c++) {
            const x = width / 2 + c * tileW + (r % 2 === 0 ? 0 : tileW / 2);
            const y = height / 2 + r * tileH;
            page.drawText(stamp, {
              x, y, size, font,
              color: rgb(0.3, 0.2, 0.7),
              opacity: 0.13,
              rotate: degrees(30),
            });
          }
        }

        /* Corner stamp */
        const cornerSize = Math.max(8, Math.min(width, height) * 0.018);
        page.drawText(stamp, {
          x: width - font.widthOfTextAtSize(stamp, cornerSize) - 12,
          y: 10, size: cornerSize, font,
          color: rgb(0.3, 0.2, 0.7), opacity: 0.55,
        });
      }

      /* NOTE: True password encryption requires server-side qpdf/ghostscript.
         In production the backend returns an encrypted PDF.
         This POC demonstrates the watermarked download flow. */
      const bytes = await pdfDoc.save();
      const blob  = new Blob([bytes], { type: "application/pdf" });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      a.href     = url;
      a.download = `${(title || "document").replace(/\.pdf$/i, "")}_protected.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDlDone(true);
      setTimeout(() => setDlDone(false), 3000);
    } catch (e) {
      setError("Download failed: " + e.message);
    } finally {
      setDlBusy(false);
    }
  }, [arrayBuffer, trainerName, title]);

  const block = e => e.preventDefault();

  if (error) return (
    <div style={{ padding: 20, background: "#FCEBEB", color: "#A32D2D", borderRadius: 8, fontSize: 13 }}>
      {error}
    </div>
  );

  return (
    <div>
      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        padding: "8px 12px", background: "#F5F5F5", borderRadius: 8, marginBottom: 10 }}>
        <button onClick={() => go(current - 1)} disabled={current <= 1 || busy}
          style={{ padding: "5px 14px", border: "1px solid #ddd", borderRadius: 6,
            background: "#fff", cursor: "pointer", fontSize: 13, opacity: current <= 1 ? 0.4 : 1 }}>
          ‹ Prev
        </button>
        <span style={{ fontSize: 12, color: "#666", flex: 1, textAlign: "center", whiteSpace: "nowrap" }}>
          {busy ? "Rendering…" : `Page ${current} of ${total}`}
        </span>
        <button onClick={() => go(current + 1)} disabled={current >= total || busy}
          style={{ padding: "5px 14px", border: "1px solid #ddd", borderRadius: 6,
            background: "#fff", cursor: "pointer", fontSize: 13, opacity: current >= total ? 0.4 : 1 }}>
          Next ›
        </button>

        {/* Download with watermark button */}
        <button onClick={handleDownload} disabled={dlBusy || !arrayBuffer}
          style={{ padding: "5px 14px", border: "1px solid #AFA9EC", borderRadius: 6,
            background: dlDone ? "#E1F5EE" : "#EEEDFE",
            color: dlDone ? "#085041" : "#3C3489",
            cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 5 }}>
          {dlBusy ? "Preparing…" : dlDone ? "✓ Downloaded" : "⬇ Download (watermarked)"}
        </button>

        <span style={{ fontSize: 11, background: "#E1F5EE", color: "#085041",
          padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
          🔒 Print & shortcuts blocked
        </span>
      </div>

      {/* ── Canvas — protected, no watermark on screen ── */}
      <div style={{ position: "relative", borderRadius: 8, overflow: "hidden",
          userSelect: "none", opacity: busy ? 0.65 : 1, transition: "opacity .2s" }}
        onContextMenu={block}
        onDragStart={block}
        onMouseDown={e => e.button === 2 && block(e)}>
        <canvas ref={canvasRef}
          style={{ display: "block", width: "100%", borderRadius: 8, border: "0.5px solid #e5e5e5" }} />
        {busy && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", background: "rgba(255,255,255,0.75)", borderRadius: 8 }}>
            <div style={{ width: 28, height: 28, border: "3px solid #ddd",
              borderTopColor: "#534AB7", borderRadius: "50%",
              animation: "spin 0.8s linear infinite" }} />
          </div>
        )}
      </div>

      {/* Print blocked via CSS */}
      <style>{`@media print { html, body { display: none !important; } }`}</style>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import JSZip from "jszip";

/** Extract text + image blobs from a single slide XML + zip */
async function parseSlide(zip, slideFile) {
  const xml = await zip.files[slideFile].async("string");
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  // Collect all text runs grouped by paragraph
  const ns = "http://schemas.openxmlformats.org/drawingml/2006/main";
  const paras = doc.getElementsByTagNameNS(ns, "p");
  const paragraphs = [];

  for (const para of paras) {
    const runs = para.getElementsByTagNameNS(ns, "t");
    const line = Array.from(runs)
      .map(r => r.textContent || "")
      .join("")
      .trim();
    if (line) paragraphs.push(line);
  }

  // Try to pull embedded images for this slide
  const slideNum = slideFile.match(/slide(\d+)\.xml/)?.[1];
  const slideDir = slideFile.substring(0, slideFile.lastIndexOf("/"));
  const slideName = slideFile.substring(slideFile.lastIndexOf("/") + 1);
  const relsFile = `${slideDir}/_rels/${slideName}.rels`;
  const images = [];

  if (zip.files[relsFile]) {
    const relsXml = await zip.files[relsFile].async("string");
    const relsDoc = parser.parseFromString(relsXml, "text/xml");
    const rels = relsDoc.getElementsByTagName("Relationship");

    for (const rel of rels) {
      const type = rel.getAttribute("Type") || "";
      const target = rel.getAttribute("Target") || "";
      if (type.includes("image") && target) {
        const imgPath = target.startsWith("../")
          ? "ppt/" + target.replace("../", "")
          : "ppt/slides/" + target;
        if (zip.files[imgPath]) {
          const blob = await zip.files[imgPath].async("blob");
          const url = URL.createObjectURL(blob);
          images.push(url);
        }
      }
    }
  }

  return { paragraphs, images };
}

export default function PPTViewer({ arrayBuffer, title }) {
  const [slides, setSlides]   = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  // Keep blob URLs for cleanup
  const [blobUrls, setBlobUrls] = useState([]);

  useEffect(() => {
    if (!arrayBuffer) return;
    let cancelled = false;

    (async () => {
      setLoading(true); setError("");
      try {
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Log all files for debugging
        const allFiles = Object.keys(zip.files);

        // Try strict path first, then case-insensitive fallback
        let slideFiles = allFiles
          .filter(n => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
          .sort((a, b) => {
            const na = parseInt(a.match(/(\d+)/)[1]);
            const nb = parseInt(b.match(/(\d+)/)[1]);
            return na - nb;
          });

        // Fallback: any file with "slide" + number + .xml anywhere in path
        if (slideFiles.length === 0) {
          slideFiles = allFiles
            .filter(n => /slide\d+\.xml$/i.test(n) && !/_rels/.test(n) && !n.includes("slideLayout") && !n.includes("slideMaster"))
            .sort((a, b) => {
              const na = parseInt(a.match(/(\d+)/)?.[1] || "0");
              const nb = parseInt(b.match(/(\d+)/)?.[1] || "0");
              return na - nb;
            });
        }

        if (slideFiles.length === 0) {
          const fileList = allFiles.slice(0, 20).join(", ");
          throw new Error(`No slides found. Files in ZIP: ${fileList}`);
        }

        const parsed = await Promise.all(slideFiles.map(f => parseSlide(zip, f)));
        if (cancelled) return;

        const allUrls = parsed.flatMap(s => s.images);
        setBlobUrls(allUrls);
        setSlides(parsed);
        setCurrent(0);
      } catch (e) {
        if (!cancelled) setError("Could not parse PPTX: " + e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      // Revoke blob URLs on unmount
      blobUrls.forEach(u => URL.revokeObjectURL(u));
    };
  }, [arrayBuffer]);

  const block = e => e.preventDefault();
  const slide = slides[current];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 32, color: "#888", fontSize: 13 }}>
      <div style={{ width: 22, height: 22, border: "2px solid #eee", borderTopColor: "#534AB7",
        borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      Parsing PPTX slides…
    </div>
  );

  if (error) return (
    <div style={{ padding: 20, background: "#FCEBEB", color: "#A32D2D", borderRadius: 8, fontSize: 13 }}>
      {error}
    </div>
  );

  return (
    <div onContextMenu={block} onDragStart={block}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        padding: "8px 12px", background: "#F5F5F5", borderRadius: 8, marginBottom: 10 }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          style={{ padding: "5px 14px", border: "1px solid #ddd", borderRadius: 6,
            background: "#fff", cursor: "pointer", fontSize: 13, opacity: current === 0 ? 0.4 : 1 }}>
          ‹ Prev
        </button>
        <span style={{ fontSize: 12, color: "#666", flex: 1, textAlign: "center" }}>
          Slide {current + 1} of {slides.length}
        </span>
        <button onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))}
          disabled={current === slides.length - 1}
          style={{ padding: "5px 14px", border: "1px solid #ddd", borderRadius: 6,
            background: "#fff", cursor: "pointer", fontSize: 13,
            opacity: current === slides.length - 1 ? 0.4 : 1 }}>
          Next ›
        </button>
        <span style={{ fontSize: 11, background: "#FAEEDA", color: "#633806",
          padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
          🔒 View only · no download
        </span>
      </div>

      {/* Slide canvas */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%",
        background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 8, overflow: "hidden",
        userSelect: "none" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", padding: "5%" }}>

          {/* Slide images */}
          {slide?.images?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16,
              justifyContent: "center" }}>
              {slide.images.slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt={`Slide ${current + 1} image ${i + 1}`}
                  draggable={false}
                  style={{ maxHeight: 160, maxWidth: "48%", objectFit: "contain",
                    borderRadius: 4, pointerEvents: "none" }}
                  onContextMenu={block} />
              ))}
            </div>
          )}

          {/* Slide text */}
          {slide?.paragraphs?.length > 0 ? (
            <div style={{ flex: 1, overflow: "hidden" }}>
              {slide.paragraphs.map((p, i) => (
                <p key={i} style={{
                  fontSize: i === 0 ? "clamp(14px, 3vw, 22px)" : "clamp(11px, 2vw, 15px)",
                  fontWeight: i === 0 ? 600 : 400,
                  color: i === 0 ? "#1a1a1a" : "#444",
                  marginBottom: "0.5em",
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: i === 0 ? "nowrap" : "normal",
                }}>
                  {p}
                </p>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center",
              justifyContent: "center", color: "#ccc", fontSize: 13 }}>
              {slide?.images?.length > 0 ? "Image slide" : "Empty slide"}
            </div>
          )}

          {/* Slide number */}
          <div style={{ position: "absolute", bottom: 10, right: 14,
            fontSize: 11, color: "#ccc" }}>
            {current + 1} / {slides.length}
          </div>
        </div>
      </div>

      {/* Slide strip */}
      {slides.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto",
          paddingBottom: 4 }}>
          {slides.map((s, i) => (
            <div key={i} onClick={() => setCurrent(i)}
              style={{ flexShrink: 0, width: 90, height: 54, border: `2px solid ${i === current ? "#534AB7" : "#e5e5e5"}`,
                borderRadius: 6, cursor: "pointer", background: "#fff",
                display: "flex", flexDirection: "column", padding: "6px 8px",
                overflow: "hidden", transition: "border-color .15s" }}>
              {s.paragraphs.slice(0, 2).map((p, j) => (
                <p key={j} style={{ fontSize: j === 0 ? 8 : 7, fontWeight: j === 0 ? 600 : 400,
                  color: "#333", overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", margin: 0, lineHeight: 1.3 }}>
                  {p}
                </p>
              ))}
              {s.images?.length > 0 && s.paragraphs.length === 0 && (
                <div style={{ fontSize: 7, color: "#aaa" }}>Image slide</div>
              )}
              <div style={{ marginTop: "auto", fontSize: 7, color: "#ccc" }}>{i + 1}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

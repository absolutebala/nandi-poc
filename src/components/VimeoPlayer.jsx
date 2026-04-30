import React from "react";

export function extractVimeoId(url = "") {
  const m = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  return m ? m[1] : null;
}

/**
 * Embeds a Vimeo video with:
 *   download=0  — hides the Vimeo download button
 *   pip=0       — disables picture-in-picture
 *   Domain whitelist enforced on Vimeo account settings (server-side)
 */
export default function VimeoPlayer({ vimeoId }) {
  const src = `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0&controls=1&download=0&pip=0&dnt=1`;

  return (
    <div
      style={{ position: "relative", paddingBottom: "56.25%", height: 0,
        borderRadius: 10, overflow: "hidden", background: "#000" }}
      onContextMenu={e => e.preventDefault()}
    >
      <iframe
        src={src}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Training video"
      />
    </div>
  );
}

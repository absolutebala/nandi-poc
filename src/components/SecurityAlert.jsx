import React, { useEffect } from "react";

export default function SecurityAlert({ visible, onClose }) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 999999,
        background: "rgba(8, 8, 24, 0.94)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "secFadeIn .18s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: "52px 60px",
          textAlign: "center", maxWidth: 480, margin: "0 20px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          animation: "secSlideUp .22s ease",
        }}
      >
        <div style={{ fontSize: 60, marginBottom: 18, lineHeight: 1 }}>🔒</div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a",
          marginBottom: 10, lineHeight: 1.3 }}>
          Files are secured and protected
        </h2>

        <p style={{ fontSize: 16, color: "#534AB7", fontWeight: 500,
          marginBottom: 16, lineHeight: 1.5 }}>
          to transfer in any forms.
        </p>

        <p style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
          This action has been blocked. Unauthorised transfer of Nandi Foundation
          training materials is a violation of your trainer agreement.
        </p>

        <button onClick={onClose}
          style={{ marginTop: 24, padding: "10px 28px", borderRadius: 8,
            border: "0.5px solid #ddd", background: "#f5f5f5", color: "#555",
            fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
          I understand
        </button>
      </div>

      <style>{`
        @keyframes secFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes secSlideUp { from { opacity: 0; transform: translateY(20px); }
                                to   { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

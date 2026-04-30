import React, { useState, useCallback } from "react";
import UploadPage from "./pages/UploadPage.jsx";
import ViewPage from "./pages/ViewPage.jsx";
import SecurityAlert from "./components/SecurityAlert.jsx";
import { useSecurityBlock } from "./hooks/useSecurityBlock.js";

export const C = {
  purple:     "#534AB7",
  purpleLight:"#EEEDFE",
  purpleMid:  "#AFA9EC",
  teal:       "#0F6E56",
  tealLight:  "#E1F5EE",
  coral:      "#712B13",
  coralLight: "#FAECE7",
  amber:      "#633806",
  amberLight: "#FAEEDA",
  blue:       "#0C447C",
  blueLight:  "#E6F1FB",
  border:     "#E5E5E5",
  bg:         "#FAFAF9",
  text:       "#1a1a1a",
  muted:      "#888888",
};

export function Badge({ type }) {
  const cfg = {
    video: ["▶ VIDEO", C.purpleLight, C.purple],
    pdf:   ["PDF",     C.coralLight,  C.coral],
    ppt:   ["PPT",     C.amberLight,  C.amber],
  }[type] || ["FILE", "#eee", "#555"];
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 9px",
      borderRadius: 20, background: cfg[1], color: cfg[2], letterSpacing: ".03em" }}>
      {cfg[0]}
    </span>
  );
}

export function LockChip({ label, bg, color }) {
  return (
    <span style={{ fontSize: 11, background: bg, color, padding: "3px 10px",
      borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 4 }}>
      🔒 {label}
    </span>
  );
}

export function InfoBox({ children }) {
  return (
    <div style={{ marginTop: 12, padding: "10px 14px", background: C.bg,
      border: `0.5px solid ${C.border}`, borderRadius: 8,
      fontSize: 11, color: "#555", lineHeight: 1.7 }}>
      {children}
    </div>
  );
}

export default function App() {
  const [materials, setMaterials] = useState([]);
  const [tab,       setTab]       = useState("upload");
  const [toast,     setToast]     = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  // Global security — fires on every blocked action across ALL pages
  const handleSecurityAttempt = useCallback(() => {
    setAlertOpen(true);
  }, []);
  useSecurityBlock(handleSecurityAttempt);

  function addMaterial(mat)    { setMaterials(m => [...m, mat]); }
  function removeMaterial(id)  { setMaterials(m => m.filter(x => x.id !== id)); }
  function showToast(msg, isErr = false) {
    setToast({ msg, isErr }); setTimeout(() => setToast(""), 3500);
  }

  const navItem = (key, label) => (
    <button key={key} onClick={() => setTab(key)} style={{
      padding: "14px 18px", border: "none", background: "none", cursor: "pointer",
      fontSize: 13, fontWeight: tab === key ? 600 : 400,
      color: tab === key ? C.purple : C.muted,
      borderBottom: tab === key ? `2px solid ${C.purple}` : "2px solid transparent",
      transition: "all .15s",
      display: "flex", alignItems: "center", gap: 6,
    }}>
      {label}
      {key === "view" && materials.length > 0 && (
        <span style={{ fontSize: 10, background: C.blueLight, color: C.blue,
          borderRadius: 20, padding: "1px 7px", fontWeight: 600 }}>
          {materials.length}
        </span>
      )}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
      userSelect: "none", WebkitUserSelect: "none" }}>

      {/* Global security alert */}
      <SecurityAlert visible={alertOpen} onClose={() => setAlertOpen(false)} />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999,
          background: toast.isErr ? "#A32D2D" : "#1D9E75",
          color: "#fff", padding: "11px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,.15)",
          animation: "fadeIn .2s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center",
        borderBottom: `0.5px solid ${C.border}`, padding: "0 24px",
        background: "#fff", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8,
          marginRight: 24, padding: "12px 0" }}>
          <div style={{ width: 28, height: 28, background: C.purple, borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 13, height: 13, border: "2.5px solid #fff", borderRadius: 3 }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Nandi Foundation</div>
            <div style={{ fontSize: 10, color: C.muted }}>Material protection POC</div>
          </div>
        </div>

        {navItem("upload", "Upload materials")}
        {navItem("view",   "View materials")}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, background: "#E1F5EE", color: "#085041",
            padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
            🔒 All pages secured
          </span>
          <span style={{ fontSize: 10, background: C.amberLight, color: C.amber,
            padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
            POC Demo
          </span>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        {tab === "upload"
          ? <UploadPage materials={materials} onAdd={addMaterial}
              onRemove={removeMaterial} showToast={showToast} />
          : <ViewPage   materials={materials} showToast={showToast} />
        }
      </main>

      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        input, button, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:4px; }

        /* Block print across the entire app */
        @media print {
          #root { display: none !important; }
          #nandi-print-block {
            display: flex !important;
            position: fixed; inset: 0;
            align-items: center; justify-content: center;
            flex-direction: column; gap: 16px;
            font-family: sans-serif; text-align: center;
            background: #fff;
          }
        }
      `}</style>
    </div>
  );
}

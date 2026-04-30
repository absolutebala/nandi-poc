import React, { useState, useCallback, useEffect } from "react";
import UploadPage from "./pages/UploadPage.jsx";
import ViewPage from "./pages/ViewPage.jsx";
import ConditionsPage from "./pages/ConditionsPage.jsx";
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
  aalBlue:    "#1B2B6B",
  aalBlueLight:"#3B6FE8",
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

/* ── Splash screen ─────────────────────────────────────────────────────── */
function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer  = setTimeout(() => setFading(true), 2400);
    const doneTimer  = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "#fff",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 0,
      opacity: fading ? 0 : 1,
      transition: "opacity .6s ease",
      pointerEvents: fading ? "none" : "all",
    }}>
      {/* Naandi Foundation */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <div style={{ width: 44, height: 44, background: C.purple, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 20, height: 20, border: "3px solid #fff", borderRadius: 4 }} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>
            Naandi Foundation
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
            Trainer Management App · POC
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 48, height: 1, background: C.border, marginBottom: 32 }} />

      {/* Built by */}
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 12,
        textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 500 }}>
        Built by
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.aalBlue, letterSpacing: ".02em" }}>
        Absolute App Labs
      </div>

      {/* Loading dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 48 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%", background: C.purpleMid,
            animation: `dot .9s ${i * .2}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes dot {
          from { opacity: .3; transform: translateY(0); }
          to   { opacity: 1;  transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      borderTop: `0.5px solid ${C.border}`,
      padding: "12px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#fff", flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, color: C.muted }}>
        © {new Date().getFullYear()} Naandi Foundation · Material Protection POC
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: C.muted }}>Built by</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.aalBlue }}>Absolute App Labs</span>
      </div>
    </footer>
  );
}

/* ── Main App ──────────────────────────────────────────────────────────── */
export default function App() {
  const [splash,    setSplash]    = useState(true);
  const [materials, setMaterials] = useState([]);
  const [tab,       setTab]       = useState("upload");
  const [toast,     setToast]     = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  const handleSecurityAttempt = useCallback(() => setAlertOpen(true), []);
  useSecurityBlock(handleSecurityAttempt);

  function addMaterial(mat)   { setMaterials(m => [...m, mat]); }
  function removeMaterial(id) { setMaterials(m => m.filter(x => x.id !== id)); }
  function showToast(msg, isErr = false) {
    setToast({ msg, isErr }); setTimeout(() => setToast(""), 3500);
  }

  const navItem = (key, label) => (
    <button key={key} onClick={() => setTab(key)} style={{
      padding: "14px 16px", border: "none", background: "none", cursor: "pointer",
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

      {/* Splash */}
      {splash && <SplashScreen onDone={() => setSplash(false)} />}

      {/* Security alert */}
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

      {/* ── Navbar ── */}
      <nav style={{ display: "flex", alignItems: "center",
        borderBottom: `0.5px solid ${C.border}`, padding: "0 20px",
        background: "#fff", position: "sticky", top: 0, zIndex: 100,
        minHeight: 52 }}>

        {/* Nandi brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8,
          marginRight: 20, padding: "10px 0" }}>
          <div style={{ width: 26, height: 26, background: C.purple, borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ width: 12, height: 12, border: "2.5px solid #fff", borderRadius: 3 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
              Naandi Foundation
            </div>
            <div style={{ fontSize: 9, color: C.muted, lineHeight: 1 }}>
              Material protection POC
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: C.border, marginRight: 16, flexShrink: 0 }} />

        {/* Nav tabs */}
        {navItem("upload",     "Upload materials")}
        {navItem("view",       "View materials")}
        {navItem("conditions", "Conditions")}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* AAL logo in navbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: 8,
          border: `0.5px solid ${C.border}`, background: C.bg }}>
          <span style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap" }}>Built by</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.aalBlue, whiteSpace: "nowrap" }}>Absolute App Labs</span>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === "upload"
          ? <UploadPage materials={materials} onAdd={addMaterial}
              onRemove={removeMaterial} showToast={showToast} />
          : tab === "view"
          ? <ViewPage   materials={materials} showToast={showToast} />
          : <ConditionsPage />
        }
      </main>

      {/* ── Footer ── */}
      <Footer />

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform:rotate(360deg); } }
        input, button, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:4px; }
        @media print {
          #root { display: none !important; }
          #nandi-print-block {
            display: flex !important;
            position: fixed; inset: 0;
            align-items: center; justify-content: center;
            flex-direction: column; gap: 16px;
            font-family: sans-serif; text-align: center; background: #fff;
          }
        }
      `}</style>
    </div>
  );
}

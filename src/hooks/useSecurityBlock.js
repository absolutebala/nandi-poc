import { useEffect, useCallback } from "react";

/**
 * Blocks all known browser-level content-exfiltration vectors and calls
 * `onAttempt()` whenever one is triggered so the UI can show the alert.
 *
 * What this covers:
 *   ✅ Cmd/Ctrl + P  (print dialog)
 *   ✅ Cmd/Ctrl + S  (save page)
 *   ✅ Cmd/Ctrl + U  (view source)
 *   ✅ Cmd/Ctrl + Shift + I / J / C  (dev tools)
 *   ✅ F12           (dev tools)
 *   ✅ Cmd/Ctrl + A  (select all)
 *   ✅ Cmd/Ctrl + C  (copy)
 *   ✅ Right-click context menu
 *   ✅ Drag start
 *   ✅ window.print() called from console
 *   ✅ browser print shortcut (@media print CSS hides all content)
 *   ✅ Text selection CSS disabled
 *
 * What this CANNOT block (OS-level — no browser API can):
 *   ❌ Cmd+Shift+3/4 (macOS screenshot)
 *   ❌ Print Screen key (Windows/Linux OS screenshot)
 *   ❌ QuickTime / OBS screen recording
 *   ❌ External camera pointed at screen
 *   ❌ Browser dev tools opened BEFORE page load
 *
 * For video: Vimeo enforces no-download server-side. Full DRM (Widevine/
 * FairPlay) at the OS level would prevent screen capture of video — that
 * requires a Vimeo OTT / enterprise DRM plan.
 */
export function useSecurityBlock(onAttempt) {
  const trigger = useCallback(() => {
    if (onAttempt) onAttempt();
  }, [onAttempt]);

  useEffect(() => {
    // Keys that should be blocked when Ctrl/Cmd is held
    const CTRL_BLOCKED = new Set(["p", "s", "u", "a", "c"]);
    // Keys that should be blocked when Ctrl/Cmd + Shift is held
    const CTRL_SHIFT_BLOCKED = new Set(["i", "j", "c", "k"]);

    function onKeyDown(e) {
      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key   = e.key.toLowerCase();

      if (ctrl && shift && CTRL_SHIFT_BLOCKED.has(key)) {
        e.preventDefault(); e.stopImmediatePropagation(); trigger(); return;
      }
      if (ctrl && !shift && CTRL_BLOCKED.has(key)) {
        e.preventDefault(); e.stopImmediatePropagation(); trigger(); return;
      }
      if (e.key === "F12") {
        e.preventDefault(); e.stopImmediatePropagation(); trigger(); return;
      }
      // PrintScreen (OS may still capture, but we flag it)
      if (e.key === "PrintScreen") {
        e.preventDefault(); trigger(); return;
      }
    }

    function onContextMenu(e) { e.preventDefault(); trigger(); }
    function onCopy(e)        { e.preventDefault(); trigger(); }
    function onDragStart(e)   { e.preventDefault(); }
    function onSelectStart(e) {
      // Allow selection inside inputs and textareas
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      e.preventDefault();
    }

    // Intercept programmatic window.print() (e.g. called from browser console)
    const _origPrint = window.print.bind(window);
    window.print = () => trigger();

    window.addEventListener("keydown",     onKeyDown,     true);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy",        onCopy);
    document.addEventListener("dragstart",   onDragStart);
    document.addEventListener("selectstart", onSelectStart);

    return () => {
      window.print = _origPrint;
      window.removeEventListener("keydown",     onKeyDown,     true);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy",        onCopy);
      document.removeEventListener("dragstart",   onDragStart);
      document.removeEventListener("selectstart", onSelectStart);
    };
  }, [trigger]);
}

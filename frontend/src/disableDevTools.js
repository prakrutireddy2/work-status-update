/**
 * Blocks the common ways to reach DevTools from within the page: the
 * right-click context menu and the usual keyboard shortcuts (F12,
 * Ctrl/Cmd+Shift+I/J/C, Ctrl/Cmd+U). This is a deterrent only — it cannot
 * stop DevTools opened from the browser's own menu, an extension, or with
 * JavaScript disabled, and does not change the app's actual security,
 * which never depends on hiding anything from a client that inspects it.
 */
export function installDevToolsBlockers() {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    const key = e.key;

    if (key === 'F12') {
      e.preventDefault();
      return;
    }

    const combo = e.ctrlKey || e.metaKey;
    if (!combo) return;

    // Ctrl/Cmd+Shift+I (inspect), +J (console), +C (element picker)
    if (e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(key)) {
      e.preventDefault();
      return;
    }

    // Ctrl/Cmd+U (view source)
    if (!e.shiftKey && (key === 'U' || key === 'u')) {
      e.preventDefault();
    }
  });
}

// DevTools opening itself can't be blocked (see installDevToolsBlockers'
// comment), so this instead detects when it's open and lets the caller
// react — e.g. hide the real UI behind the decoy page. Based on the gap
// between the browser window's outer and inner size, which grows when
// DevTools is docked to a side (width) or the bottom (height) of the
// window. This is a heuristic: it won't catch an undocked/separate
// DevTools window, and it can still false-positive on legitimately narrow
// windows or split-screen layouts — there is no fully reliable way to
// detect this from page JavaScript.
//
// Height is only checked on non-touch devices: a mobile on-screen keyboard
// shrinks window.innerHeight by more than this threshold the instant it
// opens, which was false-firing this and yanking focus out of the
// password field mid-type. Real desktop/laptop browsers aren't affected by
// that, so they keep the height check and still catch bottom-docked
// DevTools.
const DEVTOOLS_SIZE_THRESHOLD = 160;

const isLikelyTouchDevice =
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export function startDevToolsDetector(onDetected, intervalMs = 1000) {
  const check = () => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    const detected =
      widthDiff > DEVTOOLS_SIZE_THRESHOLD ||
      (!isLikelyTouchDevice && heightDiff > DEVTOOLS_SIZE_THRESHOLD);
    if (detected) {
      onDetected();
    }
  };

  check();
  const id = setInterval(check, intervalMs);
  return () => clearInterval(id);
}

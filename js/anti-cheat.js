// Anti-cheat: 1st time = warning (message depends on cheat type), 2nd time = terminate & block
// Cooldown after first warning so multiple events from same action (e.g. tab switch + blur) count as one strike
window.QuizAntiCheat = (function() {
  const WARNINGS = {
    visibility: 'You have switched tabs. Do this again and your quiz will be terminated.',
    blur: 'You have lost focus on the quiz window. Ensure this window remains active.',
    resize: 'Split-screen or resizing is not allowed during the test.',
    clipboard: 'Clipboard actions and right-clicking are strictly disabled.'
  };

  const COOLDOWN_MS = 2500;

  let strikeCount = 0;
  let onTerminate = null;
  let modalOpen = false;
  let cooldownUntil = 0;

  function showWarning(type) {
    modalOpen = true;
    cooldownUntil = Date.now() + COOLDOWN_MS;
    const overlay = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    if (overlay && body) {
      title.textContent = 'Warning';
      body.textContent = WARNINGS[type] || 'Invalid behaviour detected.';
      overlay.classList.remove('hidden');
    }
    var okEl = document.getElementById('modalOk');
    if (okEl) okEl.focus();
  }

  function handleStrike(type) {
    if (Date.now() < cooldownUntil) return;
    strikeCount++;
    if (strikeCount === 1) {
      showWarning(type);
    } else {
      if (typeof onTerminate === 'function') onTerminate();
    }
  }

  function init(terminateCallback) {
    onTerminate = terminateCallback;
    strikeCount = 0;

    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState !== 'visible') handleStrike('visibility');
    });

    window.addEventListener('blur', function() {
      if (modalOpen) return;
      handleStrike('blur');
    });

    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    window.addEventListener('resize', function() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dw = Math.abs(w - lastWidth);
      const dh = Math.abs(h - lastHeight);
      if (dw > 50 || dh > 50) handleStrike('resize');
      lastWidth = w;
      lastHeight = h;
    });

    document.addEventListener('copy', function(e) {
      e.preventDefault();
      handleStrike('clipboard');
    });
    document.addEventListener('paste', function(e) {
      e.preventDefault();
      handleStrike('clipboard');
    });
    document.addEventListener('cut', function(e) {
      e.preventDefault();
      handleStrike('clipboard');
    });
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      handleStrike('clipboard');
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var okBtn = document.getElementById('modalOk');
    if (okBtn) {
      okBtn.addEventListener('click', function() {
        document.getElementById('modalOverlay').classList.add('hidden');
        modalOpen = false;
      });
    }
  });

  function setModalClosed() { modalOpen = false; }

  return { init: init, showWarning: showWarning, setModalClosed: setModalClosed };
})();

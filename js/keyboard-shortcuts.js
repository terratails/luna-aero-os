'use strict';
/* js/keyboard-shortcuts.js */
const SHORTCUT_DEFS = [
  { keys: ['Alt','1'],       desc: 'Open About Glen' },
  { keys: ['Alt','2'],       desc: 'Open Experience' },
  { keys: ['Alt','3'],       desc: 'Open Projects' },
  { keys: ['Alt','4'],       desc: 'Open Services' },
  { keys: ['Alt','5'],       desc: 'Open Contact' },
  { keys: ['Alt','6'],       desc: 'Open Resume' },
  { keys: ['Alt','T'],       desc: 'Open Terminal' },
  { keys: ['Alt','S'],       desc: 'Open System Info' },
  { keys: ['Alt','M'],       desc: 'Open Media Player' },
  { keys: ['Alt','P'],       desc: 'Open Theme Picker' },
  { keys: ['Alt','/'],       desc: 'Toggle Shortcuts Panel' },
  { keys: ['Alt','Tab'],     desc: 'Cycle open windows' },
  { keys: ['Alt','←'],      desc: 'Snap active window — left half' },
  { keys: ['Alt','→'],      desc: 'Snap active window — right half' },
  { keys: ['Alt','↑'],      desc: 'Snap active window — maximize' },
  { keys: ['Alt','↓'],      desc: 'Restore / minimize active window' },
  { keys: ['Ctrl','Arrows'], desc: 'Move active window 8px' },
  { keys: ['Ctrl','Shift','Arrows'], desc: 'Resize active window 8px' },
  { keys: ['Esc'],           desc: 'Close menus & overlays' },
  { keys: ['Space'],         desc: 'Play / Pause (Media Player)' },
  { keys: ['←','→'],        desc: 'Prev / Next track (Media Player)' },
  { keys: ['↑','↓'],        desc: 'Volume up / down (Media Player)' },
  { keys: ['Drag →  edge'], desc: 'Aero Snap — drag title bar to edge' },
  { keys: ['Drag →  border'], desc: 'Resize — grab any window edge or corner' },
];

function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (e.altKey) {
      const map = {
        '1':'about','2':'experience','3':'projects','4':'services',
        '5':'contact','6':'resume','t':'terminal','c':'calculator',
        'n':'notepad','s':'sysinfo','m':'music','p':'theme',
        '/':'shortcuts',
      };
      const k = e.key.toLowerCase();
      if (map[k]) {
        e.preventDefault();
        if (k === '/') toggleShortcutsPanel();
        else openWindow(map[k]);
        return;
      }
      if (e.key === 'Tab') { e.preventDefault(); handleAltTab(e.shiftKey); return; }

      if (OS.activeWindow) {
        const snapMap = {
          ArrowLeft:  'left',
          ArrowRight: 'right',
          ArrowUp:    'maximize',
        };
        if (snapMap[e.key] && !e.shiftKey && !e.ctrlKey) {
          e.preventDefault();
          const win = document.getElementById('win-' + OS.activeWindow);
          if (win && !win.classList.contains('minimized')) {
            applySnapToWindow(OS.activeWindow, snapMap[e.key]);
          }
          return;
        }
        if (e.key === 'ArrowDown' && !e.shiftKey && !e.ctrlKey) {
          e.preventDefault();
          const win = document.getElementById('win-' + OS.activeWindow);
          if (win) {
            if (win.classList.contains('snapped') || win.classList.contains('maximized')) {
              unSnapWindow(OS.activeWindow);
            } else {
              minimizeWindow(OS.activeWindow);
            }
          }
          return;
        }
      }
    }

    if (e.ctrlKey && !e.altKey && OS.activeWindow) {
      const arrowDeltas = {
        ArrowUp:    { dx: 0,  dy: -1 },
        ArrowDown:  { dx: 0,  dy:  1 },
        ArrowLeft:  { dx: -1, dy:  0 },
        ArrowRight: { dx:  1, dy:  0 },
      };
      const d = arrowDeltas[e.key];
      if (d) {
        e.preventDefault();
        const step = e.shiftKey ? 24 : 8;
        if (e.shiftKey) {
          growWindowBy(OS.activeWindow, d.dx * step, d.dy * step, 0, 0);
        } else {
          nudgeWindow(OS.activeWindow, d.dx * step, d.dy * step);
        }
        return;
      }
    }

    if (e.key === 'Escape') {
      document.getElementById('start-menu')?.classList.add('hidden');
      document.getElementById('cal-popover')?.classList.add('hidden');
      document.getElementById('shortcuts-overlay')?.classList.add('hidden');
      hideSnapGhost();
      hideAllZoneHints();
    }
    if (e.key === 'Enter' && !OS.loggedIn) doLogin();
    resetIdleTimer();
  });
  document.addEventListener('mousemove', resetIdleTimer);
}

function initShortcutsPanel() {
  const list  = document.getElementById('sc-list');
  const close = document.getElementById('sc-panel-close');
  if (!list) return;

  SHORTCUT_DEFS.forEach(({ keys, desc }) => {
    const row = document.createElement('div'); row.className = 'sc-row';
    const ks  = document.createElement('div'); ks.className  = 'sc-keys';
    keys.forEach(k => {
      const el = document.createElement('span'); el.className = 'sc-key'; el.textContent = k; ks.appendChild(el);
    });
    const ds = document.createElement('span'); ds.className = 'sc-desc'; ds.textContent = desc;
    row.appendChild(ks); row.appendChild(ds); list.appendChild(row);
  });

  close?.addEventListener('click', () => {
    document.getElementById('shortcuts-overlay')?.classList.add('hidden');
  });
}

function toggleShortcutsPanel() {
  document.getElementById('shortcuts-overlay')?.classList.toggle('hidden');
}

function handleAltTab(reverse) {
  const wins = [...OS.openWindows.entries()].filter(([, d]) => !d.minimized);
  if (!wins.length) return;
  if (!OS.altTabOpen) {
    OS.altTabOpen  = true;
    OS.altTabIndex = 0;
    showAltTab(wins);
  } else {
    OS.altTabIndex = (OS.altTabIndex + (reverse ? -1 : 1) + wins.length) % wins.length;
    updateAltTabFocus();
  }
}

function showAltTab(wins) {
  document.getElementById('alttab-overlay')?.remove();
  const overlay = document.createElement('div'); overlay.id = 'alttab-overlay'; overlay.className = 'alttab-overlay';
  const inner   = document.createElement('div'); inner.className = 'alttab-inner';
  wins.forEach(([id, data], i) => {
    const card = document.createElement('div');
    card.className = 'at-card' + (i === OS.altTabIndex ? ' focused' : '');
    card.dataset.id = id;
    card.innerHTML  = `<div class="at-card-ico">${data.icon}</div><div class="at-card-name">${escHtml(data.title.split('—')[0].trim())}</div>`;
    card.addEventListener('click', () => { focusWindow(data.el); removeAltTab(); });
    inner.appendChild(card);
  });
  const hint = document.createElement('div'); hint.className = 'alttab-hint'; hint.textContent = 'Alt+Tab to cycle · Release to switch';
  overlay.appendChild(inner); overlay.appendChild(hint);
  document.body.appendChild(overlay);

  document.addEventListener('keyup', function handler(e) {
    if (e.key === 'Alt') {
      const wins2 = [...OS.openWindows.entries()].filter(([, d]) => !d.minimized);
      if (wins2[OS.altTabIndex]) { const [id, data] = wins2[OS.altTabIndex]; restoreWindow(id); focusWindow(data.el); }
      removeAltTab();
      document.removeEventListener('keyup', handler);
    }
  });
}

function updateAltTabFocus() {
  document.querySelectorAll('.at-card').forEach((c, i) => c.classList.toggle('focused', i === OS.altTabIndex));
}

function removeAltTab() {
  OS.altTabOpen = false;
  document.getElementById('alttab-overlay')?.remove();
}

function resetIdleTimer() {
  clearTimeout(OS.screensaverTimer);
  if (OS.screensaverActive) dismissScreensaver();
  if (!OS.loggedIn) return;
  OS.screensaverTimer = setTimeout(activateScreensaver, OS.idleTimeout);
}

function activateScreensaver() {
  if (OS.screensaverActive) return;
  OS.screensaverActive = true;
  let ss = document.getElementById('screensaver');
  if (!ss) {
    ss = document.createElement('div'); ss.id = 'screensaver';
    const canvas = document.createElement('canvas'); canvas.id = 'screensaver-canvas';
    ss.appendChild(canvas);
    const brand   = document.createElement('div'); brand.className = 'ss-brand';
    brand.innerHTML = `<div class="ss-orb"></div><div class="ss-text">LUNA AERO OS</div><div class="ss-sub">Glen Paul D. Choco · Portfolio</div>`;
    ss.appendChild(brand);
    const dismiss = document.createElement('div'); dismiss.className = 'ss-dismiss'; dismiss.textContent = 'Move mouse or press any key to wake';
    ss.appendChild(dismiss);
    document.body.appendChild(ss);
    const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    drawSceneField(ctx, canvas, 'screensaver');
  }
  ss.style.display = 'flex';
  ss.addEventListener('click', dismissScreensaver);
}

function dismissScreensaver() {
  OS.screensaverActive = false;
  const ss = document.getElementById('screensaver');
  if (ss) { ss.style.opacity = '0'; ss.style.transition = 'opacity 0.5s'; setTimeout(() => ss.style.display = 'none', 500); }
}
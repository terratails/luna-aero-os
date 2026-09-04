'use strict';
/* js/window-lifecycle.js */

function openWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;

  if (OS.openWindows.has(id) && !win.classList.contains('hidden')) {
    if (win.classList.contains('minimized')) restoreWindow(id);
    else focusWindow(win);
    return;
  }

  const restored = restoreWindowGeometry(id);
  let w, h, left, top;
  if (restored) {
    ({ w, h, left, top } = restored);
  } else {
    ({ w, h } = resolveWindowGeometry(id));
    ({ left, top } = computeOpenPosition(w, h));
  }

  win.classList.remove('snapped', 'maximized');
  delete win.dataset.snapZone;
  delete win.dataset.freeW; delete win.dataset.freeH;
  delete win.dataset.freeX; delete win.dataset.freeY;
  delete win.dataset.prevW; delete win.dataset.prevH;
  delete win.dataset.prevX; delete win.dataset.prevY;

  win.classList.remove('hidden', 'win-closing', 'win-minimizing', 'minimized');
  win.style.display = 'flex';

  applyWindowGeometry(win, w, h, left, top);

  OS.zTop += 5;
  win.style.zIndex = OS.zTop;

  OS.openWindows.set(id, {
    el:        win,
    title:     win.dataset.title || id,
    icon:      WINDOW_ICONS[id]  || '🪟',
    minimized: false,
  });

  focusWindow(win);
  updateTaskbarButtons();

  scheduleResizeFrameSync(win, true);
  requestAnimationFrame(() => scheduleResizeFrameSync(win, true));
  requestAnimationFrame(() => requestAnimationFrame(() => scheduleResizeFrameSync(win, true)));

  if (id === 'sysinfo') animateSysInfoBars();
  if (id === 'about')   { animateAboutStackBars(); initProfilePicture(); }
}

function closeWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  win.classList.add('win-closing');
  setTimeout(() => {
    win.classList.add('hidden');
    win.classList.remove('win-closing', 'focused', 'minimized', 'maximized', 'snapped');
    win.style.display = '';
    hideResizeFrame(win);
  }, 200);
  OS.openWindows.delete(id);
  updateTaskbarButtons();
}

function minimizeWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  win.classList.add('win-minimizing');
  setTimeout(() => {
    win.classList.add('hidden', 'minimized');
    win.classList.remove('win-minimizing', 'focused');
    win.style.display = '';
    hideResizeFrame(win);
  }, 220);
  const entry = OS.openWindows.get(id);
  if (entry) entry.minimized = true;
  updateTaskbarButtons();
}

function restoreWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  win.classList.remove('hidden', 'minimized');
  win.style.display = 'flex';
  win.classList.add('win-restore');
  setTimeout(() => win.classList.remove('win-restore'), 250);
  reclampWindow(id);
  const entry = OS.openWindows.get(id);
  if (entry) entry.minimized = false;
  focusWindow(win);
  updateTaskbarButtons();
  scheduleResizeFrameSync(win, true);
  requestAnimationFrame(() => scheduleResizeFrameSync(win, true));
}

function maximizeWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  const isMax     = win.classList.contains('maximized');
  const isSnapped = win.classList.contains('snapped');

  if (isMax || isSnapped) {
    unSnapWindow(id);
  } else {
    win.dataset.freeW = win.style.getPropertyValue('--win-w') || (win.offsetWidth  + 'px');
    win.dataset.freeH = win.style.getPropertyValue('--win-h') || (win.offsetHeight + 'px');
    win.dataset.freeX = win.style.getPropertyValue('--win-x') || (win.offsetLeft   + 'px');
    win.dataset.freeY = win.style.getPropertyValue('--win-y') || (win.offsetTop    + 'px');
    win.dataset.prevW = win.dataset.freeW;
    win.dataset.prevH = win.dataset.freeH;
    win.dataset.prevX = win.dataset.freeX;
    win.dataset.prevY = win.dataset.freeY;
    win.classList.add('maximized');
  }
  scheduleResizeFrameSync(win, true);
}

function focusWindow(win) {
  document.querySelectorAll('.os-window').forEach(w => w.classList.remove('focused'));
  OS.zTop += 2;
  win.style.zIndex = OS.zTop;
  win.classList.add('focused');
  OS.activeWindow = win.id.replace('win-', '');
  updateTaskbarButtons();
  syncResizeFrameZIndex(win);
}

function initWindowControls(win) {
  const id = win.id.replace('win-', '');
  win.querySelector('.win-btn.close')?.   addEventListener('click', e => { e.stopPropagation(); closeWindow(id);    });
  win.querySelector('.win-btn.minimize')?.addEventListener('click', e => { e.stopPropagation(); minimizeWindow(id); });
  win.querySelector('.win-btn.maximize')?.addEventListener('click', e => { e.stopPropagation(); maximizeWindow(id); });
  win.addEventListener('pointerdown', e => {
    if (e.target.closest('.win-title-bar') || e.target.closest('.win-resize-handle')) return;
    focusWindow(win);
  });
}

function initWindowSystem() {
  document.querySelectorAll('.os-window').forEach(win => {
    win.style.removeProperty('left');
    win.style.removeProperty('top');
    win.style.removeProperty('width');
    win.style.removeProperty('height');
    win.style.removeProperty('min-width');
    win.style.removeProperty('min-height');

    makeWindowDraggable(win);
    addResizeHandles(win);
    initWindowControls(win);
  });
}

window.openWindowFromMenu = function(id) {
  openWindow(id);
  document.getElementById('start-menu')?.classList.add('hidden');
};
window.openWindow = openWindow;
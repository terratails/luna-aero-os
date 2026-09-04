'use strict';
/* js/window-resize.js */

const RESIZE_DIRS = [
  { dir:'n',  cursor:'n-resize'  },
  { dir:'ne', cursor:'ne-resize' },
  { dir:'e',  cursor:'e-resize'  },
  { dir:'se', cursor:'se-resize' },
  { dir:'s',  cursor:'s-resize'  },
  { dir:'sw', cursor:'sw-resize' },
  { dir:'w',  cursor:'w-resize'  },
  { dir:'nw', cursor:'nw-resize' },
];

const RESIZE_FRAMES = new WeakMap();

const GeometryScheduler = (() => {
  const dirty = new Set();
  let rafId = null;

  function tick() {
    rafId = null;
    if (!dirty.size) return;
    const batch = [...dirty];
    dirty.clear();
    batch.forEach(win => { if (win.isConnected) syncResizeFrame(win); });
    if (dirty.size && rafId == null) rafId = requestAnimationFrame(tick);
  }

  return {
    mark(win) {
      dirty.add(win);
      if (rafId == null) rafId = requestAnimationFrame(tick);
    },
  };
})();

function syncResizeFrame(win) {
  const entry = RESIZE_FRAMES.get(win);
  if (!entry) return;
  const frame = entry.frame;

  const isHidden    = win.classList.contains('hidden') || win.classList.contains('minimized') || win.style.display === 'none' || win.style.display === '';
  const isMaximized = win.classList.contains('maximized');

  if (isHidden) { frame.classList.add('hidden'); return; }
  frame.classList.remove('hidden');
  frame.classList.toggle('win-resize-frame-disabled', isMaximized);

  const rect = win.getBoundingClientRect();

  if (rect.width < 1 || rect.height < 1) {
    GeometryScheduler.mark(win);
    return;
  }

  const o = RESIZE_CONFIG.edgeOverhang;

  frame.style.left   = (rect.left   - o) + 'px';
  frame.style.top    = (rect.top    - o) + 'px';
  frame.style.width  = (rect.width  + o * 2) + 'px';
  frame.style.height = (rect.height + o * 2) + 'px';

  syncResizeFrameZIndex(win);
  updateGeometryHud(win, rect);
}

function syncResizeFrameZIndex(win) {
  const entry = RESIZE_FRAMES.get(win);
  if (!entry) return;
  const winZ = parseInt(win.style.zIndex, 10) || 200;
  entry.frame.style.zIndex = String(winZ + 1);
}

function scheduleResizeFrameSync(win, immediate) {
  if (!RESIZE_FRAMES.has(win)) return;
  if (immediate) {
    syncResizeFrame(win);
  }
  GeometryScheduler.mark(win);
}

function hideResizeFrame(win) {
  const entry = RESIZE_FRAMES.get(win);
  if (entry) entry.frame.classList.add('hidden');
}

function attachResizeKeyboard(win, handle, dir) {
  handle.addEventListener('keydown', e => {
    const arrowMap = {
      ArrowUp:    { n:-1, s: 1 },
      ArrowDown:  { n: 1, s:-1 },
      ArrowLeft:  { w:-1, e: 1 },
      ArrowRight: { w: 1, e:-1 },
    };
    const delta = arrowMap[e.key];
    if (!delta) return;
    e.preventDefault();
    const step = e.shiftKey ? 24 : 8;
    const id   = win.id.replace('win-', '');
    let dw = 0, dh = 0, dx = 0, dy = 0;

    if (dir.includes('e') && delta.e) dw += delta.e * step;
    if (dir.includes('w') && delta.w) { dw += delta.w * step; dx -= delta.w * step; }
    if (dir.includes('s') && delta.s) dh += delta.s * step;
    if (dir.includes('n') && delta.n) { dh += delta.n * step; dy -= delta.n * step; }

    growWindowBy(id, dw, dh, dx, dy);
  });
}

function attachResizeDrag(win, frame, handle, dir) {
  let resizing         = false;
  let activePointerId  = null;
  let startX, startY, startW, startH, startLeft, startTop;
  let pendingCX = 0, pendingCY = 0;
  let hasMoved  = false;
  let rafId     = null;

  function onDown(e) {
    if (activePointerId != null) return;
    if (e.button != null && e.button !== 0) return;

    const id = win.id.replace('win-', '');
    if (win.classList.contains('snapped') || win.classList.contains('maximized')) unSnapWindow(id);

    resizing        = true;
    hasMoved        = false;
    activePointerId = e.pointerId;
    startX = e.clientX; startY = e.clientY;

    const rect = win.getBoundingClientRect();
    startW = rect.width; startH = rect.height; startLeft = rect.left; startTop = rect.top;

    focusWindow(win);
    document.body.style.userSelect = 'none';
    document.body.style.cursor     = handle.style.cursor;
    handle.classList.add('resize-active');

    try { handle.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
    e.stopPropagation();
  }

  function computeGeometry(cx, cy) {
    const dx = cx - startX, dy = cy - startY;
    const { minW, maxW, minH, maxH } = getWindowMinMax(win.id.replace('win-', ''));

    let newW = startW, newH = startH, newLeft = startLeft, newTop = startTop;

    const maxAvailW_e    = OS.viewport.w - startLeft - 4;
    const taskbarH       = getComputedTaskbarHeight();
    const maxAvailH_s    = OS.viewport.h - taskbarH - startTop - 4;
    const maxAvailLeft_w = startLeft + startW - minW;
    const maxAvailTop_n  = startTop  + startH - minH;

    if (dir.includes('e')) newW = clamp(startW + dx, minW, Math.min(maxW, maxAvailW_e));
    if (dir.includes('w')) {
      const proposed = clamp(startW - dx, minW, maxW);
      newLeft = clamp(startLeft + (startW - proposed), 0, Math.max(0, maxAvailLeft_w));
      newW    = startW + startLeft - newLeft;
    }
    if (dir.includes('s')) newH = clamp(startH + dy, minH, Math.min(maxH, maxAvailH_s));
    if (dir.includes('n')) {
      const proposed = clamp(startH - dy, minH, maxH);
      newTop = clamp(startTop + (startH - proposed), 0, Math.max(0, maxAvailTop_n));
      newH   = startH + startTop - newTop;
    }

    return { w: Math.round(newW), h: Math.round(newH), left: Math.round(newLeft), top: Math.round(newTop) };
  }

  function flush() {
    rafId = null;
    if (!resizing) return;
    const { w, h, left, top } = computeGeometry(pendingCX, pendingCY);
    win.style.setProperty('--win-w', w + 'px');
    win.style.setProperty('--win-h', h + 'px');
    win.style.setProperty('--win-x', left + 'px');
    win.style.setProperty('--win-y', top + 'px');
    syncResizeFrame(win);
  }

  function onMove(e) {
    if (!resizing || e.pointerId !== activePointerId) return;
    const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
    if (!hasMoved && dx < RESIZE_CONFIG.minDragToCommit && dy < RESIZE_CONFIG.minDragToCommit) return;
    hasMoved  = true;
    pendingCX = e.clientX; pendingCY = e.clientY;
    if (rafId == null) rafId = requestAnimationFrame(flush);
  }

  function onUp(e) {
    if (!resizing || e.pointerId !== activePointerId) return;
    resizing        = false;
    activePointerId = null;
    document.body.style.userSelect = '';
    document.body.style.cursor     = '';
    handle.classList.remove('resize-active');
    if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
    if (hasMoved) flush();
    persistWindowGeometry(win.id.replace('win-', ''), currentGeometry(win));
    scheduleResizeFrameSync(win, true);
    try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
  }

  handle.addEventListener('pointerdown',   onDown);
  handle.addEventListener('pointermove',   onMove);
  handle.addEventListener('pointerup',     onUp);
  handle.addEventListener('pointercancel', onUp);
  handle.style.touchAction = 'none';
}

function addResizeHandles(win) {
  if (win.classList.contains('xp-player-shell')) return;

  const frame = document.createElement('div');
  frame.className     = 'win-resize-frame hidden';
  frame.dataset.forWin = win.id;
  win.insertAdjacentElement('afterend', frame);

  RESIZE_DIRS.forEach(({ dir, cursor }) => {
    const handle = document.createElement('div');
    handle.className    = `win-resize-handle win-resize-${dir}`;
    handle.dataset.dir  = dir;
    handle.style.cursor = cursor;
    handle.tabIndex      = 0;
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-label', `Resize window ${dir}`);
    frame.appendChild(handle);
    attachResizeDrag(win, frame, handle, dir);
    attachResizeKeyboard(win, handle, dir);
  });

  const resizeObserver = new ResizeObserver(() => scheduleResizeFrameSync(win));
  resizeObserver.observe(win);

  const mutationObserver = new MutationObserver(() => scheduleResizeFrameSync(win, true));
  mutationObserver.observe(win, { attributes: true, attributeFilter: ['class', 'style'] });

  RESIZE_FRAMES.set(win, { frame, resizeObserver, mutationObserver });

  scheduleResizeFrameSync(win);
  requestAnimationFrame(() => scheduleResizeFrameSync(win, true));
  setTimeout(() => scheduleResizeFrameSync(win, true), 60);
}
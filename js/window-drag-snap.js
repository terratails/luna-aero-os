'use strict';

function initSnapSystem() {
  const ghost = document.createElement('div');
  ghost.id        = 'snap-ghost';
  ghost.className = 'snap-ghost hidden';
  document.getElementById('desktop').appendChild(ghost);
  SNAP.ghostEl = ghost;

  const zones = ['top','left','right','bl','br','tl','tr'];
  zones.forEach(z => {
    const el = document.createElement('div');
    el.className   = `snap-zone-hint snap-zone-${z}`;
    el.dataset.zone = z;
    document.getElementById('desktop').appendChild(el);
    SNAP.zoneEls[z] = el;
  });
}

function computeSnapZone(cx, cy) {
  const vw = OS.viewport.w;
  const vh = OS.viewport.h;
  const taskbarH = getComputedTaskbarHeight();
  const usableH  = vh - taskbarH;
  const E = SNAP_EDGE_PX;
  const C = SNAP_CORNER_PX;

  const atTop    = cy < E;
  const atLeft   = cx < E;
  const atRight  = cx > vw - E;
  const atBottom = cy > usableH - E;

  const inTopLeft     = cx < C && cy < C;
  const inTopRight    = cx > vw - C && cy < C;
  const inBottomLeft  = cx < C && cy > usableH - C;
  const inBottomRight = cx > vw - C && cy > usableH - C;

  if (inTopLeft)     return 'tl';
  if (inTopRight)    return 'tr';
  if (inBottomLeft)  return 'bl';
  if (inBottomRight) return 'br';
  if (atTop)         return 'maximize';
  if (atLeft)        return 'left';
  if (atRight)       return 'right';
  return null;
}

function snapZoneGeometry(zone) {
  const vw       = OS.viewport.w;
  const taskbarH = getComputedTaskbarHeight();
  const usableH  = OS.viewport.h - taskbarH;
  const half     = Math.floor(vw / 2);
  const halfH    = Math.floor(usableH / 2);

  switch (zone) {
    case 'maximize': return { x: 0,    y: 0,     w: vw,   h: usableH };
    case 'left':     return { x: 0,    y: 0,     w: half, h: usableH };
    case 'right':    return { x: half, y: 0,     w: vw - half, h: usableH };
    case 'tl':       return { x: 0,    y: 0,     w: half, h: halfH };
    case 'tr':       return { x: half, y: 0,     w: vw - half, h: halfH };
    case 'bl':       return { x: 0,    y: halfH, w: half, h: usableH - halfH };
    case 'br':       return { x: half, y: halfH, w: vw - half, h: usableH - halfH };
    default:         return null;
  }
}

function showSnapGhost(zone) {
  const geo = snapZoneGeometry(zone);
  if (!geo || !SNAP.ghostEl) return;

  SNAP.ghostEl.style.left   = geo.x + 'px';
  SNAP.ghostEl.style.top    = geo.y + 'px';
  SNAP.ghostEl.style.width  = geo.w + 'px';
  SNAP.ghostEl.style.height = geo.h + 'px';
  SNAP.ghostEl.classList.remove('hidden');
  SNAP.ghostEl.setAttribute('data-zone', zone);

  Object.values(SNAP.zoneEls).forEach(el => el.classList.remove('active'));
  const hintKey = zone === 'maximize' ? 'top'
    : zone === 'left' ? 'left'
    : zone === 'right' ? 'right'
    : zone === 'tl' ? 'tl'
    : zone === 'tr' ? 'tr'
    : zone === 'bl' ? 'bl'
    : zone === 'br' ? 'br' : null;
  if (hintKey && SNAP.zoneEls[hintKey]) SNAP.zoneEls[hintKey].classList.add('active');

  SNAP.active = true;
  SNAP.zone   = zone;
}

function hideSnapGhost() {
  if (SNAP.ghostEl) SNAP.ghostEl.classList.add('hidden');
  Object.values(SNAP.zoneEls).forEach(el => el.classList.remove('active'));
  SNAP.active = false;
  SNAP.zone   = null;
}

function applySnapToWindow(id, zone) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  const geo = snapZoneGeometry(zone);
  if (!geo) return;

  if (!win.classList.contains('snapped') && !win.classList.contains('maximized')) {
    win.dataset.freeW = win.style.getPropertyValue('--win-w') || (win.offsetWidth  + 'px');
    win.dataset.freeH = win.style.getPropertyValue('--win-h') || (win.offsetHeight + 'px');
    win.dataset.freeX = win.style.getPropertyValue('--win-x') || (win.offsetLeft   + 'px');
    win.dataset.freeY = win.style.getPropertyValue('--win-y') || (win.offsetTop    + 'px');
  }

  win.classList.remove('maximized');
  win.classList.add('snapped');
  win.dataset.snapZone = zone;

  if (zone === 'maximize') {
    win.classList.add('maximized');
    win.classList.remove('snapped');
    win.dataset.prevW = win.dataset.freeW;
    win.dataset.prevH = win.dataset.freeH;
    win.dataset.prevX = win.dataset.freeX;
    win.dataset.prevY = win.dataset.freeY;
  } else {
    applyWindowGeometry(win, geo.w, geo.h, geo.x, geo.y);
  }

  hideSnapGhost();
  showToast('Aero Snap', getSnapLabel(zone), 'img:icons/070.ico');
  scheduleResizeFrameSync(win, true);
}

function getSnapLabel(zone) {
  const labels = {
    maximize: 'Maximized',
    left:     'Snapped to left half',
    right:    'Snapped to right half',
    tl:       'Snapped to top-left',
    tr:       'Snapped to top-right',
    bl:       'Snapped to bottom-left',
    br:       'Snapped to bottom-right',
  };
  return labels[zone] || 'Snapped';
}

function unSnapWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win) return;
  const wasSnapped   = win.classList.contains('snapped');
  const wasMaximized = win.classList.contains('maximized');
  if (!wasSnapped && !wasMaximized) return;

  win.classList.remove('snapped', 'maximized');
  delete win.dataset.snapZone;

  const fW = win.dataset.freeW || win.dataset.prevW;
  const fH = win.dataset.freeH || win.dataset.prevH;
  const fX = win.dataset.freeX || win.dataset.prevX;
  const fY = win.dataset.freeY || win.dataset.prevY;

  if (fW && fH) {
    win.style.setProperty('--win-w', fW);
    win.style.setProperty('--win-h', fH);
    win.style.setProperty('--win-x', fX || '80px');
    win.style.setProperty('--win-y', fY || '60px');
  } else {
    reclampWindow(id);
  }
  scheduleResizeFrameSync(win, true);
}

function showAllZoneHints() {
  Object.values(SNAP.zoneEls).forEach(el => el.classList.add('visible'));
}
function hideAllZoneHints() {
  Object.values(SNAP.zoneEls).forEach(el => el.classList.remove('visible', 'active'));
}

function makeWindowDraggable(win) {
  const titleBar = win.querySelector('.win-title-bar');
  if (!titleBar) return;

  let dragging          = false;
  let activePointerId   = null;
  let ox = 0, oy = 0;
  let dragStarted       = false;
  let startCX = 0, startCY = 0;
  let snapAuraTimer     = null;
  let wasSnappedOnStart = false;
  let dragRafId         = null;
  let pendingDragCX = 0, pendingDragCY = 0;
  let overshot          = false;

  function startDrag(cx, cy, pointerId) {
    wasSnappedOnStart = win.classList.contains('maximized') || win.classList.contains('snapped');
    activePointerId   = pointerId;
    startCX = cx; startCY = cy;
    dragging    = true;
    dragStarted = false;
    overshot    = false;
    document.body.style.userSelect = 'none';
    focusWindow(win);
  }

  function elastic(value, min, max) {
    if (value < min) return min - Math.pow(min - value, 0.72);
    if (value > max) return max + Math.pow(value - max, 0.72);
    return value;
  }

  function flushDrag() {
    dragRafId = null;
    if (!dragging || !dragStarted) return;
    const cx = pendingDragCX, cy = pendingDragCY;

    const taskbarH = getComputedTaskbarHeight();
    const usableH  = OS.viewport.h - taskbarH;
    const vw       = OS.viewport.w;
    const _fg      = currentGeometry(win);
    const ww       = _fg.w;
    const wh       = _fg.h;

    let nx = cx - ox;
    let ny = cy - oy;

    const minX = -ww + 80, maxX = vw - 60;
    const minY = 0,        maxY = Math.max(0, usableH - 30);

    const rawNx = nx, rawNy = ny;
    nx = elastic(nx, minX, maxX);
    ny = elastic(ny, minY, maxY);
    overshot = (rawNx !== nx) || (rawNy !== ny);

    const snapRight  = vw - ww;
    const snapBottom = usableH - wh;
    let   pixelSnapped = false;

    if (Math.abs(nx)              < SNAP_PROXIMITY_PX) { nx = 0;          pixelSnapped = true; }
    if (Math.abs(nx - snapRight)  < SNAP_PROXIMITY_PX) { nx = snapRight;  pixelSnapped = true; }
    if (Math.abs(ny)              < SNAP_PROXIMITY_PX) { ny = 0;          pixelSnapped = true; }
    if (Math.abs(ny - snapBottom) < SNAP_PROXIMITY_PX) { ny = snapBottom; pixelSnapped = true; }

    if (pixelSnapped) {
      win.classList.add('snap-aura');
      clearTimeout(snapAuraTimer);
      snapAuraTimer = setTimeout(() => win.classList.remove('snap-aura'), 480);
    } else {
      win.classList.remove('snap-aura');
    }

    win.style.setProperty('--win-x', nx + 'px');
    win.style.setProperty('--win-y', ny + 'px');
    syncResizeFrame(win);

    const zone = computeSnapZone(cx, cy);
    if (zone) { if (zone !== SNAP.zone) showSnapGhost(zone); }
    else if (SNAP.active) hideSnapGhost();
  }

  function moveDrag(cx, cy, pointerId) {
    if (!dragging || pointerId !== activePointerId) return;

    if (!dragStarted) {
      const dist = Math.hypot(cx - startCX, cy - startCY);
      if (dist < SNAP_DRAG_THRESHOLD) return;
      dragStarted = true;
      showAllZoneHints();

      const _sg = currentGeometry(win);
      if (wasSnappedOnStart) {
        const id = win.id.replace('win-', '');
        const fW = parseFloat(win.dataset.freeW || win.dataset.prevW) || _sg.w;
        const grabX = Math.min(cx, fW - 40);
        unSnapWindow(id);
        ox = grabX;
        oy = cy - _sg.top;
      } else {
        ox = cx - _sg.left;
        oy = cy - _sg.top;
      }
    }

    pendingDragCX = cx; pendingDragCY = cy;
    if (dragRafId == null) dragRafId = requestAnimationFrame(flushDrag);
  }

  function endDrag(pointerId) {
    if (!dragging || pointerId !== activePointerId) return;
    dragging        = false;
    activePointerId = null;
    document.body.style.userSelect = '';
    if (dragRafId != null) { cancelAnimationFrame(dragRafId); dragRafId = null; }

    if (dragStarted) {
      hideAllZoneHints();
      if (SNAP.active && SNAP.zone) {
        applySnapToWindow(win.id.replace('win-', ''), SNAP.zone);
      } else {
        hideSnapGhost();
        if (overshot) {
          win.classList.add('win-snap-return');
          reclampWindow(win.id.replace('win-', ''));
          setTimeout(() => win.classList.remove('win-snap-return'), 260);
        } else {
          persistWindowGeometry(win.id.replace('win-', ''), currentGeometry(win));
        }
      }
    } else {
      hideAllZoneHints();
      hideSnapGhost();
    }

    dragStarted       = false;
    wasSnappedOnStart = false;
    overshot          = false;
    win.classList.remove('snap-aura');
    scheduleResizeFrameSync(win, true);
  }

  titleBar.addEventListener('dblclick', e => {
    if (e.target.closest('.win-btn')) return;
    maximizeWindow(win.id.replace('win-', ''));
  });

  titleBar.addEventListener('pointerdown', e => {
    if (e.target.closest('.win-btn')) return;
    if (e.button != null && e.button !== 0) return;
    if (activePointerId != null) return;
    e.preventDefault();
    focusWindow(win);
    try { titleBar.setPointerCapture(e.pointerId); } catch (_) {}
    startDrag(e.clientX, e.clientY, e.pointerId);
  });
  titleBar.addEventListener('pointermove', e => moveDrag(e.clientX, e.clientY, e.pointerId));
  titleBar.addEventListener('pointerup', e => {
    endDrag(e.pointerId);
    try { titleBar.releasePointerCapture(e.pointerId); } catch (_) {}
  });
  titleBar.addEventListener('pointercancel', e => endDrag(e.pointerId));
  titleBar.style.touchAction = 'none';
}
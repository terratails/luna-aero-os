'use strict';


function clamp(v, lo, hi) { return Math.max(lo, Math.min(v, hi)); }

function getComputedTaskbarHeight() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--taskbar-h').trim();
  const px  = parseFloat(raw);
  return Number.isFinite(px) ? px : 34;
}

function resolveWindowGeometry(id) {
  const g = WIN_GEOMETRY[id];
  const vw = OS.viewport.w, vh = OS.viewport.h;
  const taskbarH = getComputedTaskbarHeight();
  const usableH  = vh - taskbarH;

  if (!g) {
    return {
      w: clamp(vw * 0.5, 380, vw - 24),
      h: clamp(usableH * 0.6, 300, usableH - 24),
    };
  }

  let wFrac = g.wFrac, hFrac = g.hFrac;
  if (OS.compact) { wFrac = Math.min(wFrac * 1.35, 0.94); hFrac = Math.min(hFrac * 1.1, 0.86); }

  const w = clamp(Math.round(vw      * wFrac), Math.min(g.minW, vw      - 16), Math.min(g.maxW, vw      - 16));
  const h = clamp(Math.round(usableH * hFrac), Math.min(g.minH, usableH - 16), Math.min(g.maxH, usableH - 16));
  return { w, h };
}

let cascadeCounter = 0;
function computeOpenPosition(w, h) {
  const vw = OS.viewport.w, vh = OS.viewport.h;
  const taskbarH = getComputedTaskbarHeight();
  const usableH  = vh - taskbarH;
  const margin   = 10, step = 26;

  let left = (vw * 0.5 - w * 0.5) + (cascadeCounter % 6) * step - step * 2.5;
  let top  = (usableH * 0.5 - h * 0.5) + (cascadeCounter % 6) * step - step * 2.5;
  cascadeCounter++;

  return {
    left: Math.round(clamp(left, margin, Math.max(margin, vw      - w - margin))),
    top:  Math.round(clamp(top,  margin, Math.max(margin, usableH - h - margin))),
  };
}

function applyWindowGeometry(win, w, h, left, top) {
  win.style.setProperty('--win-w', w    + 'px');
  win.style.setProperty('--win-h', h    + 'px');
  win.style.setProperty('--win-x', left + 'px');
  win.style.setProperty('--win-y', top  + 'px');
  scheduleResizeFrameSync(win, true);
  persistWindowGeometry(win.id.replace('win-', ''), { w, h, left, top });
}

function reclampWindow(id) {
  const win = document.getElementById('win-' + id);
  if (!win || win.classList.contains('maximized') || win.classList.contains('snapped')) return;

  const vw      = OS.viewport.w;
  const taskbarH = getComputedTaskbarHeight();
  const usableH  = OS.viewport.h - taskbarH;
  const margin   = 8;
  const g        = WIN_GEOMETRY[id];

  const minW = g ? Math.min(g.minW, vw      - margin * 2) : 280;
  const minH = g ? Math.min(g.minH, usableH - margin * 2) : 190;

  const newW    = clamp(win.offsetWidth,  minW, vw      - margin * 2);
  const newH    = clamp(win.offsetHeight, minH, usableH - margin * 2);
  const newLeft = clamp(win.offsetLeft,  margin, Math.max(margin, vw      - newW - margin));
  const newTop  = clamp(win.offsetTop,   margin, Math.max(margin, usableH - newH - margin));

  applyWindowGeometry(win, newW, newH, newLeft, newTop);
}

function getWindowMinMax(id) {
  const g = WIN_GEOMETRY[id];
  const taskbarH = getComputedTaskbarHeight();
  return {
    minW: g ? Math.min(g.minW, OS.viewport.w - 24)           : 280,
    maxW: g ? Math.min(g.maxW, OS.viewport.w - 8)             : OS.viewport.w,
    minH: g ? Math.min(g.minH, OS.viewport.h - taskbarH - 24) : 190,
    maxH: g ? Math.min(g.maxH, OS.viewport.h - taskbarH - 8)  : OS.viewport.h,
  };
}

function currentGeometry(win) {
  return {
    w:    parseFloat(win.style.getPropertyValue('--win-w')) || win.offsetWidth,
    h:    parseFloat(win.style.getPropertyValue('--win-h')) || win.offsetHeight,
    left: parseFloat(win.style.getPropertyValue('--win-x')) || win.offsetLeft,
    top:  parseFloat(win.style.getPropertyValue('--win-y')) || win.offsetTop,
  };
}

const GEO_STORE_PREFIX = 'luna-geo:';

function persistWindowGeometry(id, geo) {
  try { sessionStorage.setItem(GEO_STORE_PREFIX + id, JSON.stringify(geo)); } catch (e) {}
}

function restoreWindowGeometry(id) {
  let raw;
  try { raw = sessionStorage.getItem(GEO_STORE_PREFIX + id); } catch (e) { return null; }
  if (!raw) return null;
  let geo;
  try { geo = JSON.parse(raw); } catch (e) { return null; }
  if (!geo || typeof geo.w !== 'number' || typeof geo.h !== 'number') return null;

  const { minW, maxW, minH, maxH } = getWindowMinMax(id);
  const taskbarH = getComputedTaskbarHeight();
  const w    = clamp(geo.w, minW, maxW);
  const h    = clamp(geo.h, minH, maxH);
  const left = clamp(geo.left, 0, Math.max(0, OS.viewport.w - w));
  const top  = clamp(geo.top,  0, Math.max(0, OS.viewport.h - taskbarH - h));
  return { w: Math.round(w), h: Math.round(h), left: Math.round(left), top: Math.round(top) };
}

function growWindowBy(id, dw, dh, dx = 0, dy = 0) {
  const win = document.getElementById('win-' + id);
  if (!win || win.classList.contains('maximized')) return;
  const g   = currentGeometry(win);
  const { minW, maxW, minH, maxH } = getWindowMinMax(id);
  const taskbarH = getComputedTaskbarHeight();

  const newW    = clamp(g.w + dw, minW, maxW);
  const newH    = clamp(g.h + dh, minH, maxH);
  const newLeft = clamp(g.left + dx, 0, Math.max(0, OS.viewport.w - newW));
  const newTop  = clamp(g.top  + dy, 0, Math.max(0, OS.viewport.h - taskbarH - newH));

  applyWindowGeometry(win, Math.round(newW), Math.round(newH), Math.round(newLeft), Math.round(newTop));
}

function nudgeWindow(id, dx, dy) {
  const win = document.getElementById('win-' + id);
  if (!win || win.classList.contains('maximized') || win.classList.contains('snapped')) return;
  const g = currentGeometry(win);
  const taskbarH = getComputedTaskbarHeight();
  const newLeft  = clamp(g.left + dx, -g.w + 60, OS.viewport.w - 60);
  const newTop   = clamp(g.top  + dy, 0, Math.max(0, OS.viewport.h - taskbarH - 30));
  applyWindowGeometry(win, g.w, g.h, Math.round(newLeft), Math.round(newTop));
}

let geoHudEnabled = false;
function toggleGeometryHud() {
  geoHudEnabled = !geoHudEnabled;
  const hud = document.getElementById('geo-debug-hud');
  if (hud) hud.classList.toggle('hidden', !geoHudEnabled);
  if (!geoHudEnabled) return;
  const win = OS.activeWindow ? document.getElementById('win-' + OS.activeWindow) : null;
  if (win) scheduleResizeFrameSync(win, true);
}

function updateGeometryHud(win, rect) {
  if (!geoHudEnabled) return;
  const id = win.id.replace('win-', '');
  if (id !== OS.activeWindow) return;
  const hud = document.getElementById('geo-debug-hud');
  if (!hud) return;
  hud.textContent = `${id}  x:${Math.round(rect.left)} y:${Math.round(rect.top)} w:${Math.round(rect.width)} h:${Math.round(rect.height)}`;
}
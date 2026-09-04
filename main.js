'use strict';

const OS = {
  bootComplete:      false,
  loggedIn:          false,
  openWindows:       new Map(),
  zTop:              200,
  activeWindow:      null,
  screensaverTimer:  null,
  screensaverActive: false,
  idleTimeout:       120000,
  altTabOpen:        false,
  altTabIndex:       0,
  calOpen:           false,
  calMonth:          new Date().getMonth(),
  calYear:           new Date().getFullYear(),
  viewport:          { w: window.innerWidth, h: window.innerHeight },
  compact:           window.innerWidth <= 1180,
  narrow:            window.innerWidth <= 860,
};

const SNAP = {
  active:       false,
  zone:         null,
  ghostEl:      null,
  zoneEls:      {},
};

const WIN_GEOMETRY = {
  about:      { wFrac:0.50, hFrac:0.62, minW:460, minH:380, maxW:860,  maxH:680 },
  experience: { wFrac:0.56, hFrac:0.68, minW:480, minH:420, maxW:920,  maxH:720 },
  projects:   { wFrac:0.56, hFrac:0.66, minW:460, minH:420, maxW:940,  maxH:720 },
  services:   { wFrac:0.54, hFrac:0.62, minW:460, minH:400, maxW:900,  maxH:680 },
  contact:    { wFrac:0.46, hFrac:0.70, minW:420, minH:480, maxW:720,  maxH:760 },
  resume:     { wFrac:0.38, hFrac:0.56, minW:380, minH:380, maxW:600,  maxH:640 },
  theme:      { wFrac:0.48, hFrac:0.60, minW:440, minH:420, maxW:780,  maxH:660 },
  terminal:   { wFrac:0.48, hFrac:0.52, minW:420, minH:340, maxW:800,  maxH:620 },
  calculator: { wFrac:0.21, hFrac:0.52, minW:280, minH:400, maxW:340,  maxH:500 },
  notepad:    { wFrac:0.40, hFrac:0.48, minW:380, minH:320, maxW:680,  maxH:560 },
  sysinfo:    { wFrac:0.44, hFrac:0.52, minW:420, minH:380, maxW:700,  maxH:580 },
  music:      { wFrac:0.21, hFrac:0.001,minW:280, minH:10,  maxW:320,  maxH:10  },
};

const TASKBAR_ICONS = {
  about:      'icons/075.ico',
  photos:     'icons/094.ico',
  experience: 'icons/030.ico',
  projects:   'icons/053.ico',
  services:   'icons/349.ico',
  contact:    'icons/093.ico',
  terminal:   'icons/285.ico',
  music:      'icons/049.ico',
  sysinfo:    'icons/vista_white.ico',
  resume:     'icons/vista_book_1.ico',
  theme:      'icons/windowsxpicon.ico',
  notepad:    'icons/notepad.ico',
  calculator: 'icons/windowsxpicon.ico',
};

const WINDOW_ICONS = {
  about:      '►',
  experience: '▣',
  projects:   '▤',
  services:   '◈',
  contact:    '✆',
  resume:     '▦',
  terminal:   '▶',
  music:      '♪',
  calculator: '±',
  notepad:    '▤',
  sysinfo:    '▣',
  theme:      '◉',
  photos:     '▨',
};

const SNAP_EDGE_PX        = 24;
const SNAP_CORNER_PX      = 80;
const SNAP_DRAG_THRESHOLD = 12;
const SNAP_PROXIMITY_PX   = 16;

const RESIZE_CONFIG = {
  edgeHit:         10,
  cornerHit:       16,
  edgeOverhang:     4,
  minDragToCommit:  2,
};

const BOOT_STEPS = [
  'Loading Glen\'s workspace...',
  'Starting Luna Aero OS · 2026 Edition...',
  'Mounting portfolio environment...',
  'Loading project records...',
  'Initializing window manager...',
  'Starting Aero Snap engine...',
  'Loading audio subsystem...',
  'Resolving viewport geometry...',
  'All systems ready.',
];

function initBoot() {
  const canvas = document.getElementById('boot-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  drawSceneField(ctx, canvas, 'boot');

  const progressEl = document.getElementById('boot-progress');
  const statusEl   = document.getElementById('boot-status');
  let step = 0;

  function nextStep() {
    if (step >= BOOT_STEPS.length) { setTimeout(showLogin, 380); return; }
    progressEl.style.width = Math.round((step / BOOT_STEPS.length) * 100) + '%';
    statusEl.textContent   = BOOT_STEPS[step++];
    setTimeout(nextStep, 260 + Math.random() * 220);
  }
  setTimeout(nextStep, 280);
}

function showLogin() {
  const boot  = document.getElementById('boot-screen');
  const login = document.getElementById('login-screen');
  boot.style.transition = 'opacity 0.5s ease';
  boot.style.opacity    = '0';
  setTimeout(() => {
    boot.style.display  = 'none';
    login.style.display = 'flex';
    initLoginCanvas();
    initLoginClock();
  }, 500);
}

function initLoginCanvas() {
  const canvas = document.getElementById('login-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  drawSceneField(ctx, canvas, 'login');
}

let loginClockInterval;
function initLoginClock() {
  function tick() {
    const now  = new Date();
    const h    = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh   = (h % 12 || 12).toString().padStart(2, '0');
    const mm   = m.toString().padStart(2, '0');
    const ss   = s.toString().padStart(2, '0');
    const el   = document.getElementById('login-clock');
    const de   = document.getElementById('login-date');
    if (el) el.textContent = `${hh}:${mm}:${ss} ${ampm}`;
    if (de) de.textContent = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }
  tick();
  loginClockInterval = setInterval(tick, 1000);
}

function doLogin() {
  clearInterval(loginClockInterval);
  const login   = document.getElementById('login-screen');
  login.style.transition = 'opacity 0.6s ease';
  login.style.opacity    = '0';
  setTimeout(() => {
    login.style.display = 'none';
    const desktop = document.getElementById('desktop');
    desktop.classList.remove('hidden');
    desktop.style.display = 'block';
    OS.loggedIn    = true;
    OS.bootComplete = true;
    initDesktop();
  }, 600);
}

const sceneFrames = new Map();

function drawSceneField(ctx, canvas, key) {
  const bubbles = Array.from({ length: 14 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: 24 + Math.random() * 70, phase: Math.random() * Math.PI * 2,
    speed: 0.001 + Math.random() * 0.002,
    vx: (Math.random() - 0.5) * 0.18, vy: -0.06 - Math.random() * 0.12,
  }));
  const sparkles = Array.from({ length: 30 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: 0.6 + Math.random() * 1.8,
    vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
    a: 0.25 + Math.random() * 0.45,
  }));

  function frame(t) {
const theme = document.documentElement.getAttribute('data-theme') || 'aqua-deep';
const WALLPAPER_COLORS = {
  'aqua-deep':         ['#3f92e0', '#7cc4f2', '#c9e8f7', '#eef8ee'],
  'aurora':            ['#0a7a5a', '#18b888', '#7ef5d4', '#eefff9'],
  'sunset':            ['#c05010', '#e88030', '#f8c080', '#fff6ee'],
  'violet-crystal':    ['#5020a0', '#8040d8', '#d0a0ff', '#f8f0ff'],
  'glacier':           ['#1878c0', '#38a0e0', '#c8e8f8', '#f0f9ff'],
  'midnight-steel':    ['#1a2848', '#303e60', '#a0b4d8', '#eef0f8'],
  'rose-quartz':       ['#a02060', '#d84888', '#f8a8cc', '#fff0f7'],
  'carbon':            ['#202020', '#404040', '#a0a0a0', '#f4f4f4'],
  'millennium-silver': ['#6fb8ec', '#a6d8f5', '#e0f2fc', '#ffffff'],
};
const [c0, c1, c2, c3] = WALLPAPER_COLORS[theme] || WALLPAPER_COLORS['aqua-deep'];
const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
grd.addColorStop(0,    c0);
grd.addColorStop(0.42, c1);
grd.addColorStop(0.72, c2);
grd.addColorStop(1,    c3);
ctx.fillStyle = grd;
ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const waveY = canvas.height * (0.28 + i * 0.14) + Math.sin(t * 0.0004 + i * 2) * 34;
      ctx.moveTo(0, waveY);
      for (let x = 0; x <= canvas.width; x += 24)
        ctx.lineTo(x, waveY + Math.sin(x * 0.004 + t * 0.0009 + i) * 26);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,255,255,${0.05 - i * 0.01})`;
      ctx.fill();
    }

    bubbles.forEach(b => {
      b.x += b.vx; b.y += b.vy;
      if (b.y + b.r < 0) { b.y = canvas.height + b.r; b.x = Math.random() * canvas.width; }
      if (b.x < -b.r) b.x = canvas.width + b.r;
      if (b.x > canvas.width + b.r) b.x = -b.r;
      b.phase += b.speed;
      const alpha = 0.10 + Math.sin(b.phase) * 0.05;
      const grad  = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 0, b.x, b.y, b.r);
      grad.addColorStop(0,    `rgba(255,255,255,${alpha * 2.2})`);
      grad.addColorStop(0.45, `rgba(200,235,255,${alpha})`);
      grad.addColorStop(1,    `rgba(120,190,240,0)`);
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 1.6})`; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.22, b.r * 0.12, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha * 3})`; ctx.fill();
    });

    sparkles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;  if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.a})`; ctx.fill();
    });

    sceneFrames.set(key, requestAnimationFrame(frame));
  }
  sceneFrames.set(key, requestAnimationFrame(frame));
}

function initDesktop() {
  initWallpaper();
  initDesktopIcons();
  initWindowSystem();
  initTaskbar();
  initStartMenu();
  initCalendar();
  initContextMenu();
  initKeyboardShortcuts();
  initShortcutsPanel();
  initThemePicker();
  initNotepad();
  initCalculator();
  initTerminal();
  initExperienceWindow();
  initProjectsWindow();
  initSystemInfo();
  initMusicPlayer();
  initViewportResponder();
  initProfilePicture();
  initAvatarTilt();
  initSnapSystem();
  resetIdleTimer();
  initPhotoViewer();
  initContactForm();
  showToast('Welcome', 'Luna Aero OS loaded. Drag windows to screen edges to snap, or grab any edge/corner to resize!', 'img:icons/515.ico');
}

function initWallpaper() {
  const canvas = document.getElementById('wallpaper-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  drawSceneField(ctx, canvas, 'wallpaper');
}

function initProfilePicture() {
  ['asb-profile-img', 'sm-profile-img'].forEach(id => {
    const img = document.getElementById(id);
    if (!img) return;
    img.addEventListener('error', () => {
      const fallback = img.closest('.asb-avatar, .xp-sm-avatar-orb')
        ?.querySelector('.asb-av-core, .xp-sm-orb-core');
      if (fallback) fallback.style.display = 'flex';
      img.style.display = 'none';
    });
    img.addEventListener('load', () => {
      const fallback = img.closest('.asb-avatar, .xp-sm-avatar-orb')
        ?.querySelector('.asb-av-core, .xp-sm-orb-core');
      if (fallback) fallback.style.display = 'none';
      img.style.display = 'block';
    });
    if (img.complete && img.naturalWidth > 0) img.dispatchEvent(new Event('load'));
  });
  animateAboutStackBars();
}

function animateAboutStackBars() {
  document.querySelectorAll('.asb-stack-fill, .skr-fill').forEach(fill => {
    const w = fill.dataset.w || 0;
    setTimeout(() => { fill.style.width = w + '%'; }, 200);
  });
}

function initViewportResponder() {
  let rafPending = false;
  window.addEventListener('resize', () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { handleViewportChange(); rafPending = false; });
  });
  handleViewportChange();
}

function handleViewportChange() {
  const w = window.innerWidth, h = window.innerHeight;
  OS.viewport = { w, h };
  const wasNarrow = OS.narrow;
  OS.compact = w <= 1180;
  OS.narrow  = w <= 860;

  document.documentElement.style.setProperty('--vp-w', w);
  document.documentElement.style.setProperty('--vp-h', h);
  document.documentElement.style.setProperty('--is-compact', OS.compact ? 1 : 0);
  document.documentElement.style.setProperty('--is-narrow',  OS.narrow  ? 1 : 0);

  ['wallpaper-canvas','boot-canvas','login-canvas','m-hero-canvas','screensaver-canvas'].forEach(id => {
    const c = document.getElementById(id);
    if (c && c.offsetParent !== null) { c.width = w; c.height = h; }
  });

  if (OS.loggedIn && !OS.narrow) {
    OS.openWindows.forEach((data, id) => {
      if (!data.minimized) {
        reclampWindow(id);
        const win = document.getElementById('win-' + id);
        if (win) scheduleResizeFrameSync(win, true);
      }
    });
  }

  if (wasNarrow !== OS.narrow && OS.loggedIn && OS.narrow) {
    document.getElementById('start-menu')?.classList.add('hidden');
    document.getElementById('cal-popover')?.classList.add('hidden');
  }
}

function initDesktopIcons() {
  document.querySelectorAll('.dicon').forEach(icon => {
    let clickTimer = null;
    icon.addEventListener('click', () => {
      document.querySelectorAll('.dicon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; openWindowFromIcon(icon); }
      else { clickTimer = setTimeout(() => { clickTimer = null; }, 280); }
    });
    icon.addEventListener('dblclick', () => {
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
      openWindowFromIcon(icon);
    });
    icon.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openWindowFromIcon(icon);
    });
  });
  document.getElementById('desktop')?.addEventListener('click', e => {
    if (!e.target.closest('.dicon'))
      document.querySelectorAll('.dicon').forEach(i => i.classList.remove('selected'));
  });
}

function openWindowFromIcon(icon) {
  const wid = icon.dataset.window;
  if (wid) openWindow(wid);
}

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

function getSnapIcon(zone) {
  const icons = {
    maximize: '⬜', left: '◧', right: '◨',
    tl: '◸', tr: '◹', bl: '◺', br: '◿',
  };
  return icons[zone] || '⊞';
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

function initTaskbar() {
  function updateClock() {
    const now  = new Date();
    const h    = now.getHours(), m = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh   = (h % 12 || 12).toString().padStart(2, '0');
    const mm   = m.toString().padStart(2, '0');
    const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const tEl  = document.getElementById('tb-time');
    const dEl  = document.getElementById('tb-date-sm');
    if (tEl) tEl.textContent = `${hh}:${mm} ${ampm}`;
    if (dEl) dEl.textContent = `${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()}`;
  }
  updateClock();
  setInterval(updateClock, 10000);

  document.getElementById('tb-clock-wrap')?.addEventListener('click',    e => { e.stopPropagation(); toggleCalendar(); });
  document.getElementById('tb-terminal-btn')?.addEventListener('click',  () => { openWindow('terminal'); closeTrayFlyout(); });
  document.getElementById('tb-music-btn')?.addEventListener('click',     () => { openWindow('music');    closeTrayFlyout(); });
  document.getElementById('tb-theme-toggle')?.addEventListener('click',  () => { openWindow('theme');    closeTrayFlyout(); });
  document.getElementById('tb-shortcuts-btn')?.addEventListener('click', () => { toggleShortcutsPanel(); closeTrayFlyout(); });

  initTrayFlyout();
}

function initTrayFlyout() {
  const btn    = document.getElementById('tb-chevron-btn');
  const flyout = document.getElementById('tb-flyout');
  if (!btn || !flyout) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = !flyout.classList.contains('hidden');
    if (isOpen) closeTrayFlyout(); else openTrayFlyout();
  });

  document.addEventListener('click', e => {
    if (!flyout.contains(e.target) && e.target !== btn && !btn.contains(e.target)) closeTrayFlyout();
  });
}

function openTrayFlyout() {
  document.getElementById('tb-flyout')?.classList.remove('hidden');
  document.getElementById('tb-chevron-btn')?.setAttribute('aria-expanded', 'true');
  document.getElementById('tb-chevron-btn')?.classList.add('active');
}

function closeTrayFlyout() {
  document.getElementById('tb-flyout')?.classList.add('hidden');
  document.getElementById('tb-chevron-btn')?.setAttribute('aria-expanded', 'false');
  document.getElementById('tb-chevron-btn')?.classList.remove('active');
}1

function updateTaskbarButtons() {
  const container = document.getElementById('tb-open-wins');
  if (!container) return;
  container.innerHTML = '';
  OS.openWindows.forEach((data, id) => {
    const btn = document.createElement('button');
    btn.className = 'tb-win-btn' + (OS.activeWindow === id && !data.minimized ? ' active' : '');
      const icoSrc = TASKBAR_ICONS[id];
      const icoHtml = icoSrc ? `<img src="${icoSrc}" style="width:14px;height:14px;object-fit:contain;flex-shrink:0;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));" onerror="this.style.display='none'" alt=""/>` : '';
      btn.innerHTML = `${icoHtml}<span>${escHtml(data.title.split('—')[0].trim())}</span>`;
    btn.addEventListener('click', () => {
      if (data.minimized)             restoreWindow(id);
      else if (OS.activeWindow === id) minimizeWindow(id);
      else { restoreWindow(id); focusWindow(document.getElementById('win-' + id)); }
    });
    container.appendChild(btn);
  });
}

let tbNowPlayingEl = null;
function updateTaskbarNowPlaying(title, playing) {
  if (!tbNowPlayingEl) {
    tbNowPlayingEl = document.createElement('div');
    tbNowPlayingEl.className = 'tb-now-playing';
    tbNowPlayingEl.id        = 'tb-now-playing';
     tbNowPlayingEl.innerHTML = `<img src="icons/432.ico" class="tb-np-icon-img" alt=""/><div class="tb-np-divider"></div><div class="tb-eq-bars"><div class="tb-eq-bar"></div><div class="tb-eq-bar"></div><div class="tb-eq-bar"></div><div class="tb-eq-bar"></div></div><div class="tb-np-wrap"><span class="tb-np-text" id="tb-np-text"></span></div>`;
    tbNowPlayingEl.addEventListener('click', () => openWindow('music'));
    document.querySelector('.tb-left')?.appendChild(tbNowPlayingEl);
  }
  const textEl = document.getElementById('tb-np-text');
  if (textEl && title) textEl.textContent = `${title}  ·  ·  ·  `;
  tbNowPlayingEl.classList.toggle('stopped', !playing || !title);
  tbNowPlayingEl.classList.toggle('paused', !!title && !playing);
}

function initStartMenu() {
  const btn  = document.getElementById('tb-start');
  const menu = document.getElementById('start-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('hidden'); });
  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target))
      menu.classList.add('hidden');
  });

  document.getElementById('sm-cascade-btn')?.addEventListener('click',    () => { cascadeWindows(); menu.classList.add('hidden'); });
  document.getElementById('sm-close-all-btn')?.addEventListener('click',  () => { OS.openWindows.forEach((_, id) => minimizeWindow(id)); menu.classList.add('hidden'); });
  document.getElementById('sm-shortcuts-btn')?.addEventListener('click',  () => { menu.classList.add('hidden'); toggleShortcutsPanel(); });
}

window.openWindowFromMenu = function(id) {
  openWindow(id);
  document.getElementById('start-menu')?.classList.add('hidden');
};
window.openWindow = openWindow;

function cascadeWindows() {
  let i = 0;
  const taskbarH = getComputedTaskbarHeight();
  const usableH  = OS.viewport.h - taskbarH;
  OS.openWindows.forEach((data, id) => {
    if (data.minimized || data.el.classList.contains('maximized')) return;
    const win  = data.el;
    const step = 30;
    const _cwg = currentGeometry(win);
    const left = clamp(40 + i * step, 8, Math.max(8, OS.viewport.w - _cwg.w - 8));
    const top  = clamp(30 + i * step, 8, Math.max(8, usableH       - _cwg.h - 8));
    win.style.setProperty('--win-x', left + 'px');
    win.style.setProperty('--win-y', top  + 'px');
    scheduleResizeFrameSync(win, true);
    i++;
  });
}

function initCalendar() {
  const popover = document.getElementById('cal-popover');
  if (!popover) return;

  function updateCalClock() {
    const now  = new Date();
    const h    = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh   = (h % 12 || 12).toString().padStart(2, '0');
    const mm   = m.toString().padStart(2, '0');
    const ss   = s.toString().padStart(2, '0');
    const el   = document.getElementById('cal-clock');
    const de   = document.getElementById('cal-date-full');
    if (el) el.textContent = `${hh}:${mm}:${ss} ${ampm}`;
    if (de) de.textContent = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }
  setInterval(updateCalClock, 1000);
  updateCalClock();

  document.getElementById('cal-prev')?.addEventListener('click', () => { OS.calMonth--; if (OS.calMonth < 0) { OS.calMonth = 11; OS.calYear--; } renderCalGrid(); });
  document.getElementById('cal-next')?.addEventListener('click', () => { OS.calMonth++; if (OS.calMonth > 11) { OS.calMonth = 0; OS.calYear++; } renderCalGrid(); });
  renderCalGrid();

  document.addEventListener('click', e => {
    if (!popover.contains(e.target) && !e.target.closest('#tb-clock-wrap'))
      { popover.classList.add('hidden'); OS.calOpen = false; }
  });
}

function toggleCalendar() {
  const popover = document.getElementById('cal-popover');
  if (!popover) return;
  OS.calOpen = !OS.calOpen;
  popover.classList.toggle('hidden', !OS.calOpen);
}

function renderCalGrid() {
  const grid  = document.getElementById('cal-grid');
  const label = document.getElementById('cal-month-label');
  if (!grid || !label) return;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  label.textContent = `${months[OS.calMonth]} ${OS.calYear}`;
  const firstDay    = new Date(OS.calYear, OS.calMonth, 1).getDay();
  const daysInMonth = new Date(OS.calYear, OS.calMonth + 1, 0).getDate();
  const today       = new Date();
  grid.innerHTML    = '';
  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement('div'); cell.className = 'cal-cell empty'; grid.appendChild(cell);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const cell    = document.createElement('div');
    const isToday = d === today.getDate() && OS.calMonth === today.getMonth() && OS.calYear === today.getFullYear();
    cell.className  = 'cal-cell' + (isToday ? ' today' : '');
    cell.textContent = d;
    grid.appendChild(cell);
  }
}

function initContextMenu() {
  const menu = document.getElementById('ctx-menu');
  if (!menu) return;
  document.getElementById('desktop')?.addEventListener('contextmenu', e => {
    if (e.target.closest('.os-window') || e.target.closest('#taskbar')) return;
    e.preventDefault();
    menu.classList.remove('hidden');
    menu.style.left = clamp(e.clientX, 4, OS.viewport.w  - menu.offsetWidth  - 8) + 'px';
    menu.style.top  = clamp(e.clientY, 4, OS.viewport.h  - menu.offsetHeight - 52) + 'px';
  });
  document.addEventListener('click', () => menu.classList.add('hidden'));
  menu.querySelectorAll('.ctx-item[data-action]').forEach(item => {
    item.addEventListener('click', () => {
      const a = item.dataset.action;
      if (a === 'refresh')     initWallpaper();
      else if (a === 'shortcuts') toggleShortcutsPanel();
      else if (a)              openWindow(a);
    });
  });
}

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

function initThemePicker() {
  const grid = document.getElementById('tp-grid');
  if (!grid) return;
  const saved = (() => { try { return sessionStorage.getItem('luna-theme') || 'aqua-deep'; } catch(e) { return 'aqua-deep'; } })();
  applyTheme(saved);
  grid.querySelectorAll('.tp-card').forEach(card => {
    card.addEventListener('click', () => applyTheme(card.dataset.theme));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') applyTheme(card.dataset.theme); });
  });
}

function applyTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
  document.querySelectorAll('.tp-card').forEach(c => c.dataset.active = (c.dataset.theme === name) ? 'true' : 'false');
  const label = document.getElementById('theme-status-label');
  const card  = document.querySelector(`.tp-card[data-theme="${name}"]`);
  const themeName = card?.querySelector('.tp-card-name')?.textContent || name;
  if (label) label.textContent = `Active: ${themeName}`;
  const liveName = document.getElementById('tp-live-name');
  if (liveName) liveName.textContent = themeName;
  try { sessionStorage.setItem('luna-theme', name); } catch(e) {}
  initWallpaper();
}

function showToast(title, desc, icon = '💧') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div'); toast.className = 'toast';
  const iconHtml = icon.startsWith('img:')
    ? `<img src="${escHtml(icon.slice(4))}" class="toast-icon-img" alt="" onerror="this.style.display='none'"/>`
    : `<span class="toast-icon">${icon}</span>`;
  toast.innerHTML = `${iconHtml}<div class="toast-body"><div class="toast-title">${escHtml(title)}</div><div class="toast-desc">${escHtml(desc)}</div></div><button class="toast-close" aria-label="Dismiss">×</button>`;
  toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
  container.appendChild(toast);
  setTimeout(() => dismissToast(toast), 4000);
}

function dismissToast(toast) {
  toast.classList.add('removing');
  setTimeout(() => toast.remove(), 300);
}

function initNotepad() {
  const ta      = document.getElementById('notepad-ta');
  const wc      = document.getElementById('notepad-wc');
  const saveBtn = document.getElementById('notepad-save');
  const clrBtn  = document.getElementById('notepad-clear');
  if (!ta) return;
  try { ta.value = sessionStorage.getItem('luna-notepad') || ''; } catch(e) {}
  updateWC();

  function updateWC() {
    const text  = ta.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (wc) wc.textContent = `${text.length} chars · ${words} words`;
  }
  ta.addEventListener('input', () => { updateWC(); try { sessionStorage.setItem('luna-notepad', ta.value); } catch(e) {} });
  saveBtn?.addEventListener('click', () => { try { sessionStorage.setItem('luna-notepad', ta.value); } catch(e) {} showToast('Notepad', 'Saved for this session', 'img:icons/084.ico'); });
  clrBtn?.addEventListener('click',  () => { ta.value = ''; try { sessionStorage.removeItem('luna-notepad'); } catch(e) {} updateWC(); });
}

function initCalculator() {
  const displayEl = document.getElementById('calc-display');
  const exprEl    = document.getElementById('calc-expr');
  if (!displayEl) return;
  let current = '0', expr = '', shouldReset = false;

  function update(val, ex = '') {
    displayEl.textContent = val;
    if (exprEl) exprEl.textContent = ex;
    displayEl.classList.toggle('calc-error', val === 'Error');
  }

  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (btn.dataset.val) handleCalc(btn.dataset.val); });
  });

  document.addEventListener('keydown', e => {
    if (!OS.openWindows.has('calculator') || OS.activeWindow !== 'calculator') return;
    const map = { '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
                  '.':'.', '+':'+', '-':'-', '*':'×', '/':'÷',
                  'Enter':'=', 'Escape':'C', 'Backspace':'⌫', '%':'%' };
    if (map[e.key]) { e.preventDefault(); handleCalc(map[e.key]); }
  });

  function handleCalc(val) {
    if (val === 'C' || val === 'AC') { current = '0'; expr = ''; shouldReset = false; update('0'); return; }
    if (val === '⌫')  { current = current.length > 1 ? current.slice(0, -1) : '0'; update(current, expr); return; }
    if (val === '=')  {
      try {
        const raw    = (expr + current).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        if (!/^[0-9+\-*/.\s()]+$/.test(raw)) throw new Error('invalid');
        const result = Function('"use strict";return (' + raw + ')')();
        expr = ''; current = +(+result).toFixed(10) + ''; shouldReset = true; update(current);
      } catch { update('Error'); current = '0'; expr = ''; }
      return;
    }
    if (val === '±') { current = (+current * -1) + ''; update(current, expr); return; }
    if (val === '%') { current = (+current / 100) + ''; update(current, expr); return; }
    if (['+', '-', '×', '÷'].includes(val)) {
      expr = expr + current + ' ' + val + ' '; current = '0'; shouldReset = true; update(current, expr); return;
    }
    if (val === '.') {
      if (shouldReset) { current = '0.'; shouldReset = false; }
      else if (!current.includes('.')) current += '.';
      update(current, expr); return;
    }
    if (shouldReset || current === '0') { current = val; shouldReset = false; }
    else if (current.replace('-', '').replace('.', '').length < 15) current += val;
    update(current, expr);
  }
}

function initTerminal() {
  const body  = document.getElementById('term-body');
  const input = document.getElementById('term-input');
  if (!body || !input) return;

  let history = [], histIdx = -1;
  const BANNER = `<span class="tc-head">Luna Aero OS Terminal — Glen Paul D. Choco Portfolio</span>\n<span class="tc-dim">Type 'help' for commands. Tab to autocomplete.</span>\n`;
  appendTermLine(BANNER, 'html');

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim();
      appendTermLine(`<span class="tc-prompt"><span class="tc-user">glen</span><span class="tc-at">@</span><span class="tc-host">luna-os</span><span class="tc-sep">:~$</span> <span class="tc-cmd">${escHtml(cmd)}</span></span>`, 'html');
      if (cmd) { history.unshift(cmd); histIdx = -1; runCommand(cmd); }
      input.value = '';
    }
    if (e.key === 'ArrowUp')   { histIdx = Math.min(histIdx + 1, history.length - 1); input.value = history[histIdx] || ''; }
    if (e.key === 'ArrowDown') { histIdx = Math.max(histIdx - 1, -1); input.value = history[histIdx] || ''; }
    if (e.key === 'Tab')       { e.preventDefault(); autoComplete(input); }
  });

const COMMANDS = {
  help: () => `<span class="tc-accent">Available commands:</span>
  about      — Who I am
  experience — Work history
  projects   — Systems I've built
  stack      — Technologies I use
  education  — Academic background
  contact    — Get in touch
  open       — open [window] (e.g. open contact)
  snap       — snap [left|right|maximize|tl|tr|bl|br]
  clear      — Clear terminal
  whoami     — Quick identity
  date       — Current date/time
  neofetch   — System info
  echo [msg] — Echo a message
  ls         — List open windows`,

  about: () => `<span class="tc-accent">Glen Paul D. Choco</span>
Web Application Developer · Laravel Specialist
Bacoor Cavite, Philippines

I build internal systems, web applications, dashboards,
and custom websites. 4+ years at Philippine Christian
University as a solo full-stack developer.`,

  experience: () => `<span class="tc-accent">Work History:</span>
  2021–Present  Web Application Programmer · PCU
  2018–2020     Technical Support · PCU`,

  projects: () => `<span class="tc-accent">Systems I've Built:</span>
  FERMS                    — Facilities & Equipment Reservation (PCU · Active)
  Alumni Tracer System     — Graduate Tracking & Analytics (PCU · Active)
  Integrated Registrar's   — Academic Records (M.I.T. Thesis)
  PCU Helpdesk             — Internal IT Support & Ticket System`,

  stack: () => `<span class="tc-accent">Technologies I Use:</span>
  Backend   — Laravel · PHP
  Database  — MySQL · MariaDB
  Frontend  — HTML · CSS · JavaScript · Blade
  Tools     — Git · GitHub · Figma · Composer
  Learning  — DevOps · Deployment · Infrastructure`,

  education: () => `<span class="tc-accent">Academic Background:</span>
  Masters in Information Technology
  Philippine Christian University · 2020–2023
  Thesis: Integrated Registrar's System

  B.Sc. Information Technology
  Philippine Christian University · 2014–2018
  Best Thesis Award 2018 — First 3D modeling thesis at PCU`,

  contact: () => `<span class="tc-accent">Get in Touch:</span>
  Email   glenpaulchoco@yahoo.com
  Work    glenpaul.choco@pcu.edu.ph
  Phone   09761281839
  Location Bacoor Cavite, Habay II, PH`,

  whoami: () => `glen · Web Application Developer · PCU · Laravel Specialist`,

  date: () => new Date().toLocaleString('en-PH', {
    weekday:'long', year:'numeric', month:'long',
    day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit'
  }),

  clear: () => { body.innerHTML = ''; appendTermLine(BANNER, 'html'); return null; },

  ls: () => `<span class="tc-accent">Open windows:</span>
${[...OS.openWindows.keys()].join(', ') || '(none)'}`,

  neofetch: () => `<span class="tc-accent">
   ●●●●●   </span> <span class="tc-green">glen@luna-os</span>
  ●<span class="tc-accent">▓▓▓</span>●  <span class="tc-dim">-----------</span>
 ●<span class="tc-accent">▓▓▓▓▓</span>● <span class="tc-green">OS:</span>     Luna Aero OS · 2026 Edition
  ●<span class="tc-accent">▓▓▓</span>●  <span class="tc-green">Stack:</span>  Laravel · PHP · MySQL · JS · Figma
   ●●●●●   <span class="tc-green">Role:</span>   Web Application Developer
           <span class="tc-green">Loc:</span>    Bacoor Cavite, PH
           <span class="tc-green">Built:</span>  HTML · CSS · JS
           <span class="tc-green">Status:</span> Available for Work ●`,
};

  function runCommand(cmd) {
    const parts = cmd.trim().split(/\s+/);
    const base  = parts[0].toLowerCase();
    let   out   = null;

    if (base === 'open' && parts[1]) {
      openWindow(parts[1]);
      out = `<span class="tc-green">Opening: ${escHtml(parts[1])}</span>`;
    } else if (base === 'snap' && parts[1] && OS.activeWindow) {
      const zone = parts[1].toLowerCase();
      const valid = ['left','right','maximize','tl','tr','bl','br'];
      if (valid.includes(zone)) {
        applySnapToWindow(OS.activeWindow, zone);
        out = `<span class="tc-green">Snapping active window: ${zone}</span>`;
      } else {
        out = `<span class="tc-err">Invalid zone. Use: left right maximize tl tr bl br</span>`;
      }
    } else if (base === 'echo') {
      out = escHtml(parts.slice(1).join(' '));
    } else if (COMMANDS[base]) {
      out = COMMANDS[base]();
    } else {
      out = `<span class="tc-err">Command not found: ${escHtml(base)}. Type 'help' for commands.</span>`;
    }

    if (out != null) appendTermLine(out, 'html');
    input.focus();
    body.scrollTop = body.scrollHeight;
  }

  function appendTermLine(html, type = 'text') {
    const p = document.createElement('p'); p.className = 'tc-output';
    if (type === 'html') p.innerHTML = html; else p.textContent = html;
    body.appendChild(p);
    body.scrollTop = body.scrollHeight;
  }

  function autoComplete(inp) {
    const partial = inp.value.toLowerCase();
    const cmds    = Object.keys(COMMANDS).concat(['open', 'echo', 'snap']);
    const match   = cmds.find(c => c.startsWith(partial));
    if (match) inp.value = match;
  }
}

function initExperienceWindow() {
  document.querySelectorAll('.exp-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.exp;
      document.querySelectorAll('.exp-nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.exp-nav-dot').forEach(d => d.classList.remove('active'));
      document.querySelectorAll('.exp-detail').forEach(d => d.classList.remove('active'));
      item.classList.add('active');
      item.querySelector('.exp-nav-dot')?.classList.add('active');
      document.getElementById('exp-' + id)?.classList.add('active');
    });
  });
}

function initProjectsWindow() {
  document.querySelectorAll('.wtb-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wtb-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter  = btn.dataset.filter;
      let   visible = 0;
      document.querySelectorAll('.proj-card').forEach(card => {
        const show = filter === 'all' || (card.dataset.tags || '').includes(filter);
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      const featured = document.querySelector('.proj-featured');
      if (featured) featured.parentElement.style.display = featured.style.display === 'none' && visible === 0 ? 'none' : '';
      const countEl = document.getElementById('proj-count');
      if (countEl) countEl.textContent = `${visible} Project${visible !== 1 ? 's' : ''}`;
    });
  });
}

function initSystemInfo() { }
const CF2 = { step: 1 };

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nextBtn = document.getElementById('cf2-next-btn');
  const backBtn = document.getElementById('cf2-back-btn');

  nextBtn?.addEventListener('click', () => {
    const nameOk  = validateField('cf-name',  v => v.trim().length >= 2, 'Enter your full name');
    const emailOk = validateField('cf-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email');
    if (nameOk && emailOk) cf2GoToStep(2);
  });

  backBtn?.addEventListener('click', () => cf2GoToStep(1));

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const subjectOk = validateField('cf-subject', v => v.trim().length > 0, 'Select a subject');
    const messageOk = validateField('cf-message', v => v.trim().length >= 10, 'Message must be at least 10 characters');
    if (!subjectOk || !messageOk) return false;

    submitContactForm();
    return false;
  });

  ['cf-name','cf-email','cf-subject','cf-message'].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('blur', () => {
      if (id === 'cf-name')    validateField('cf-name',  v => v.trim().length >= 2, 'Enter your full name');
      if (id === 'cf-email')   validateField('cf-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email');
      if (id === 'cf-subject') validateField('cf-subject', v => v.trim().length > 0, 'Select a subject');
      if (id === 'cf-message') validateField('cf-message', v => v.trim().length >= 10, 'Message must be at least 10 characters');
    });
  });
}

function validateField(id, testFn, errMsg) {
  const el = document.getElementById(id);
  if (!el) return true;
  const field = el.closest('.cf2-field');
  const errEl = document.getElementById('err-' + id);
  const ok = testFn(el.value || '');
  if (field) { field.classList.toggle('valid', ok); field.classList.toggle('invalid', !ok); }
  if (errEl) errEl.textContent = ok ? '' : errMsg;
  return ok;
}

function cf2GoToStep(step) {
  CF2.step = step;
  document.querySelectorAll('.cf2-panel').forEach(p => p.classList.toggle('active', +p.dataset.panel === step));
  document.querySelectorAll('.cf2-step').forEach(s => {
    const n = +s.dataset.step;
    s.classList.toggle('active', n === step);
    s.classList.toggle('done', n < step);
  });
  const fill = document.getElementById('cf2-progress-fill');
  if (fill) fill.style.width = step === 1 ? '0%' : '100%';
}

function submitContactForm() {
  const btn      = document.getElementById('cf-submit-btn');
  const btnText  = btn?.querySelector('.cf-btn-text');
  const btnLoad  = btn?.querySelector('.cf-btn-loader');
  const successEl = document.getElementById('cf-success');
  const errorEl   = document.getElementById('cf-error');

  successEl?.classList.add('hidden');
  errorEl?.classList.add('hidden');
  if (btn) btn.disabled = true;
  btnText?.classList.add('hidden');
  btnLoad?.classList.remove('hidden');
  btnLoad?.classList.add('visible');

  const data = {
    from_name:  document.getElementById('cf-name')?.value    || '',
    from_email: document.getElementById('cf-email')?.value   || '',
    subject:    document.getElementById('cf-subject')?.value || '',
    budget:     document.getElementById('cf-budget')?.value  || '',
    message:    document.getElementById('cf-message')?.value || '',
  };

  if (window.emailjs && typeof emailjs.send === 'function') {
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', data, 'YOUR_PUBLIC_KEY')
      .then(() => onContactSuccess())
      .catch(() => onContactError(data));
  } else {
    onContactError(data);
  }
}

function onContactSuccess() {
  const btn = document.getElementById('cf-submit-btn');
  document.getElementById('cf-success')?.classList.remove('hidden');
  document.getElementById('contact-form')?.reset();
  cf2GoToStep(1);
  document.querySelectorAll('.cf2-field').forEach(f => f.classList.remove('valid', 'invalid'));
  resetSubmitBtn(btn);
}

function onContactError(data) {
  const btn = document.getElementById('cf-submit-btn');
  document.getElementById('cf-error')?.classList.remove('hidden');
  resetSubmitBtn(btn);
  const mailto = `mailto:glenpaulchoco@yahoo.com?subject=${encodeURIComponent(data.subject || 'Portfolio Inquiry')}&body=${encodeURIComponent(`From: ${data.from_name} (${data.from_email})\nBudget: ${data.budget}\n\n${data.message}`)}`;
  window.location.href = mailto;
}

function resetSubmitBtn(btn) {
  if (!btn) return;
  btn.disabled = false;
  btn.querySelector('.cf-btn-text')?.classList.remove('hidden');
  btn.querySelector('.cf-btn-loader')?.classList.remove('visible');
  btn.querySelector('.cf-btn-loader')?.classList.add('hidden');
}
function animateSysInfoBars() {
  document.querySelectorAll('.si-bar-fill').forEach(bar => {
    const val = bar.dataset.val || 50;
    setTimeout(() => bar.style.width = val + '%', 200);
  });
}

const MP = {
  audioCtx: null, analyser: null, gainNode: null,
  eqNodes: [], source: null, audio: null,
  categories: [], activeCategoryId: 'all',
  playlist: [], currentIdx: -1,
  shuffle: false, repeat: 'none', muted: false, volume: 1.0,
  volDialAngle: 225, visualMode: 'bars',
  seeking: false, connected: false, animFrame: null,
  eqPresets: {
    flat: [0,0,0,0,0,0,0,0,0],
    bass: [6,5,4,2,0,-1,-1,-2,-2],
    rock: [4,3,0,0,-1,0,2,3,3],
    pop: [-1,0,2,3,3,2,0,-1,-1],
    jazz: [0,0,0,2,3,3,2,1,0],
  },
  eqFreqs: [60,170,310,600,1000,3000,6000,14000,16000],
};

const LIBRARY_ID = 'library';
const LIBRARY_LABEL = 'Library';

function initMusicPlayer() {
  MP.audio = new Audio();
  MP.audio.crossOrigin = 'anonymous';
  MP.audio.volume      = MP.volume;
  MP.audio.addEventListener('timeupdate',     updateSeekBar);
  MP.audio.addEventListener('ended',          onTrackEnd);
  MP.audio.addEventListener('loadedmetadata', onMetadataLoaded);
  MP.audio.addEventListener('canplay',        () => updateStatusLight('stopped'));
  MP.audio.addEventListener('error',          () => showToast('Playback Error', 'Could not play this file.', 'img:icons/256.ico'));

  document.getElementById('xp-play-btn')?.       addEventListener('click', togglePlay);
  document.getElementById('xp-stop-btn')?.        addEventListener('click', stopPlayback);
  document.getElementById('xp-prev')?.            addEventListener('click', prevTrack);
  document.getElementById('xp-next')?.            addEventListener('click', nextTrack);
  document.getElementById('xp-shuffle')?.         addEventListener('click', toggleShuffle);
  document.getElementById('xp-repeat')?.          addEventListener('click', toggleRepeat);
  document.getElementById('xp-mute')?.            addEventListener('click', toggleMute);
  document.getElementById('xp-open-btn')?.        addEventListener('click', () => document.getElementById('xp-file-input')?.click());
  document.getElementById('xp-playlist-toggle')?.addEventListener('click', togglePlaylist);
  document.getElementById('xp-eq-btn')?.          addEventListener('click', toggleEQ);
  document.getElementById('xp-vis-toggle')?.      addEventListener('click', cycleVisualizer);

  document.getElementById('xp-file-input')?.addEventListener('change', e => {
    const files = [...e.target.files].filter(f => f.type.startsWith('audio/'));
    if (files.length) addFilesToPlaylist(files);
    e.target.value = '';
  });

  document.getElementById('xp-pl-add-btn')?.addEventListener('click',  () => document.getElementById('xp-file-input')?.click());
  document.getElementById('xp-pl-clear-btn')?.addEventListener('click', clearPlaylist);

  document.querySelectorAll('.xp-eq-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      applyEQPreset(btn.dataset.preset);
      document.querySelectorAll('.xp-eq-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.addEventListener('keydown', e => {
    if (OS.activeWindow !== 'music') return;
    const map = { ' ':togglePlay, 'ArrowRight':nextTrack, 'ArrowLeft':prevTrack,
                  'm':toggleMute, 'M':toggleMute, 's':toggleShuffle, 'S':toggleShuffle,
                  'r':toggleRepeat, 'R':toggleRepeat };
    if (map[e.key]) { e.preventDefault(); map[e.key](); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); adjustVolume(0.05); }
    if (e.key === 'ArrowDown') { e.preventDefault(); adjustVolume(-0.05); }
  });

  initSeekBar();
  initVolumeSlider();
  initEQ();
  initDropZone();
  loadMusicFolder();
  startVisualizer();
  updateStatusLight('stopped');
}

function ensureAudioContext() {
  if (MP.connected) return;
  try {
    MP.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    MP.analyser = MP.audioCtx.createAnalyser();
    MP.analyser.fftSize = 2048;
    MP.analyser.smoothingTimeConstant = 0.82;
    MP.gainNode = MP.audioCtx.createGain();
    MP.gainNode.gain.value = MP.volume;

    MP.eqNodes = MP.eqFreqs.map((freq, i) => {
      const filter = MP.audioCtx.createBiquadFilter();
      filter.type  = i === 0 ? 'lowshelf' : i === MP.eqFreqs.length - 1 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.gain.value      = 0;
      filter.Q.value         = 1;
      return filter;
    });

    const source = MP.audioCtx.createMediaElementSource(MP.audio);
    let   node   = source;
    MP.eqNodes.forEach(eq => { node.connect(eq); node = eq; });
    node.connect(MP.gainNode);
    MP.gainNode.connect(MP.analyser);
    MP.analyser.connect(MP.audioCtx.destination);
    MP.connected = true;

    document.querySelectorAll('.xp-eq-slider').forEach((slider, i) => {
      slider.addEventListener('input', () => { if (MP.eqNodes[i]) MP.eqNodes[i].gain.value = +slider.value; });
    });
  } catch(err) { console.warn('AudioContext setup failed:', err); }
}

function addFilesToPlaylist(files) {
  const categoryId = 'local';
  let localCategory = MP.categories.find(c => c.id === categoryId);
  if (!localCategory) {
    localCategory = { id: categoryId, label: 'Local Files', tracks: [] };
    MP.categories.push(localCategory);
  }
  const startIndex = localCategory.tracks.length;
  files.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    const base = file.name.replace(/\.[^/.]+$/, '');
    const parts = base.split(' - ');
    const track = {
      id: `local_${Date.now()}_${startIndex + i}`,
      url,
      file: file.name,
      relPath: null,
      name: parts.length > 1 ? parts.slice(1).join(' - ') : base,
      artist: parts.length > 1 ? parts[0] : 'Unknown Artist',
      album: null,
      duration: '--:--',
      palette: null,
      categoryId,
      sortIndex: startIndex + i,
      isLocal: true,
    };
    const tempAudio = new Audio(url);
    tempAudio.addEventListener('loadedmetadata', () => { track.duration = formatTime(tempAudio.duration); renderPlaylist(); });
    localCategory.tracks.push(track);
  });
  if (MP.activeCategoryId === 'all' || MP.activeCategoryId === categoryId) {
    MP.playlist = computeCategoryTracks(MP.activeCategoryId);
  }
  renderCategoryTabs();
  renderPlaylist();
  if (MP.currentIdx === -1 && MP.playlist.length > 0) loadTrack(0);
  showToast('Media Player', `Added ${files.length} track${files.length > 1 ? 's' : ''} to ${localCategory.label}`, 'img:icons/049.ico');
}

function clearPlaylist() {
  stopPlayback();
  MP.categories.forEach(cat => cat.tracks.forEach(t => { if (t.url && t.url.startsWith('blob:')) URL.revokeObjectURL(t.url); }));
  MP.categories = [];
  MP.activeCategoryId = 'all';
  MP.playlist = [];
  MP.currentIdx = -1;
  renderCategoryTabs();
  renderPlaylist();
  updateScreenDisplay('No Track Loaded — Drop MP3 or Load File', '');
  updateStatusLight('stopped');
  updateTaskbarNowPlaying('', false);
  const tv = document.getElementById('xp-time-val');  if (tv) tv.textContent = '00:00';
  const to = document.getElementById('xp-total-val'); if (to) to.textContent = '00:00';
  const sf = document.getElementById('xp-seek-fill'); if (sf) sf.style.width = '0%';
  try { sessionStorage.setItem('luna-music-category', 'all'); } catch (_) {}
}

function renderPlaylist() {
  const list    = document.getElementById('xp-playlist-list');
  const countEl = document.getElementById('xp-pl-count');
  if (!list) return;
  if (countEl) countEl.textContent = `${MP.playlist.length} track${MP.playlist.length !== 1 ? 's' : ''}`;
  if (!MP.playlist.length) {
    list.innerHTML = '<div class="xp-pl-empty">No tracks in this playlist.<br>Click + Add Files or drag &amp; drop audio files here.</div>';
    return;
  }
  const showBadge = MP.activeCategoryId === 'all' && MP.categories.length > 1;
  list.innerHTML = '';
  MP.playlist.forEach((track, i) => {
    const item      = document.createElement('div');
    const isActive  = i === MP.currentIdx;
    const isPlaying = isActive && !MP.audio.paused;
    item.className  = 'xp-pl-item' + (isActive ? ' active' : '');
    const categoryLabel = showBadge ? (MP.categories.find(c => c.id === track.categoryId)?.label || '') : '';
    item.innerHTML  = `
      <span class="xp-pl-num">${isActive ? (isPlaying ? '▶' : '❚❚') : (i + 1)}</span>
      <span class="xp-pl-name" title="${escHtml(track.name)} — ${escHtml(track.artist)}">${escHtml(track.name)}</span>
      ${showBadge ? `<span class="xp-pl-badge">${escHtml(categoryLabel)}</span>` : ''}
      <span class="xp-pl-dur">${track.duration}</span>`;
    item.addEventListener('click', () => { loadTrack(i); startPlay(); });
    list.appendChild(item);
  });
}

function loadTrack(idx) {
  if (idx < 0 || idx >= MP.playlist.length) return;
  const track     = MP.playlist[idx];
  MP.currentIdx   = idx;
  MP.audio.src    = track.url;
  MP.audio.load();
  updateScreenDisplay(track.name, track.artist);
  renderPlaylist();
  const tv = document.getElementById('xp-time-val');  if (tv) tv.textContent = '00:00';
  const to = document.getElementById('xp-total-val'); if (to) to.textContent = track.duration;
  const sf = document.getElementById('xp-seek-fill'); if (sf) sf.style.width = '0%';
}

function updateScreenDisplay(title, artist) {
  const scroll = document.getElementById('xp-title-scroll');
  if (scroll) scroll.textContent = artist ? `${title}  —  ${artist}  ·  ·  ·` : title;
}

function onMetadataLoaded() {
  const dur = MP.audio.duration;
  if (isFinite(dur)) {
    const to = document.getElementById('xp-total-val'); if (to) to.textContent = formatTime(dur);
    if (MP.currentIdx >= 0) MP.playlist[MP.currentIdx].duration = formatTime(dur);
    renderPlaylist();
  }
}

function startPlay() {
  ensureAudioContext();
  if (MP.audioCtx?.state === 'suspended') MP.audioCtx.resume();
  const p = MP.audio.play();
  if (p) p.catch(err => console.warn('Play failed:', err));
  const pb = document.getElementById('xp-play-btn'); if (pb) { const i = pb.querySelector('img'); if (i) i.src = 'icons/477.ico'; }
  updateStatusLight('playing');
  const track = MP.playlist[MP.currentIdx];
  if (track) updateTaskbarNowPlaying(track.name, true);
}

function pausePlay() {
  MP.audio.pause();
  const pb = document.getElementById('xp-play-btn'); if (pb) { const i = pb.querySelector('img'); if (i) i.src = 'icons/472.ico'; }
  updateStatusLight('paused');
  const track = MP.playlist[MP.currentIdx];
  if (track) updateTaskbarNowPlaying(track.name, false);
}

function togglePlay() {
  if (!MP.playlist.length) { document.getElementById('xp-file-input')?.click(); return; }
  if (MP.currentIdx === -1) { loadTrack(0); startPlay(); return; }
  if (MP.audio.paused) startPlay(); else pausePlay();
  renderPlaylist();
}

function stopPlayback() {
  MP.audio.pause(); MP.audio.currentTime = 0;
    const pb = document.getElementById('xp-play-btn'); if (pb) { const i = pb.querySelector('img'); if (i) i.src = 'icons/472.ico'; }
  const sf = document.getElementById('xp-seek-fill'); if (sf) sf.style.width = '0%';
  const tv = document.getElementById('xp-time-val');  if (tv) tv.textContent = '00:00';
  updateStatusLight('stopped');
  updateTaskbarNowPlaying('', false);
  renderPlaylist();
}

function nextTrack() {
  if (!MP.playlist.length) return;
  const next = MP.shuffle ? Math.floor(Math.random() * MP.playlist.length) : (MP.currentIdx + 1) % MP.playlist.length;
  loadTrack(next); startPlay();
}

function prevTrack() {
  if (!MP.playlist.length) return;
  if (MP.audio.currentTime > 3) { MP.audio.currentTime = 0; return; }
  const prev = MP.shuffle ? Math.floor(Math.random() * MP.playlist.length) : (MP.currentIdx - 1 + MP.playlist.length) % MP.playlist.length;
  loadTrack(prev); startPlay();
}

function onTrackEnd() {
  if (MP.repeat === 'one') { MP.audio.currentTime = 0; startPlay(); return; }
  if (MP.repeat === 'all' || MP.currentIdx < MP.playlist.length - 1) { nextTrack(); }
  else {
    updateStatusLight('stopped');
    updateTaskbarNowPlaying('', false);
      const pb = document.getElementById('xp-play-btn'); if (pb) { const i = pb.querySelector('img'); if (i) i.src = 'icons/472.ico'; }
  }
}

function toggleShuffle() {
  MP.shuffle = !MP.shuffle;
  document.getElementById('xp-shuffle')?.classList.toggle('active', MP.shuffle);
  showToast('Shuffle', MP.shuffle ? 'Shuffle ON' : 'Shuffle OFF', 'img:icons/288.ico');
}

function toggleRepeat() {
  const modes  = ['none','one','all'];
  MP.repeat    = modes[(modes.indexOf(MP.repeat) + 1) % 3];
  const icons  = { none:'↺', one:'↺¹', all:'↺∞' };
  const labels = { none:'Repeat OFF', one:'Repeat ONE', all:'Repeat ALL' };
  const btn    = document.getElementById('xp-repeat');
  if (btn) { btn.textContent = icons[MP.repeat]; btn.classList.toggle('active', MP.repeat !== 'none'); }
  showToast('Repeat', labels[MP.repeat], 'img:icons/288.ico');
}

function toggleMute() {
  MP.muted       = !MP.muted;
  MP.audio.muted = MP.muted;
  updateVolumeIcon();
}

function adjustVolume(delta) {
  MP.volume       = clamp(MP.volume + delta, 0, 1);
  MP.audio.volume = MP.volume;
  if (MP.gainNode) MP.gainNode.gain.value = MP.volume;
  const slider = document.getElementById('lp-vol-slider');
  if (slider) slider.value = Math.round(MP.volume * 100);
  updateVolumeIcon();
}

function initSeekBar() {
  const track = document.getElementById('xp-seek-track');
  if (!track) return;
  function seekTo(cx) {
    const rect  = track.getBoundingClientRect();
    const ratio = clamp((cx - rect.left) / rect.width, 0, 1);
    if (isFinite(MP.audio.duration)) MP.audio.currentTime = ratio * MP.audio.duration;
    updateSeekBarImmediate(ratio);
  }
  track.addEventListener('mousedown', e => { MP.seeking = true; seekTo(e.clientX); });
  document.addEventListener('mousemove', e => { if (MP.seeking) seekTo(e.clientX); });
  document.addEventListener('mouseup',   () => { MP.seeking = false; });
}

function updateSeekBar() {
  if (MP.seeking) return;
  const dur = MP.audio.duration, cur = MP.audio.currentTime;
  if (!isFinite(dur) || dur === 0) return;
  updateSeekBarImmediate(cur / dur);
  const tv = document.getElementById('xp-time-val'); if (tv) tv.textContent = formatTime(cur);
}

function updateSeekBarImmediate(ratio) {
  const fill = document.getElementById('xp-seek-fill');
  if (fill) fill.style.width = (ratio * 100) + '%';
}

function initVolumeSlider() {
  const slider = document.getElementById('lp-vol-slider');
  if (!slider) return;
  slider.value = Math.round(MP.volume * 100);
  slider.addEventListener('input', () => {
    const target = slider.value / 100;
    adjustVolume(target - MP.volume);
  });
}

function updateVolumeIcon() {
  const icon = document.getElementById('xp-vol-icon');
  if (!icon) return;
  icon.src = (MP.muted || MP.volume === 0) ? 'icons/274.ico' : 'icons/273.ico';
}

function drawVolumeDial(angleDeg) {
  const canvas = document.getElementById('xp-volume-dial');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 24, cy = 24, r = 18;
  ctx.clearRect(0, 0, 48, 48);

  const grd = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, r);
  grd.addColorStop(0, '#1a60d0'); grd.addColorStop(0.5, '#0a40a0'); grd.addColorStop(1, '#061c5e');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
  ctx.strokeStyle = 'rgba(140,200,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();

  const shine = ctx.createRadialGradient(cx - 7, cy - 7, 1, cx - 4, cy - 4, r * 0.7);
  shine.addColorStop(0, 'rgba(255,255,255,0.5)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = shine; ctx.fill();

  const startRad = 225 * Math.PI / 180;
  const angleRad = angleDeg * Math.PI / 180;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, startRad, angleRad, angleDeg < 225);
  ctx.strokeStyle = `hsl(${140 + (1 - MP.volume) * (-140)},80%,55%)`;
  ctx.lineWidth = 3; ctx.stroke();

  const px = cx + Math.cos(angleRad) * (r - 6);
  const py = cy + Math.sin(angleRad) * (r - 6);
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(angleRad) * 4, cy + Math.sin(angleRad) * 4);
  ctx.lineTo(px, py);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220,240,255,0.9)'; ctx.fill();
}

function initEQ() {
  document.querySelectorAll('.xp-eq-slider').forEach(slider => { slider.value = 0; });
}

function applyEQPreset(name) {
  const preset = MP.eqPresets[name];
  if (!preset) return;
  document.querySelectorAll('.xp-eq-slider').forEach((slider, i) => {
    slider.value = preset[i] || 0;
    if (MP.eqNodes[i]) MP.eqNodes[i].gain.value = preset[i] || 0;
  });
  const label = document.getElementById('w7p-eq-active-label');
  const presetNames = { flat:'Flat', bass:'Bass Boost', rock:'Rock', pop:'Pop', jazz:'Jazz' };
  if (label) label.textContent = presetNames[name] || name;
}

function togglePlaylist() {
  const panel = document.getElementById('xp-playlist-panel');
  const btn   = document.getElementById('xp-playlist-toggle');
  panel?.classList.toggle('hidden');
  btn?.classList.toggle('active', !panel?.classList.contains('hidden'));
}

function toggleEQ() {
  const panel = document.getElementById('xp-eq-panel');
  const btn   = document.getElementById('xp-eq-btn');
  panel?.classList.toggle('hidden');
  btn?.classList.toggle('active', !panel?.classList.contains('hidden'));
}

function cycleVisualizer() {
  const modes = ['bars', 'wave', 'circle'];
  MP.visualMode = modes[(modes.indexOf(MP.visualMode) + 1) % 3];
  const icons   = { bars:'📊', wave:'〰', circle:'◎' };
  const btn     = document.getElementById('xp-vis-toggle');
  if (btn) btn.textContent = icons[MP.visualMode];
}

function updateStatusLight(state) {
  const light = document.getElementById('xp-status-light');
  const text  = document.getElementById('xp-status-text');
  if (light) light.className = 'xp-status-light ' + state;
  if (text)  text.textContent = state.toUpperCase();
}

function initDropZone() {
  const body = document.querySelector('.xp-player-body');
  const zone = document.getElementById('xp-drop-zone');
  if (!body || !zone) return;
  body.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('active'); });
  body.addEventListener('dragleave', () => zone.classList.remove('active'));
  body.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('active');
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('audio/'));
    if (files.length) addFilesToPlaylist(files);
  });
}

const AUDIO_EXT_RE = /\.(mp3|ogg|wav|flac|m4a|aac|opus|weba)$/i;

function buildMusicUrl(relPath) {
  return `./musics/${String(relPath).split('/').map(encodeURIComponent).join('/')}`;
}

function stripExt(name) {
  return String(name).replace(/\.[^/.]+$/, '');
}

function slugify(name) {
  return String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category';
}

function titleCase(name) {
  return String(name).replace(/[-_]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
}

function normalizeManifestTrack(t, categoryId, relBase, index) {
  const relPath = t.relPath || (relBase ? `${relBase}/${t.file}` : t.file);
  return {
    id: t.id || `${categoryId}_${index}`,
    url: buildMusicUrl(relPath),
    file: t.file,
    relPath,
    name: t.title || t.name || stripExt(t.file || ''),
    artist: t.artist || 'Unknown Artist',
    album: t.album || null,
    duration: t.duration || '--:--',
    palette: t.palette || null,
    categoryId,
    sortIndex: t.sortIndex != null ? t.sortIndex : index,
  };
}

function normalizeCategoryEntry(cat, index) {
  const id = cat.id || slugify(cat.label || cat.folder || `category-${index}`);
  const label = cat.label || titleCase(cat.id || cat.folder || `Category ${index + 1}`);
  const relBase = cat.folder ? cat.folder.replace(/^musics\/?/, '') : (id === LIBRARY_ID ? '' : id);
  const tracks = (cat.tracks || []).map((t, i) => normalizeManifestTrack(t, id, relBase, i));
  return { id, label, tracks };
}

function normalizeCategoryManifest(rawCategories) {
  return rawCategories.map((cat, i) => normalizeCategoryEntry(cat, i));
}

function normalizeLegacyArray(raw) {
  return [{
    id: LIBRARY_ID,
    label: LIBRARY_LABEL,
    tracks: raw.map((t, i) => normalizeManifestTrack(t, LIBRARY_ID, '', i)),
  }];
}

function buildTrackFromFilename(filename, relFolder, categoryId, index) {
  const base  = filename.replace(/\.[^/.]+$/, '').replace(/^\d{1,4}[\s.\-_]+/, '').trim();
  const parts = base.split(/\s*[-–—]\s*/).map(s => s.trim()).filter(Boolean);
  const artist = parts.length >= 2 ? parts[0] : 'Unknown Artist';
  const name   = parts.length >= 2 ? parts.slice(1).join(' - ') : base;
  const relPath = relFolder ? `${relFolder}/${filename}` : filename;
  return {
    id: `${categoryId}_${index}`,
    url: buildMusicUrl(relPath),
    file: filename,
    relPath,
    name,
    artist,
    album: null,
    duration: '--:--',
    palette: null,
    categoryId,
    sortIndex: index,
  };
}

function buildLegacyCategory(id, label, relFolder, filenames) {
  return {
    id, label,
    tracks: filenames.map((filename, i) => buildTrackFromFilename(filename, relFolder, id, i)),
  };
}

async function fetchDirectoryListing(folder) {
  try {
    const resp = await fetchWithTimeout(`./${folder}/`, 3000);
    if (!resp.ok) return null;
    const ct = resp.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return null;
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const files = [];
    const dirs = [];
    doc.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('?') || href.startsWith('/..') || href === '../') return;
      if (href.endsWith('/')) {
        const name = decodeURIComponent(href.replace(/\/$/, '').split('/').pop());
        if (name) dirs.push(name);
      } else if (AUDIO_EXT_RE.test(href)) {
        files.push(decodeURIComponent(href.split('/').pop()));
      }
    });
    return { files, dirs };
  } catch (e) {
    return null;
  }
}

function loadCategoriesFromWindow() {
  const raw = window.__TRACKLIST__;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.length ? normalizeLegacyArray(raw) : null;
  if (raw && Array.isArray(raw.categories)) return normalizeCategoryManifest(raw.categories);
  return null;
}

async function loadCategoriesFromRootManifest() {
  const resp = await fetchWithTimeout('./musics/tracklist.json', 4000);
  if (!resp.ok) return null;
  const raw = await resp.json();
  if (Array.isArray(raw)) return raw.length ? normalizeLegacyArray(raw) : null;
  if (raw && Array.isArray(raw.categories)) return normalizeCategoryManifest(raw.categories);
  return null;
}

async function loadCategoriesFromLegacyManifest() {
  const candidates = ['./musics/playlist.json', './musics/manifest.json'];
  for (const url of candidates) {
    try {
      const resp = await fetchWithTimeout(url, 4000);
      if (!resp.ok) continue;
      const raw = await resp.json();
      if (Array.isArray(raw) && raw.length) return normalizeLegacyArray(raw);
    } catch (_) {}
  }
  return null;
}

async function loadCategoriesFromDirectoryScan() {
  const rootListing = await fetchDirectoryListing('musics');
  if (!rootListing) return null;
  const categories = [];
  if (rootListing.files.length) {
    categories.push(buildLegacyCategory(LIBRARY_ID, LIBRARY_LABEL, '', rootListing.files));
  }
  for (const dirName of rootListing.dirs) {
    const sub = await fetchDirectoryListing(`musics/${dirName}`);
    if (!sub || !sub.files.length) continue;
    const id = slugify(dirName);
    categories.push(buildLegacyCategory(id, titleCase(dirName), dirName, sub.files));
  }
  return categories.length ? categories : null;
}

async function loadMusicFolder() {
  const loaders = [
    { name: 'window.__TRACKLIST__', run: loadCategoriesFromWindow },
    { name: 'musics/tracklist.json', run: loadCategoriesFromRootManifest },
    { name: 'legacy manifest', run: loadCategoriesFromLegacyManifest },
    { name: 'directory scan', run: loadCategoriesFromDirectoryScan },
  ];
  for (const loader of loaders) {
    let categories = null;
    try { categories = await loader.run(); } catch (e) { categories = null; }
    if (categories && categories.length) {
      applyDiscoveredCategories(categories, loader.name);
      return;
    }
  }
  showToast('Media Player', 'No tracks found. Add files to musics/, musics/chill/, or musics/favorites/ and run generate-tracklist.js', 'img:icons/049.ico');
}

function computeCategoryTracks(id) {
  if (id === 'all') return MP.categories.reduce((acc, c) => acc.concat(c.tracks), []);
  const category = MP.categories.find(c => c.id === id);
  return category ? category.tracks.slice() : [];
}

function persistActiveCategory(id) {
  try { sessionStorage.setItem('luna-music-category', id); } catch (_) {}
}

function restoreActiveCategory() {
  let stored = null;
  try { stored = sessionStorage.getItem('luna-music-category'); } catch (_) {}
  MP.activeCategoryId = (stored && (stored === 'all' || MP.categories.some(c => c.id === stored))) ? stored : 'all';
}

function setActiveCategory(id) {
  const currentTrack = MP.currentIdx >= 0 ? MP.playlist[MP.currentIdx] : null;
  MP.activeCategoryId = id;
  MP.playlist = computeCategoryTracks(id);
  MP.currentIdx = currentTrack ? MP.playlist.findIndex(t => t.id === currentTrack.id) : -1;
  renderCategoryTabs();
  renderPlaylist();
  persistActiveCategory(id);
}

function renderCategoryTabs() {
  const container = document.getElementById('xp-category-tabs');
  if (!container) return;
  if (MP.categories.length <= 1) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');
  const totalTracks = MP.categories.reduce((n, c) => n + c.tracks.length, 0);
  const entries = [{ id: 'all', label: 'All Tracks', count: totalTracks }]
    .concat(MP.categories.map(c => ({ id: c.id, label: c.label, count: c.tracks.length })));
  container.innerHTML = '';
  entries.forEach(entry => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'w7p-category-tab' + (entry.id === MP.activeCategoryId ? ' active' : '');
    tab.innerHTML = `<span class="w7p-category-tab-label">${escHtml(entry.label)}</span><span class="w7p-category-tab-count">${entry.count}</span>`;
    tab.addEventListener('click', () => setActiveCategory(entry.id));
    container.appendChild(tab);
  });
}

function applyDiscoveredCategories(categories, sourceLabel) {
  if (!Array.isArray(categories) || !categories.length) return;
  const localCategory = MP.categories.find(c => c.id === 'local');
  MP.categories = localCategory ? categories.concat(localCategory) : categories;
  restoreActiveCategory();
  MP.playlist = computeCategoryTracks(MP.activeCategoryId);
  renderCategoryTabs();
  renderPlaylist();
  if (MP.playlist.length > 0 && MP.currentIdx === -1) {
    loadTrack(0);
    const totalTracks = MP.categories.reduce((n, c) => n + c.tracks.length, 0);
    showToast('Media Player', `${totalTracks} track${totalTracks !== 1 ? 's' : ''} loaded across ${MP.categories.length} playlist${MP.categories.length !== 1 ? 's' : ''}`, 'img:icons/049.ico');
  }
  console.info(`[Luna Media] applyDiscoveredCategories: ${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'} from ${sourceLabel}`);
}

function startVisualizer() {
  const canvas = document.getElementById('xp-visualizer');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function frame() {
    MP.animFrame = requestAnimationFrame(frame);
    const W = canvas.offsetWidth  || 260;
    const H = canvas.offsetHeight || 120;
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }

    ctx.clearRect(0, 0, W, H);

    let dataArray;
    if (MP.analyser && MP.connected && !MP.audio.paused) {
      if (MP.visualMode === 'wave') {
        dataArray = new Float32Array(MP.analyser.fftSize);
        MP.analyser.getFloatTimeDomainData(dataArray);
      } else {
        dataArray = new Uint8Array(MP.analyser.frequencyBinCount);
        MP.analyser.getByteFrequencyData(dataArray);
      }
    }

    const bgGrd = ctx.createLinearGradient(0, 0, 0, H);
    bgGrd.addColorStop(0, 'rgba(0,8,30,0)'); bgGrd.addColorStop(1, 'rgba(0,20,60,0.2)');
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, W, H);

    if (!dataArray) { drawIdleBubbles(ctx, W, H); return; }
    switch (MP.visualMode) {
      case 'bars':   drawBarVisualizer(ctx, W, H, dataArray);  break;
      case 'wave':   drawWaveVisualizer(ctx, W, H, dataArray); break;
      case 'circle': drawCircleVisualizer(ctx, W, H);           break;
    }
  }
  frame();
}

let idleBubbles = null;
function drawIdleBubbles(ctx, W, H) {
  if (!idleBubbles) idleBubbles = Array.from({ length: 6 }, (_, i) => ({
    x: 20 + i * (W / 6), y: H * 0.6, vy: -0.4 - Math.random() * 0.3,
    r: 3 + Math.random() * 5, a: 0.4 + Math.random() * 0.3, phase: i * 1.1,
  }));
  const t = Date.now() * 0.001;
  idleBubbles.forEach(b => {
    b.y += b.vy; b.x += Math.sin(t + b.phase) * 0.4;
    if (b.y < -b.r) { b.y = H + b.r; b.x = Math.random() * W; }
    const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    grad.addColorStop(0, `rgba(85,232,255,${b.a})`); grad.addColorStop(1, `rgba(0,80,200,0)`);
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
  });
  ctx.strokeStyle = 'rgba(0,60,180,0.07)'; ctx.lineWidth = 0.5;
  for (let y = 0; y < H; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawBarVisualizer(ctx, W, H, data) {
  const barCount = 48;
  const step     = Math.floor(data.length / barCount);
  const barW     = (W - barCount) / barCount;
  for (let i = 0; i < barCount; i++) {
    let sum = 0; for (let k = 0; k < step; k++) sum += data[i * step + k];
    const bH = (sum / step / 255) * (H - 4);
    const x  = i * (barW + 1);
    const hue = 200 + (i / barCount) * 40;
    const grd = ctx.createLinearGradient(0, H, 0, H - bH);
    grd.addColorStop(0, `hsl(${hue},90%,50%)`); grd.addColorStop(0.5, `hsl(${hue + 20},85%,65%)`); grd.addColorStop(1, `hsl(${hue + 40},80%,80%)`);
    ctx.fillStyle = grd; ctx.fillRect(x, H - bH - 2, barW, bH);
    ctx.shadowColor = `hsl(${hue},90%,60%)`; ctx.shadowBlur = 6;
    ctx.fillRect(x, H - bH - 2, barW, 2); ctx.shadowBlur = 0;
    if (bH > 8) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(x, H - bH - 4, barW, 2); }
  }
}

function drawWaveVisualizer(ctx, W, H, data) {
  const sliceW = W / data.length;
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * sliceW, y = ((v + 1) / 2) * H;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#22d8ff'; ctx.lineWidth = 1.5;
  ctx.shadowColor = '#22d8ff'; ctx.shadowBlur  = 8; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.lineTo(W, H / 2); ctx.lineTo(0, H / 2);
  const fillGrd = ctx.createLinearGradient(0, 0, 0, H);
  fillGrd.addColorStop(0, 'rgba(34,216,255,0.15)'); fillGrd.addColorStop(1, 'rgba(0,80,255,0.02)');
  ctx.fillStyle = fillGrd; ctx.fill();
}

function drawCircleVisualizer(ctx, W, H) {
  const t = Date.now() * 0.001;
  const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.35;
  ctx.beginPath();
  for (let i = 0; i <= 360; i++) {
    const a = i * Math.PI / 180;
    const rr = r + Math.sin(a * 3 + t) * r * 0.25;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grd = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grd.addColorStop(0, 'rgba(34,216,255,0.3)'); grd.addColorStop(1, 'rgba(0,80,255,0.1)');
  ctx.strokeStyle = '#22d8ff'; ctx.lineWidth = 1.5; ctx.shadowColor = '#22d8ff'; ctx.shadowBlur = 10;
  ctx.stroke(); ctx.shadowBlur = 0; ctx.fillStyle = grd; ctx.fill();
}

function formatTime(s) {
  if (!isFinite(s)) return '--:--';
  return Math.floor(s / 60).toString().padStart(2, '0') + ':' + Math.floor(s % 60).toString().padStart(2, '0');
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.getElementById('login-btn')?.addEventListener('click', doLogin);
document.getElementById('login-card')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

function initMobileSkillBars() {
  setTimeout(() => {
    document.querySelectorAll('.m-sk-fill').forEach(fill => {
      const w = fill.closest('.m-skill')?.dataset.w || 0;
      fill.style.width = w + '%';
    });
  }, 500);
}
/* ═══ ROLE TYPEWRITER — drives the About sidebar and the mobile hero ═══ */
const ROLE_TITLES = [
  'Web Application Developer',
  'Laravel Specialist',
  'Full-Stack Engineer',
  'Aspiring DevOps Engineer',
];

function startRoleTypewriter(el, roles, opts = {}) {
  if (!el) return;
  const typeSpeed  = opts.typeSpeed  ?? 55;
  const eraseSpeed = opts.eraseSpeed ?? 30;
  const holdTime   = opts.holdTime   ?? 1800;
  el.classList.add('typewriter-cursor');
  let roleIdx = 0, charIdx = 0, erasing = false;

  function tick() {
    const full = roles[roleIdx];
    if (!erasing) {
      charIdx++;
      el.textContent = full.slice(0, charIdx);
      if (charIdx === full.length) { erasing = true; setTimeout(tick, holdTime); return; }
      setTimeout(tick, typeSpeed);
    } else {
      charIdx--;
      el.textContent = full.slice(0, charIdx);
      if (charIdx === 0) { erasing = false; roleIdx = (roleIdx + 1) % roles.length; setTimeout(tick, 350); return; }
      setTimeout(tick, eraseSpeed);
    }
  }
  tick();
}

function initRoleTypewriters() {
  startRoleTypewriter(document.getElementById('asb-role-text'), ROLE_TITLES);
  startRoleTypewriter(document.getElementById('m-typed-role'),  ROLE_TITLES);
}

/* ═══ AVATAR TILT — pointer-reactive 3D tilt on the ID photo ═══ */
function initAvatarTilt() {
  const avatar = document.getElementById('asb-avatar-widget');
  const photo  = document.getElementById('asb-profile-img');
  if (!avatar || !photo) return;
  let raf = null, px = 0, py = 0;

  function apply() {
    raf = null;
    photo.style.setProperty('--tilt-y', (px * 14).toFixed(2) + 'deg');
    photo.style.setProperty('--tilt-x', (py * -14).toFixed(2) + 'deg');
  }
  avatar.addEventListener('pointermove', e => {
    const rect = avatar.getBoundingClientRect();
    px = (e.clientX - rect.left) / rect.width  - 0.5;
    py = (e.clientY - rect.top)  / rect.height - 0.5;
    if (raf == null) raf = requestAnimationFrame(apply);
  });
  avatar.addEventListener('pointerleave', () => {
    px = 0; py = 0;
    if (raf == null) raf = requestAnimationFrame(apply);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  try {
    const _t = sessionStorage.getItem('luna-theme');
      if (_t) document.documentElement.setAttribute('data-theme', _t);
    } catch(_) {}
    handleViewportChange();
    if (OS.narrow) {
    const boot  = document.getElementById('boot-screen');
    const login = document.getElementById('login-screen');
    if (boot)  boot.style.display  = 'none';
    if (login) login.style.display = 'none';
    document.getElementById('mobile-nav')?.classList.remove('hidden');
    document.getElementById('mobile-content')?.classList.remove('hidden');
    initMobileSkillBars();
  } else {
    initBoot();
  }
  initRoleTypewriters();
});
function normaliseTracklist(raw, folder) {
  return raw.map((t, i) => {
    if (t.file && t.title) {
      return {
        url:       `./${folder}/${encodeURIComponent(t.file)}`,
        file:      t.file,
        name:      t.title,
        artist:    t.artist   || 'Unknown Artist',
        album:     t.album    || null,
        duration:  t.duration || '--:--',
        id:        t.id       || `track_${i}`,
        palette:   t.palette  || null,
        sortIndex: t.sortIndex != null ? t.sortIndex : i,
      };
    }
    const file = t.file || t.filename || '';
    return {
      url:       `./${folder}/${encodeURIComponent(file)}`,
      file,
      name:      t.title || t.name || file.replace(/\.[^/.]+$/, ''),
      artist:    t.artist || 'Unknown Artist',
      duration:  t.duration || '--:--',
      id:        `track_${i}`,
      palette:   null,
      sortIndex: i,
    };
  });
}

function buildTrackFromFilename(filename, folder, index) {
  const base  = filename.replace(/\.[^/.]+$/, '').replace(/^\d{1,3}[\s.\-]+/, '').trim();
  const parts = base.split(/\s*[-–—]\s*/).map(s => s.trim()).filter(Boolean);
  const artist = parts.length >= 2 ? parts[0] : 'Unknown Artist';
  const name   = parts.length >= 2 ? parts.slice(1).join(' - ') : base;
  return {
    url:       new URL(filename, new URL(`./${folder}/`, location.href)).href,
    file:      filename,
    name,
    artist,
    duration:  '--:--',
    id:        `track_${index}`,
    palette:   null,
    sortIndex: index,
  };
}

async function fetchWithTimeout(url, ms = 5000) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), ms);
  try {
    const resp = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
    clearTimeout(timer);
    return resp;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}
/* ================================================================
   LUNA AERO OS — Photo Viewer  (main-additions.js)
   ================================================================
   HOW TO INTEGRATE
   ─────────────────
   1. Append the entire contents of this file to the end of main.js.
   2. In WIN_GEOMETRY (inside main.js), add the photos entry:
        photos: { wFrac:0.60, hFrac:0.68, minW:480, minH:400, maxW:1080, maxH:800 },
   3. In WINDOW_ICONS (inside main.js), add:
        photos: '🖼️',
   4. In initDesktop() (inside main.js), add:
        initPhotoViewer();
   5. In initKeyboardShortcuts() → the altKey map, add:
        'g': 'photos',
   6. In the SHORTCUT_DEFS array, add:
        { keys: ['Alt','G'], desc: 'Open Pictures / Photo Viewer' },
   ================================================================ */

/* ── Photo Viewer state ──────────────────────────────────────── */
const PV = {
  pictures:   [],   // { id, file, caption, mimeType, sizeBytes, sizeKB, url, blobUrl }
  viewMode:   'grid',   // 'grid' | 'list'
  sortMode:   'name',   // 'name' | 'size'
  lbIndex:    -1,
  lbZoom:     1.0,
  lbRotation: 0,
  lbDragging: false,
  lbDragStartX: 0, lbDragStartY: 0,
  lbImgOffsetX: 0, lbImgOffsetY: 0,
};

const IMAGE_EXT_RE = /\.(jpe?g|png)$/i;

/* ── Entry point ─────────────────────────────────────────────── */
function initPhotoViewer() {
  /* Toolbar buttons */
  document.getElementById('pv-view-grid')?.addEventListener('click', () => setPVView('grid'));
  document.getElementById('pv-view-list')?.addEventListener('click', () => setPVView('list'));
  document.getElementById('pv-sort-name')?.addEventListener('click', () => setPVSort('name'));
  document.getElementById('pv-sort-size')?.addEventListener('click', () => setPVSort('size'));
  document.getElementById('pv-add-btn')  ?.addEventListener('click', () => document.getElementById('pv-file-input')?.click());
  document.getElementById('pv-empty-add-btn')?.addEventListener('click', () => document.getElementById('pv-file-input')?.click());

  /* File input (add photos from device) */
  document.getElementById('pv-file-input')?.addEventListener('change', e => {
    const files = [...e.target.files].filter(f => IMAGE_EXT_RE.test(f.name));
    if (files.length) addLocalPhotos(files);
    e.target.value = '';
  });

  /* Lightbox controls */
  document.getElementById('pv-lb-close')   ?.addEventListener('click', closeLightbox);
  document.getElementById('pv-lb-backdrop')?.addEventListener('click', closeLightbox);
  document.getElementById('pv-lb-prev')    ?.addEventListener('click', () => lbNavigate(-1));
  document.getElementById('pv-lb-next')    ?.addEventListener('click', () => lbNavigate(1));
  document.getElementById('pv-lb-zoom-in') ?.addEventListener('click', () => lbZoom(0.25));
  document.getElementById('pv-lb-zoom-out')?.addEventListener('click', () => lbZoom(-0.25));
  document.getElementById('pv-lb-zoom-fit')?.addEventListener('click', lbResetZoom);
  document.getElementById('pv-lb-rotate')  ?.addEventListener('click', lbRotate);

  /* Keyboard inside lightbox */
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('pv-lightbox');
    if (!lb || lb.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); lbNavigate(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); lbNavigate(1);  }
    if (e.key === 'Escape')     { e.preventDefault(); closeLightbox(); }
    if (e.key === '+' || e.key === '=') lbZoom(0.25);
    if (e.key === '-')           lbZoom(-0.25);
    if (e.key === '0')           lbResetZoom();
    if (e.key === 'r' || e.key === 'R') lbRotate();
  });

  /* Swipe support on lightbox image */
  initLightboxSwipe();

  /* Drag-to-pan on zoomed image */
  initLightboxDragPan();

  /* Drop zone on the photos window body */
  initPVDropZone();

  /* Load from generated manifest */
  loadPictureFolder();
}

/* ── Load manifest ───────────────────────────────────────────── */
async function loadPictureFolder() {
  /* PRIORITY 1: window.__PICTURELIST__ from <script src="pictures/picturelist.js"> */
  if (Array.isArray(window.__PICTURELIST__) && window.__PICTURELIST__.length > 0) {
    console.info(`[Luna Photos] Loaded ${window.__PICTURELIST__.length} image(s) from window.__PICTURELIST__`);
    applyDiscoveredPictures(
      normalisePicturelist(window.__PICTURELIST__, 'pictures'),
      'pictures/picturelist.js (script tag)'
    );
    return;
  }

  /* PRIORITY 2: fetch picturelist.json over HTTP */
  const jsonCandidates = [
    './pictures/picturelist.json',
    './pictures/manifest.json',
  ];
  for (const jsonPath of jsonCandidates) {
    try {
      const resp = await fetchWithTimeout(jsonPath, 4000);
      if (!resp.ok) continue;
      const raw = await resp.json();
      if (!Array.isArray(raw) || raw.length === 0) continue;
      console.info(`[Luna Photos] Loaded ${raw.length} image(s) via fetch() from ${jsonPath}`);
      applyDiscoveredPictures(normalisePicturelist(raw, 'pictures'), jsonPath);
      return;
    } catch (e) {
      console.info(`[Luna Photos] fetch(${jsonPath}) failed: ${e.message}`);
    }
  }

  /* PRIORITY 3: directory index scrape (nginx/Apache/local dev only) */
  const folderCandidates = ['pictures', 'images', 'assets/pictures'];
  for (const folder of folderCandidates) {
    try {
      const resp = await fetchWithTimeout(`./${folder}/`, 3000);
      if (!resp.ok) continue;
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('text/html')) continue;
      const html  = await resp.text();
      const doc   = new DOMParser().parseFromString(html, 'text/html');
      const hrefs = [...doc.querySelectorAll('a[href]')]
        .map(a => a.getAttribute('href'))
        .filter(h => h && IMAGE_EXT_RE.test(h) && !h.startsWith('?') && !h.startsWith('/..'));
      if (!hrefs.length) continue;
      const pics = hrefs.map((href, i) => {
        const filename = decodeURIComponent(href.split('/').pop());
        return buildPicFromFilename(filename, folder, i);
      });
      console.info(`[Luna Photos] Loaded ${pics.length} image(s) from directory index: ${folder}/`);
      applyDiscoveredPictures(pics, `${folder}/ (directory index)`);
      return;
    } catch (e) {
      console.info(`[Luna Photos] directory scan failed: ${e.message}`);
    }
  }

  /* PRIORITY 4: nothing — show empty state */
  console.info('[Luna Photos] No picturelist found. Run: node generate-picturelist.js');
  renderPVEmpty();
}

function applyDiscoveredPictures(pics, sourceLabel) {
  if (!Array.isArray(pics) || pics.length === 0) { renderPVEmpty(); return; }
  PV.pictures = pics;
  renderPV();
  console.info(`[Luna Photos] applyDiscoveredPictures: ${pics.length} image(s) from ${sourceLabel}`);
}

function normalisePicturelist(raw, folder) {
  return raw.map((p, i) => ({
    id:        p.id       || `pic_${i}`,
    file:      p.file     || p.filename || '',
    caption:   p.caption  || p.name || p.file?.replace(/\.[^/.]+$/, '') || `Image ${i + 1}`,
    mimeType:  p.mimeType || 'image/jpeg',
    sizeBytes: p.sizeBytes || null,
    sizeKB:    p.sizeKB   || (p.sizeBytes ? +(p.sizeBytes / 1024).toFixed(1) : null),
    sortIndex: p.sortIndex != null ? p.sortIndex : i,
    url:       `./${folder}/${p.file || p.filename || ''}`,
    blobUrl:   null,
  }));
}

function buildPicFromFilename(filename, folder, index) {
  const base    = filename.replace(/\.[^/.]+$/, '').replace(/^\d{1,4}[\s.\-_]+/, '').trim();
  const caption = base.replace(/[_\-]+/g, ' ') || filename;
  const ext     = filename.toLowerCase().endsWith('.png') ? '.png' : '.jpg';
  return {
    id:        `pic_${index}`,
    file:       filename,
    caption,
    mimeType:  ext === '.png' ? 'image/png' : 'image/jpeg',
    sizeBytes: null,
    sizeKB:    null,
    sortIndex: index,
    url:       new URL(filename, new URL(`./${folder}/`, location.href)).href,
    blobUrl:   null,
  };
}

/* ── Add local photos (from device via file input / drop) ─────── */
function addLocalPhotos(files) {
  files.forEach((file, i) => {
    const blobUrl = URL.createObjectURL(file);
    const base    = file.name.replace(/\.[^/.]+$/, '').replace(/^\d{1,4}[\s.\-_]+/, '').trim();
    const caption = base.replace(/[_\-]+/g, ' ') || file.name;
    PV.pictures.push({
      id:        `local_${Date.now()}_${i}`,
      file:       file.name,
      caption,
      mimeType:  file.type || 'image/jpeg',
      sizeBytes: file.size,
      sizeKB:    +(file.size / 1024).toFixed(1),
      sortIndex: PV.pictures.length,
      url:       blobUrl,
      blobUrl,
    });
  });
  renderPV();
  showToast('Pictures', `Added ${files.length} photo${files.length > 1 ? 's' : ''}`, 'img:icons/094.ico');
}

/* ── Drop zone on PV window ─────────────────────────────────── */
function initPVDropZone() {
  const body = document.querySelector('.pv-win-body');
  if (!body) return;
  body.addEventListener('dragover', e => { e.preventDefault(); body.classList.add('pv-drag-over'); });
  body.addEventListener('dragleave', () => body.classList.remove('pv-drag-over'));
  body.addEventListener('drop', e => {
    e.preventDefault();
    body.classList.remove('pv-drag-over');
    const files = [...e.dataTransfer.files].filter(f => IMAGE_EXT_RE.test(f.name));
    if (files.length) addLocalPhotos(files);
  });
}

/* ── Sort helpers ─────────────────────────────────────────────── */
function getSortedPictures() {
  const pics = [...PV.pictures];
  if (PV.sortMode === 'size') {
    pics.sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0));
  } else {
    pics.sort((a, b) => a.caption.localeCompare(b.caption, undefined, { sensitivity: 'base', numeric: true }));
  }
  return pics;
}

/* ── Render ─────────────────────────────────────────────────── */
function renderPVEmpty() {
  document.getElementById('pv-empty')?.classList.remove('hidden');
  document.getElementById('pv-grid') ?.classList.add('hidden');
  document.getElementById('pv-list-view')?.classList.add('hidden');
  updatePVStatus();
}

function renderPV() {
  const empty = document.getElementById('pv-empty');
  if (!PV.pictures.length) { renderPVEmpty(); return; }
  empty?.classList.add('hidden');

  if (PV.viewMode === 'grid') renderPVGrid();
  else                         renderPVList();
  updatePVStatus();
}

function renderPVGrid() {
  const grid     = document.getElementById('pv-grid');
  const listView = document.getElementById('pv-list-view');
  if (!grid) return;
  grid.classList.remove('hidden');
  listView?.classList.add('hidden');

  const sorted = getSortedPictures();
  grid.innerHTML = '';

  sorted.forEach((pic, idx) => {
    const card = document.createElement('div');
    card.className   = 'pv-thumb-card';
    card.tabIndex    = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open ${escHtml(pic.caption)}`);

    /* Wrapper keeps aspect ratio */
    const wrap = document.createElement('div');
    wrap.className = 'pv-thumb-wrap';

    const img = document.createElement('img');
    img.className = 'pv-thumb-img';
    img.src       = pic.url;
    img.alt       = pic.caption;
    img.loading   = 'lazy';
    img.decoding  = 'async';
    img.draggable = false;
    img.addEventListener('error', () => {
      wrap.classList.add('pv-thumb-error');
      img.style.display = 'none';
      const err = document.createElement('div');
      err.className   = 'pv-thumb-err-icon';
      err.textContent = '⚠';
      wrap.appendChild(err);
    });

    wrap.appendChild(img);

    const label = document.createElement('div');
    label.className   = 'pv-thumb-label';
    label.textContent = pic.caption;

    const size = document.createElement('div');
    size.className   = 'pv-thumb-size';
    size.textContent = pic.sizeKB ? `${pic.sizeKB} KB` : '';

    card.appendChild(wrap);
    card.appendChild(label);
    card.appendChild(size);

    /* Open lightbox */
    const realIdx = PV.pictures.indexOf(pic);
    card.addEventListener('click',   () => openLightbox(realIdx));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(realIdx); }
    });

    grid.appendChild(card);
  });
}

function renderPVList() {
  const grid     = document.getElementById('pv-grid');
  const listView = document.getElementById('pv-list-view');
  const rows     = document.getElementById('pv-list-rows');
  if (!listView || !rows) return;
  grid?.classList.add('hidden');
  listView.classList.remove('hidden');
  rows.innerHTML = '';

  const sorted = getSortedPictures();

  sorted.forEach(pic => {
    const row = document.createElement('div');
    row.className = 'pvl-row';
    row.tabIndex  = 0;
    row.setAttribute('role', 'button');

    const thumb = document.createElement('div');
    thumb.className = 'pvl-col-thumb';
    const tImg = document.createElement('img');
    tImg.src     = pic.url;
    tImg.alt     = '';
    tImg.loading = 'lazy';
    tImg.addEventListener('error', () => { tImg.style.display = 'none'; });
    thumb.appendChild(tImg);

    const name = document.createElement('div');
    name.className   = 'pvl-col-name';
    name.textContent = pic.caption;

    const type = document.createElement('div');
    type.className   = 'pvl-col-type';
    type.textContent = pic.mimeType === 'image/png' ? 'PNG Image' : 'JPEG Image';

    const size = document.createElement('div');
    size.className   = 'pvl-col-size';
    size.textContent = pic.sizeKB ? `${pic.sizeKB} KB` : '—';

    row.appendChild(thumb);
    row.appendChild(name);
    row.appendChild(type);
    row.appendChild(size);

    const realIdx = PV.pictures.indexOf(pic);
    row.addEventListener('click',   () => openLightbox(realIdx));
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(realIdx); }
    });

    rows.appendChild(row);
  });
}

function updatePVStatus() {
  const count = PV.pictures.length;
  const totalKB = PV.pictures.reduce((s, p) => s + (p.sizeKB || 0), 0);
  const display = totalKB > 1024
    ? `${(totalKB / 1024).toFixed(1)} MB`
    : `${totalKB.toFixed(0)} KB`;

  const countEl = document.getElementById('pv-status-count');
  const sizeEl  = document.getElementById('pv-status-size');
  if (countEl) countEl.textContent = `${count} item${count !== 1 ? 's' : ''}`;
  if (sizeEl)  sizeEl.textContent  = count ? display : '0 KB';
}

function setPVView(mode) {
  PV.viewMode = mode;
  document.getElementById('pv-view-grid')?.classList.toggle('active', mode === 'grid');
  document.getElementById('pv-view-list')?.classList.toggle('active', mode === 'list');
  renderPV();
}

function setPVSort(mode) {
  PV.sortMode = mode;
  document.getElementById('pv-sort-name')?.classList.toggle('active', mode === 'name');
  document.getElementById('pv-sort-size')?.classList.toggle('active', mode === 'size');
  renderPV();
}

/* ── Lightbox ────────────────────────────────────────────────── */
function openLightbox(idx) {
  if (idx < 0 || idx >= PV.pictures.length) return;
  PV.lbIndex    = idx;
  PV.lbZoom     = 1.0;
  PV.lbRotation = 0;

  const lb = document.getElementById('pv-lightbox');
  lb?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  lbLoadImage(idx);
  OS.zTop += 10;
  if (lb) lb.style.zIndex = OS.zTop;
}

function closeLightbox() {
  document.getElementById('pv-lightbox')?.classList.add('hidden');
  document.body.style.overflow = '';
  PV.lbIndex    = -1;
  PV.lbZoom     = 1.0;
  PV.lbRotation = 0;
  const img = document.getElementById('pv-lb-img');
  if (img) { img.src = ''; img.style.transform = ''; }
}

function lbLoadImage(idx) {
  const pic     = PV.pictures[idx];
  if (!pic) return;
  const img     = document.getElementById('pv-lb-img');
  const spinner = document.getElementById('pv-lb-spinner');
  const caption = document.getElementById('pv-lb-caption');
  const counter = document.getElementById('pv-lb-counter');
  const meta    = document.getElementById('pv-lb-meta');
  const dlBtn   = document.getElementById('pv-lb-download');

  /* Reset zoom/rotation for new image */
  PV.lbZoom     = 1.0;
  PV.lbRotation = 0;
  lbApplyTransform();

  if (img && spinner) {
    spinner.classList.remove('hidden');
    img.classList.add('pv-lb-loading');
    img.onload = () => {
      spinner.classList.add('hidden');
      img.classList.remove('pv-lb-loading');
    };
    img.onerror = () => {
      spinner.classList.add('hidden');
      img.classList.remove('pv-lb-loading');
    };
    img.src = pic.url;
    img.alt = pic.caption;
  }

  if (caption) caption.textContent = pic.caption;
  if (counter) counter.textContent = `${idx + 1} / ${PV.pictures.length}`;
  if (meta)    meta.textContent    = [
    pic.mimeType === 'image/png' ? 'PNG' : 'JPEG',
    pic.sizeKB ? `${pic.sizeKB} KB` : null,
  ].filter(Boolean).join(' · ');

  /* Download button */
  if (dlBtn) {
    dlBtn.onclick = () => {
      const a = document.createElement('a');
      a.href     = pic.url;
      a.download = pic.file || pic.caption;
      a.click();
    };
  }
}

function lbNavigate(delta) {
  const next = PV.lbIndex + delta;
  if (next < 0 || next >= PV.pictures.length) return;
  PV.lbIndex = next;
  lbLoadImage(next);
}

function lbZoom(delta) {
  PV.lbZoom = Math.max(0.25, Math.min(5, PV.lbZoom + delta));
  lbApplyTransform();
}

function lbResetZoom() {
  PV.lbZoom     = 1.0;
  PV.lbRotation = 0;
  lbApplyTransform();
}

function lbRotate() {
  PV.lbRotation = (PV.lbRotation + 90) % 360;
  lbApplyTransform();
}

function lbApplyTransform() {
  const img = document.getElementById('pv-lb-img');
  if (img) img.style.transform = `scale(${PV.lbZoom}) rotate(${PV.lbRotation}deg)`;
}

/* Mouse-wheel zoom inside lightbox */
document.addEventListener('wheel', e => {
  const lb = document.getElementById('pv-lightbox');
  if (!lb || lb.classList.contains('hidden')) return;
  if (!e.target.closest('#pv-lb-stage')) return;
  e.preventDefault();
  lbZoom(e.deltaY < 0 ? 0.1 : -0.1);
}, { passive: false });

/* Swipe on touch screens */
function initLightboxSwipe() {
  const stage = document.getElementById('pv-lb-stage');
  if (!stage) return;
  let startX = 0;
  stage.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) lbNavigate(dx < 0 ? 1 : -1);
  });
}

/* Drag-to-pan when zoomed > 1 */
function initLightboxDragPan() {
  const stage = document.getElementById('pv-lb-stage');
  const img   = document.getElementById('pv-lb-img');
  if (!stage || !img) return;

  let dragging = false, startX = 0, startY = 0, startOx = 0, startOy = 0;

  stage.addEventListener('mousedown', e => {
    if (PV.lbZoom <= 1) return;
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    startOx = PV.lbImgOffsetX; startOy = PV.lbImgOffsetY;
    stage.style.cursor = 'grabbing';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    PV.lbImgOffsetX = startOx + (e.clientX - startX);
    PV.lbImgOffsetY = startOy + (e.clientY - startY);
    img.style.transform = `translate(${PV.lbImgOffsetX}px,${PV.lbImgOffsetY}px) scale(${PV.lbZoom}) rotate(${PV.lbRotation}deg)`;
  });
  document.addEventListener('mouseup', () => {
    dragging = false;
    stage.style.cursor = '';
  });
}

/* ── fetchWithTimeout is already defined in main.js — skip if duplicate ── */
/* (If you get a duplicate declaration error, remove the one below) */
if (typeof fetchWithTimeout === 'undefined') {
  window.fetchWithTimeout = async function(url, ms = 5000) {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), ms);
    try {
      const resp = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
      clearTimeout(timer);
      return resp;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  };
}
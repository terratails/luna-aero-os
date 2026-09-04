'use strict';
/* ================================================================
   01-boot-login.js
   Luna Aero OS — Boot sequence, login screen, shared scene canvas
   ----------------------------------------------------------------
   Depends on: 00-state.js (OS, BOOT_STEPS, sceneFrames)
   Exposes:    initBoot, showLogin, doLogin, drawSceneField
   ================================================================ */

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

/* Shared animated bubble/sparkle/wave scene used by boot, login, wallpaper,
   and the screensaver canvases. Reads the current --data-theme to recolor. */
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

document.getElementById('login-btn')?.addEventListener('click', doLogin);
document.getElementById('login-card')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
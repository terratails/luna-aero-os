'use strict';
/* js/desktop-init.js */
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
function initWallpaper() {
  const canvas = document.getElementById('wallpaper-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  drawSceneField(ctx, canvas, 'wallpaper');
}
function initMobileSkillBars() {
  setTimeout(() => {
    document.querySelectorAll('.m-sk-fill').forEach(fill => {
      const w = fill.closest('.m-skill')?.dataset.w || 0;
      fill.style.width = w + '%';
    });
  }, 500);
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
'use strict';
/* js/themes.js */
function initThemePicker() {
  const grid = document.getElementById('tp-grid');
  if (!grid) return;
  const saved = (() => {
    try { return sessionStorage.getItem('luna-theme') || 'aqua-deep'; }
    catch(e) { return 'aqua-deep'; }
  })();
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
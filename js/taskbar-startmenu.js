'use strict';

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
}

function updateTaskbarButtons() {
  const container = document.getElementById('tb-open-wins');
  if (!container) return;
  container.innerHTML = '';
  OS.openWindows.forEach((data, id) => {
    const btn = document.createElement('button');
    btn.className = 'tb-win-btn' + (OS.activeWindow === id && !data.minimized ? ' active' : '');
    const icoSrc  = TASKBAR_ICONS[id];
    const icoHtml = icoSrc
      ? `<img src="${icoSrc}" style="width:14px;height:14px;object-fit:contain;flex-shrink:0;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));" onerror="this.style.display='none'" alt=""/>`
      : '';
    btn.innerHTML = `${icoHtml}<span>${escHtml(data.title.split('—')[0].trim())}</span>`;
    btn.addEventListener('click', () => {
      if (data.minimized)              restoreWindow(id);
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

  document.getElementById('sm-cascade-btn')?.addEventListener('click',   () => { cascadeWindows(); menu.classList.add('hidden'); });
  document.getElementById('sm-close-all-btn')?.addEventListener('click', () => { OS.openWindows.forEach((_, id) => minimizeWindow(id)); menu.classList.add('hidden'); });
  document.getElementById('sm-shortcuts-btn')?.addEventListener('click', () => { menu.classList.add('hidden'); toggleShortcutsPanel(); });
}

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
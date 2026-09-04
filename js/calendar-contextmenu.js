'use strict';
/* js/calendar-contextmenu.js */
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

  document.getElementById('cal-prev')?.addEventListener('click', () => {
    OS.calMonth--;
    if (OS.calMonth < 0) { OS.calMonth = 11; OS.calYear--; }
    renderCalGrid();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    OS.calMonth++;
    if (OS.calMonth > 11) { OS.calMonth = 0; OS.calYear++; }
    renderCalGrid();
  });
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
    cell.className   = 'cal-cell' + (isToday ? ' today' : '');
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
      if (a === 'refresh')        initWallpaper();
      else if (a === 'shortcuts') toggleShortcutsPanel();
      else if (a)                 openWindow(a);
    });
  });
}
'use strict';

(function(){
  const HOME_URL = 'https://html.duckduckgo.com/html/';
  let history = [HOME_URL];
  let historyIndex = 0;
  let loadTimer = null;

  const iframe   = () => document.getElementById('br-iframe');
  const addrIn   = () => document.getElementById('br-addr-input');
  const blocked  = () => document.getElementById('br-blocked');
  const blockedDesc = () => document.getElementById('br-blocked-desc');
  const loading  = () => document.getElementById('br-loading');
  const statusEl = () => document.getElementById('br-status-text');
  const titleEl  = () => document.getElementById('browser-title-text');
  const backBtn  = () => document.getElementById('br-back');
  const fwdBtn   = () => document.getElementById('br-forward');

  function normalizeUrl(raw) {
    let v = raw.trim();
    if (!v) return HOME_URL;
    const looksLikeUrl = /^https?:\/\//i.test(v) || (/^[\w-]+(\.[\w-]+)+/.test(v) && !v.includes(' '));
    if (looksLikeUrl) {
      if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
      return v;
    }
    return 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(v);
  }

  function navigate(url, pushHistory = true) {
    const target = normalizeUrl(url);
    blocked().classList.add('hidden');
    iframe().classList.remove('hidden');
    loading().classList.remove('hidden');
    statusEl().textContent = 'Loading ' + target + '…';
    addrIn().value = target;

    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => {
      showBlocked(target);
    }, 4500);

    iframe().src = target;

    if (pushHistory) {
      history = history.slice(0, historyIndex + 1);
      history.push(target);
      historyIndex = history.length - 1;
    }
    updateNavButtons();
  }

  function showBlocked(url) {
    clearTimeout(loadTimer);
    loading().classList.add('hidden');
    iframe().classList.add('hidden');
    blockedDesc().textContent = `"${url}" refused to load inside Luna Web — most likely it blocks embedding for security reasons.`;
    blocked().classList.remove('hidden');
    statusEl().textContent = 'Blocked';
  }

  function updateNavButtons() {
    backBtn().disabled = historyIndex <= 0;
    fwdBtn().disabled  = historyIndex >= history.length - 1;
  }

  function initBrowserWindow() {
    if (iframe()._lunaBrowserInit) return;
    iframe()._lunaBrowserInit = true;

    iframe().addEventListener('load', () => {
      clearTimeout(loadTimer);
      loading().classList.add('hidden');

      let looksBlocked = false;
      try {
        const win = iframe().contentWindow;
        const doc = iframe().contentDocument;
        if (!win || !doc) {
          looksBlocked = true;
        } else if (doc.body && doc.body.childElementCount === 0 && doc.title === '') {
          looksBlocked = true;
        }
      } catch (e) {
      }

      if (looksBlocked) {
        showBlocked(history[historyIndex]);
        return;
      }

      try {
        const t = iframe().contentDocument?.title;
        if (t) titleEl().textContent = t + ' — Luna Web';
      } catch (e) {
      }
      statusEl().textContent = 'Done';
    });

    document.getElementById('br-addr-go')?.addEventListener('click', () => navigate(addrIn().value));
    addrIn()?.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(addrIn().value); });

    document.getElementById('br-back')?.addEventListener('click', () => {
      if (historyIndex > 0) { historyIndex--; navigate(history[historyIndex], false); }
    });
    document.getElementById('br-forward')?.addEventListener('click', () => {
      if (historyIndex < history.length - 1) { historyIndex++; navigate(history[historyIndex], false); }
    });
    document.getElementById('br-reload')?.addEventListener('click', () => navigate(history[historyIndex], false));
    document.getElementById('br-home')?.addEventListener('click', () => navigate(HOME_URL));

    document.getElementById('br-blocked-open')?.addEventListener('click', () => {
      window.open(history[historyIndex], '_blank', 'noopener');
    });

    document.querySelectorAll('.br-bm').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.url));
    });

    navigate(HOME_URL, false);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const winEl = document.getElementById('win-browser');
    if (!winEl) return;
    const obs = new MutationObserver(() => {
      if (!winEl.classList.contains('hidden')) initBrowserWindow();
    });
    obs.observe(winEl, { attributes: true, attributeFilter: ['class'] });
  });
})();
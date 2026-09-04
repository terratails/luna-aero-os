'use strict';
/* js/notepad-calculator.js */

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
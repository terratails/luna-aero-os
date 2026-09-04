'use strict';
/* js/content-windows.js */
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
      if (featured) featured.parentElement.style.display =
        featured.style.display === 'none' && visible === 0 ? 'none' : '';
      const countEl = document.getElementById('proj-count');
      if (countEl) countEl.textContent = `${visible} Project${visible !== 1 ? 's' : ''}`;
    });
  });
}

function initSystemInfo() { /* placeholder — bars animated on openWindow */ }

function animateSysInfoBars() {
  document.querySelectorAll('.si-bar-fill').forEach(bar => {
    const val = bar.dataset.val || 50;
    setTimeout(() => bar.style.width = val + '%', 200);
  });
}

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
      if (id === 'cf-name')    validateField('cf-name',    v => v.trim().length >= 2, 'Enter your full name');
      if (id === 'cf-email')   validateField('cf-email',   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email');
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
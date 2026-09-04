
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

      appendTermLine(
        `<span class="tc-prompt"><span class="tc-user">glen</span><span class="tc-at">@</span><span class="tc-host">luna-os</span><span class="tc-sep">:~$</span> <span class="tc-cmd">${escHtml(cmd)}</span></span>`,
        'html'
      );

      if (cmd) {
        history.unshift(cmd);
        histIdx = -1;
        runCommand(cmd);
      }

      input.value = '';
    }

    if (e.key === 'ArrowUp') {
      histIdx = Math.min(histIdx + 1, history.length - 1);
      input.value = history[histIdx] || '';
    }

    if (e.key === 'ArrowDown') {
      histIdx = Math.max(histIdx - 1, -1);
      input.value = history[histIdx] || '';
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      autoComplete(input);
    }
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

    whoami: () =>
      `glen · Web Application Developer · PCU · Laravel Specialist`,

    date: () =>
      new Date().toLocaleString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),

    clear: () => {
      body.innerHTML = '';
      appendTermLine(BANNER, 'html');
      return null;
    },

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
    let out = null;

    if (base === 'open' && parts[1]) {
      openWindow(parts[1]);
      out = `<span class="tc-green">Opening: ${escHtml(parts[1])}</span>`;

    } else if (base === 'snap' && parts[1] && OS.activeWindow) {
      const zone = parts[1].toLowerCase();
      const valid = ['left', 'right', 'maximize', 'tl', 'tr', 'bl', 'br'];

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

    if (out != null) {
      appendTermLine(out, 'html');
    }

    input.focus();
    body.scrollTop = body.scrollHeight;
  }

  function appendTermLine(html, type = 'text') {
    const p = document.createElement('p');
    p.className = 'tc-output';

    if (type === 'html') {
      p.innerHTML = html;
    } else {
      p.textContent = html;
    }

    body.appendChild(p);
    body.scrollTop = body.scrollHeight;
  }

  function autoComplete(inp) {
    const partial = inp.value.toLowerCase();
    const cmds = Object.keys(COMMANDS).concat(['open', 'echo', 'snap']);
    const match = cmds.find(c => c.startsWith(partial));

    if (match) {
      inp.value = match;
    }
  }
}
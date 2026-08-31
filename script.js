/* ============================================================
   Rakesh Surampalli — desktop shell
   Window manager + dock + terminal. No page scrolling, ever.
   ============================================================ */
'use strict';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCompact = () =>
  window.matchMedia('(max-width: 860px), (max-height: 560px)').matches;

const APP_NAMES = {
  findmy: 'Find My',
  terminal: 'Terminal',
  finder: 'Finder',
  notes: 'Notes',
  preview: 'Preview',
  safari: 'Safari',
  mail: 'Mail',
  photos: 'Photos',
  about: 'About'
};

const RESUME_PATH = 'Rakesh_CV.pdf';

let zTop = 10;
const windows = new Map();   // id -> element

/* ------------------------------------------------------------
   Window manager
   ------------------------------------------------------------ */
function focusWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  zTop += 1;
  win.style.zIndex = String(zTop);
  for (const [otherId, other] of windows) other.classList.toggle('is-front', otherId === id);
  const label = document.getElementById('mb-app');
  if (label) label.textContent = APP_NAMES[id] || 'Finder';
}

function openWindow(id) {
  const win = windows.get(id);
  if (!win) return;

  // The résumé PDF is only fetched the first time Preview is opened.
  if (id === 'preview') {
    const frame = document.getElementById('cv-frame');
    if (frame && !frame.getAttribute('src')) frame.setAttribute('src', RESUME_PATH);
  }
  if (id === 'safari') safariPrime();

  win.classList.remove('is-min');
  win.classList.add('is-open');
  focusWindow(id);
  syncDock();
}

function closeWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  win.classList.remove('is-open', 'is-min', 'is-front');
  syncDock();
  focusTopmost();
}

function minimizeWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  win.classList.add('is-min');
  win.classList.remove('is-front');
  syncDock();
  focusTopmost();
}

function zoomWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  win.classList.toggle('is-zoom');
  focusWindow(id);
}

/** After closing or minimizing, hand focus to whatever is still visible and highest. */
function focusTopmost() {
  let best = null, bestZ = -1;
  for (const [id, win] of windows) {
    if (!win.classList.contains('is-open') || win.classList.contains('is-min')) continue;
    const z = parseInt(win.style.zIndex || '0', 10);
    if (z >= bestZ) { bestZ = z; best = id; }
  }
  if (best) focusWindow(best);
}

function syncDock() {
  document.querySelectorAll('.dock-app[data-open]').forEach(btn => {
    const win = windows.get(btn.dataset.open);
    btn.classList.toggle('is-running', !!win && win.classList.contains('is-open'));
  });
}

/* ------------------------------------------------------------
   Placement — keep every window on screen at any viewport size
   ------------------------------------------------------------ */
function placeWindow(win) {
  if (isCompact()) {
    win.style.left = win.style.top = win.style.width = win.style.height = '';
    return;
  }
  const menubar = 28, dock = 78, margin = 10;
  // Keep the right-hand column clear so the desktop icons are not buried under a
  // window the moment the page loads.
  const iconGutter = 128;
  const availW = window.innerWidth - margin * 2 - iconGutter;
  const availH = window.innerHeight - menubar - dock - margin * 2;

  // Scale the defaults up a little on large displays, otherwise a 27in screen
  // is mostly empty wallpaper.
  const scale = Math.min(1.28, Math.max(1, window.innerWidth / 1440));
  const w = Math.min(Math.round(parseInt(win.dataset.w, 10) * scale), availW);
  const h = Math.min(Math.round(parseInt(win.dataset.h, 10) * scale), availH);
  let x = Math.round(parseInt(win.dataset.x, 10) * scale);
  let y = Math.round(parseInt(win.dataset.y, 10) * scale);

  // Nudge back inside if the default position would hang off the edge
  x = Math.max(margin, Math.min(x, window.innerWidth - w - margin - iconGutter));
  y = Math.max(menubar + margin, Math.min(y, window.innerHeight - dock - h - margin));

  win.style.width = w + 'px';
  win.style.height = h + 'px';
  win.style.left = x + 'px';
  win.style.top = y + 'px';
}

function placeAll() {
  for (const win of windows.values()) {
    win.classList.remove('is-zoom');
    placeWindow(win);
  }
  if (isCompact()) focusTopmost();
}

/* ------------------------------------------------------------
   Dragging
   ------------------------------------------------------------ */
function makeDraggable(win, handle) {
  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.light, .tb-action, input, button, a, .rs')) return;
    if (isCompact() || win.classList.contains('is-zoom')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    focusWindow(win.id);

    const rect = win.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    handle.setPointerCapture(e.pointerId);

    const onMove = (ev) => {
      // Keep the title bar reachable: never above the menu bar, never fully off-screen.
      const x = Math.max(-rect.width + 90, Math.min(ev.clientX - offX, window.innerWidth - 90));
      const y = Math.max(28, Math.min(ev.clientY - offY, window.innerHeight - 46));
      win.style.left = x + 'px';
      win.style.top = y + 'px';
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  });

  // Double-clicking the title bar zooms, same as macOS
  handle.addEventListener('dblclick', (e) => {
    if (e.target.closest('.light, .tb-action')) return;
    zoomWindow(win.id);
  });
}

function initWindows() {
  document.querySelectorAll('.window').forEach(win => {
    windows.set(win.id, win);
    placeWindow(win);

    const bar = win.querySelector('.titlebar');
    if (bar) makeDraggable(win, bar);
    makeResizable(win);

    win.addEventListener('pointerdown', () => focusWindow(win.id));

    win.querySelectorAll('.light').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === 'close') closeWindow(win.id);
        else if (act === 'minimize') minimizeWindow(win.id);
        else if (act === 'zoom') zoomWindow(win.id);
      });
    });
  });

  // Anything with data-open launches an app: dock icons, sidebar rows, the Résumé pill
  document.querySelectorAll('[data-open]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const id = el.dataset.open;
      const win = windows.get(id);
      // Clicking the dock icon of the focused window minimizes it, like macOS
      if (win && win.classList.contains('is-front') && win.classList.contains('is-open')
          && !win.classList.contains('is-min') && el.classList.contains('dock-app')) {
        minimizeWindow(id);
        return;
      }
      openWindow(id);
      if (id === 'notes' && el.dataset.note) showNote(el.dataset.note);
    });
  });

  focusWindow(isCompact() ? 'findmy' : 'terminal');
  syncDock();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(placeAll, 140);
  });
}

/* ------------------------------------------------------------
   Notes
   ------------------------------------------------------------ */
// Both sidebar lists: the plain notes and the case studies below them.
const NOTE_TABS = '#nt-tabs li, #nt-tabs-cs li';

function showNote(name) {
  document.querySelectorAll('.note').forEach(n => n.classList.toggle('is-on', n.dataset.note === name));
  document.querySelectorAll(NOTE_TABS).forEach(li => li.classList.toggle('is-on', li.dataset.note === name));
  const page = document.querySelector('.nt-page');
  if (page) page.scrollTop = 0;
}

function initNotes() {
  document.querySelectorAll(NOTE_TABS).forEach(li => {
    li.addEventListener('click', () => showNote(li.dataset.note));
  });
}

/* ------------------------------------------------------------
   Menu bar clock
   ------------------------------------------------------------ */
function initClock() {
  const el = document.getElementById('mb-clock');
  if (!el) return;
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      + '  ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    el.dateTime = now.toISOString();
  };
  tick();
  setInterval(tick, 15000);
}

/* ------------------------------------------------------------
   Terminal
   ------------------------------------------------------------ */
function initTerminal() {
  const out = document.getElementById('term-out');
  const input = document.getElementById('term-in');
  if (!out || !input) return;

  const history = [];
  let hIndex = 0;

  const commands = {
    help: {
      description: 'Show available commands',
      run: () => 'Available commands:\n' +
        Object.keys(commands).map(c => '  ' + c.padEnd(11) + commands[c].description).join('\n')
    },
    about: {
      description: 'Who I am',
      run: () => [
        'Rakesh Surampalli — Full-Stack & AI Engineer, Dallas TX',
        '',
        'I build the unglamorous half of AI: the pipelines, the APIs, the uptime.',
        'At CVS Health I ship LLM-powered summarization services and the Azure data',
        'platforms that feed them. Six years across healthcare, auctions, and IoT.'
      ].join('\n')
    },
    experience: {
      description: 'Work history',
      run: () => {
        openWindow('notes'); showNote('experience');
        return 'Opening Notes › Experience...';
      }
    },
    skills: {
      description: 'Technical skills',
      run: () => {
        openWindow('notes'); showNote('skills');
        return 'Opening Notes › Skills...';
      }
    },
    education: {
      description: 'Degrees',
      run: () => {
        openWindow('notes'); showNote('education');
        return 'Opening Notes › Education...';
      }
    },
    projects: {
      description: 'Featured projects',
      run: () => { openWindow('finder'); return 'Opening Projects in Finder...'; }
    },
    resume: {
      description: 'Open the résumé',
      run: () => { openWindow('preview'); return 'Opening Rakesh_CV.pdf in Preview...'; }
    },
    contact: {
      description: 'How to reach me',
      run: () => [
        'Email     rakeshsurampalli@gmail.com',
        'Phone     +1 (469) 927-3770   /   +91 96525 29111',
        'Location  Dallas, TX',
        'LinkedIn  linkedin.com/in/rakeshsurampalli27',
        'GitHub    github.com/rakeshsurampalli',
        '',
        'Open to full-stack and AI engineering roles.'
      ].join('\n')
    },
    email: {
      description: 'Compose an email',
      run: () => {
        window.open('mailto:rakeshsurampalli@gmail.com?subject=Opportunity', '_blank', 'noopener');
        return 'Opening mail client...';
      }
    },
    github: {
      description: 'Open GitHub',
      run: () => {
        window.open('https://github.com/rakeshsurampalli', '_blank', 'noopener');
        return 'Opening github.com/rakeshsurampalli...';
      }
    },
    linkedin: {
      description: 'Open LinkedIn',
      run: () => {
        window.open('https://www.linkedin.com/in/rakeshsurampalli27/', '_blank', 'noopener');
        return 'Opening LinkedIn...';
      }
    },
    open: {
      description: 'open <app>  — findmy, finder, notes, preview',
      run: (args) => {
        const target = (args[0] || '').toLowerCase();
        const alias = { about: 'findmy', findmy: 'findmy', projects: 'finder', finder: 'finder',
                        notes: 'notes', resume: 'preview', preview: 'preview' };
        const id = alias[target];
        if (!id) return { text: `open: unknown app '${args[0] || ''}'`, kind: 'err' };
        openWindow(id);
        return `Opening ${APP_NAMES[id]}...`;
      }
    },
    whoami: { description: 'Current user', run: () => 'rakesh' },
    pwd:    { description: 'Working directory', run: () => '/Users/rakesh' },
    ls:     { description: 'List directory', run: () => 'About  Projects  Experience  Skills  Résumé.pdf' },
    date:   { description: 'Current date', run: () => new Date().toString() },
    echo:   { description: 'Print text', run: (args) => args.join(' ') },
    clear:  { description: 'Clear the screen', run: () => { out.innerHTML = ''; return ''; } }
  };

  function print(text, kind) {
    if (text === '') return;
    const line = document.createElement('div');
    line.className = 'tl';
    const span = document.createElement('span');
    span.className = 'tt' + (kind === 'err' ? ' terr' : kind === 'dim' ? ' tdim' : '');
    span.textContent = text;
    line.appendChild(span);
    out.appendChild(line);
  }

  function echo(raw) {
    const line = document.createElement('div');
    line.className = 'tl';
    const p = document.createElement('span');
    p.className = 'tp';
    p.textContent = 'rakesh@portfolio ~ %';
    const t = document.createElement('span');
    t.className = 'tt';
    t.textContent = raw;
    line.append(p, t);
    out.appendChild(line);
  }

  function run(raw) {
    const trimmed = raw.trim();
    echo(trimmed);
    if (trimmed) {
      history.push(trimmed);
      hIndex = history.length;
      const [name, ...args] = trimmed.split(/\s+/);
      const cmd = commands[name.toLowerCase()];
      if (!cmd) {
        print(`zsh: command not found: ${name}. Type 'help'.`, 'err');
      } else {
        try {
          const res = cmd.run(args);
          if (res && typeof res === 'object') print(res.text, res.kind);
          else print(res);
        } catch {
          print(`error running: ${name}`, 'err');
        }
      }
    }
    out.scrollTop = out.scrollHeight;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      run(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hIndex > 0) input.value = history[--hIndex] ?? '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIndex < history.length - 1) input.value = history[++hIndex] ?? '';
      else { hIndex = history.length; input.value = ''; }
    } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      out.innerHTML = '';
    }
  });

  // Clicking anywhere in the terminal body focuses the prompt
  document.querySelector('.term-body')?.addEventListener('click', (e) => {
    if (window.getSelection()?.toString()) return;
    if (e.target.tagName === 'A') return;
    input.focus();
  });
}

/* ------------------------------------------------------------
   Global keys
   ------------------------------------------------------------ */
function initKeys() {
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '');

    // Spotlight: Cmd/Ctrl-K from anywhere, including while typing
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      spotlightIsOpen() ? spotlightClose() : spotlightOpen();
      return;
    }
    if (e.key === 'Escape') {
      if (spotlightIsOpen()) { spotlightClose(); return; }
      const front = [...windows.entries()].find(([, w]) => w.classList.contains('is-front'));
      if (front && front[1].classList.contains('is-zoom')) zoomWindow(front[0]);
      return;
    }
    if (typing || spotlightIsOpen()) return;

    if (e.key === '~' || e.key === '`') { e.preventDefault(); openWindow('terminal'); document.getElementById('term-in')?.focus(); }
    if (e.key === 'a') openWindow('findmy');
    if (e.key === 'p') openWindow('finder');
    if (e.key === 'n') openWindow('notes');
    if (e.key === 'r') openWindow('preview');
    if (e.key === 's') openWindow('safari');
    if (e.key === 'm') openWindow('mail');
  });
}

/* ------------------------------------------------------------
   Window resizing
   ------------------------------------------------------------ */
const RESIZE_EDGES = ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se'];

function makeResizable(win) {
  for (const edge of RESIZE_EDGES) {
    const grip = document.createElement('span');
    grip.className = 'rs rs-' + edge;
    grip.addEventListener('pointerdown', (e) => {
      if (isCompact() || win.classList.contains('is-zoom')) return;
      e.preventDefault();
      e.stopPropagation();
      focusWindow(win.id);

      const r = win.getBoundingClientRect();
      const startX = e.clientX, startY = e.clientY;
      const min = { w: 320, h: 200 };
      grip.setPointerCapture(e.pointerId);

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let { left, top, width, height } = { left: r.left, top: r.top, width: r.width, height: r.height };

        if (edge.includes('e')) width = Math.max(min.w, r.width + dx);
        if (edge.includes('s')) height = Math.max(min.h, r.height + dy);
        if (edge.includes('w')) {
          width = Math.max(min.w, r.width - dx);
          left = r.right - width;
        }
        if (edge.includes('n')) {
          height = Math.max(min.h, r.height - dy);
          top = r.bottom - height;
          if (top < 28) { top = 28; height = r.bottom - 28; }
        }
        win.style.left = left + 'px';
        win.style.top = top + 'px';
        win.style.width = width + 'px';
        win.style.height = height + 'px';
      };
      const onUp = () => {
        grip.removeEventListener('pointermove', onMove);
        grip.removeEventListener('pointerup', onUp);
        grip.removeEventListener('pointercancel', onUp);
      };
      grip.addEventListener('pointermove', onMove);
      grip.addEventListener('pointerup', onUp);
      grip.addEventListener('pointercancel', onUp);
    });
    win.appendChild(grip);
  }
}

/* ------------------------------------------------------------
   Dock magnification
   ------------------------------------------------------------ */
function initDock() {
  const dock = document.getElementById('dock');
  if (!dock || reduceMotion()) return;

  const icons = [...dock.querySelectorAll('.dock-app')];
  const reset = () => icons.forEach(i => i.style.setProperty('--mag', 1));

  let ticking = false;
  let lastX = 0;

  const apply = () => {
    ticking = false;
    for (const icon of icons) {
      const r = icon.getBoundingClientRect();
      const d = Math.abs(lastX - (r.left + r.width / 2));
      // Tight falloff: only the hovered icon and its immediate neighbours grow.
      // A wide radius made the whole dock swell at once.
      const t = Math.max(0, 1 - d / 92);
      const mag = 1 + 0.38 * t * t;
      icon.style.setProperty('--mag', mag.toFixed(3));
    }
  };

  dock.addEventListener('pointermove', (e) => {
    if (isCompact()) return;
    lastX = e.clientX;
    if (!ticking) { ticking = true; requestAnimationFrame(apply); }
  });
  dock.addEventListener('pointerleave', reset);
  dock.addEventListener('pointercancel', reset);
}

/* ------------------------------------------------------------
   Menu bar menus
   ------------------------------------------------------------ */
function initMenus() {
  const pops = {
    'mb-mark': document.getElementById('pop-mark'),
    'mb-window': document.getElementById('pop-window')
  };

  const closeAll = () => {
    for (const [btnId, pop] of Object.entries(pops)) {
      if (!pop) continue;
      pop.hidden = true;
      document.getElementById(btnId)?.setAttribute('aria-expanded', 'false');
    }
  };

  const buildWindowList = () => {
    const host = document.getElementById('pop-window-list');
    if (!host) return;
    host.textContent = '';
    let any = false;
    for (const [id, win] of windows) {
      if (!win.classList.contains('is-open')) continue;
      any = true;
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      b.textContent = APP_NAMES[id] || id;
      if (win.classList.contains('is-front')) b.classList.add('is-front-item');
      b.addEventListener('click', () => { openWindow(id); closeAll(); });
      host.appendChild(b);
    }
    if (!any) {
      const p = document.createElement('p');
      p.className = 'pop-head';
      p.textContent = 'No open windows';
      host.appendChild(p);
    }
  };

  for (const [btnId, pop] of Object.entries(pops)) {
    const btn = document.getElementById(btnId);
    if (!btn || !pop) continue;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = !pop.hidden;
      closeAll();
      if (wasOpen) return;
      if (btnId === 'mb-window') buildWindowList();
      pop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    });
  }

  document.querySelectorAll('.menu-pop button').forEach(b => {
    b.addEventListener('click', () => setTimeout(closeAll, 0));
  });

  document.getElementById('pop-close-all')?.addEventListener('click', () => {
    for (const id of windows.keys()) closeWindow(id);
  });

  document.addEventListener('click', closeAll);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
}

/* ------------------------------------------------------------
   Safari
   ------------------------------------------------------------ */
function initSafari() {
  const tabs = [...document.querySelectorAll('#sf-tabs button')];
  const frame = document.getElementById('sf-frame');
  const blocked = document.getElementById('sf-blocked');
  const urlEl = document.getElementById('sf-url');
  const openEl = document.getElementById('sf-open');
  const titleEl = document.getElementById('sf-title');
  const blockedHost = document.getElementById('sf-blocked-host');
  const blockedOpen = document.getElementById('sf-blocked-open');
  if (!tabs.length || !frame) return;

  const history = [];
  let cursor = -1;

  function render(tab, pushHistory = true) {
    const url = tab.dataset.url;
    const name = tab.dataset.name;
    tabs.forEach(t => t.classList.toggle('is-on', t === tab));
    urlEl.textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    openEl.href = url;
    titleEl.textContent = name + ' — Safari';

    if (tab.dataset.noframe) {
      // These sites send X-Frame-Options / frame-ancestors and will never render
      // in an iframe. Show what Safari shows rather than a silent blank panel.
      frame.removeAttribute('src');
      frame.style.display = 'none';
      blocked.hidden = false;
      blockedHost.textContent = urlEl.textContent;
      blockedOpen.href = url;
    } else {
      blocked.hidden = true;
      frame.style.display = '';
      if (frame.getAttribute('src') !== url) frame.setAttribute('src', url);
    }

    if (pushHistory) {
      history.splice(cursor + 1);
      history.push(tab);
      cursor = history.length - 1;
      syncNav();
    }
  }

  const back = document.getElementById('sf-back');
  const fwd = document.getElementById('sf-fwd');
  function syncNav() {
    if (back) back.disabled = cursor <= 0;
    if (fwd) fwd.disabled = cursor >= history.length - 1;
  }

  tabs.forEach(t => t.addEventListener('click', () => render(t)));
  back?.addEventListener('click', () => { if (cursor > 0) { cursor -= 1; render(history[cursor], false); syncNav(); } });
  fwd?.addEventListener('click', () => { if (cursor < history.length - 1) { cursor += 1; render(history[cursor], false); syncNav(); } });

  // The iframe src is only assigned when Safari is first opened.
  safariOpenTab = (name) => {
    const tab = tabs.find(t => t.dataset.name.toLowerCase() === String(name).toLowerCase());
    render(tab || tabs[0]);
  };
  safariPrime = () => { if (cursor === -1) render(tabs[0]); };
}

let safariOpenTab = () => {};
let safariPrime = () => {};

/* ------------------------------------------------------------
   Photos
   ------------------------------------------------------------ */
function initPhotos() {
  const viewer = document.getElementById('ph-viewer');
  const full = document.getElementById('ph-full');
  const cap = document.getElementById('ph-cap');
  if (!viewer) return;

  document.querySelectorAll('#ph-grid button').forEach(b => {
    b.addEventListener('click', () => {
      full.src = b.dataset.full;
      full.alt = b.dataset.cap || '';
      full.hidden = false;
      cap.textContent = b.dataset.cap || '';
      viewer.hidden = false;
    });
  });
  document.getElementById('ph-close')?.addEventListener('click', () => { viewer.hidden = true; });
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.hidden = true; });
}

/* ------------------------------------------------------------
   Mail — Formspree over fetch, so the visitor never leaves.
   The form action/method remain as the no-JS fallback.
   ------------------------------------------------------------ */
function initMail() {
  const form = document.getElementById('mail-form');
  const status = document.getElementById('mail-status');
  const send = document.getElementById('mail-send');
  if (!form) return;

  const setStatus = (msg, kind) => {
    if (!status) return;
    status.textContent = msg;
    status.className = 'mail-status' + (kind ? ' is-' + kind : '');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('That email address does not look right.', 'err');
      return;
    }
    send.disabled = true;
    setStatus('Sending…');
    try {
      const res = await fetch(form.action, {
        method: 'POST', body: data, headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus('Sent — I will get back to you soon.', 'ok');
    } catch {
      setStatus('Could not send. Email rakeshsurampalli@gmail.com directly.', 'err');
    } finally {
      send.disabled = false;
    }
  });
}

/* ------------------------------------------------------------
   Spotlight
   ------------------------------------------------------------ */
function buildSpotlightIndex() {
  const items = [];
  const add = (kind, title, sub, run) => items.push({ kind, title, sub, run });

  for (const [id, name] of Object.entries(APP_NAMES)) {
    add('App', name, 'Application', () => openWindow(id));
  }

  document.querySelectorAll('#nt-tabs li, #nt-tabs-cs li').forEach(li => {
    const note = li.dataset.note;
    const raw = li.querySelector('b')?.textContent || note;
    const sub = li.querySelector('em')?.textContent || 'Note';
    const isCase = note.startsWith('cs-');
    add(isCase ? 'Case' : 'Note', isCase ? raw + ' — case study' : raw, sub,
        () => { openWindow('notes'); showNote(note); });
  });

  document.querySelectorAll('.fd-item').forEach(item => {
    const name = item.querySelector('b')?.textContent?.trim();
    const desc = item.querySelector('p')?.textContent?.trim() || '';
    const live = item.querySelector('.fd-links a')?.href;
    if (!name) return;
    add('Project', name, desc.slice(0, 76), () => {
      openWindow('safari');
      safariOpenTab(name);
    });
    if (live) add('Link', name + ' — live site', live.replace(/^https?:\/\//, ''), () => window.open(live, '_blank', 'noopener'));
  });

  const seen = new Set();
  document.querySelectorAll('.note[data-note="skills"] .chips span').forEach(sp => {
    const t = sp.textContent.trim();
    if (seen.has(t)) return;
    seen.add(t);
    const group = sp.closest('.sk-group')?.querySelector('h3')?.textContent?.trim() || 'Skill';
    add('Skill', t, group, () => { openWindow('notes'); showNote('skills'); });
  });

  document.querySelectorAll('.note[data-note="experience"] .job').forEach(job => {
    const role = job.querySelector('h3')?.textContent?.replace(/\s+/g, ' ').trim();
    const when = job.querySelector('.job-when')?.textContent?.trim();
    if (role) add('Work', role, when || '', () => { openWindow('notes'); showNote('experience'); });
  });

  add('Action', 'Send a message', 'Opens Mail', () => openWindow('mail'));
  add('Action', 'Download résumé', 'Rakesh_CV.pdf', () => { window.location.href = 'Rakesh_CV.pdf'; });
  add('Link', 'GitHub', 'github.com/rakeshsurampalli', () => window.open('https://github.com/rakeshsurampalli', '_blank', 'noopener'));
  add('Link', 'LinkedIn', 'linkedin.com/in/rakeshsurampalli27', () => window.open('https://www.linkedin.com/in/rakeshsurampalli27/', '_blank', 'noopener'));
  add('Action', 'Email directly', 'rakeshsurampalli@gmail.com', () => window.open('mailto:rakeshsurampalli@gmail.com', '_blank', 'noopener'));

  return items;
}

/** Subsequence match with a bonus for prefix and word-start hits. */
const deburr = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function fuzzyScore(needle, hay) {
  // Deburr both sides so "resume" finds "résumé".
  const n = deburr(needle), h = deburr(hay);
  if (!n) return 0;
  const idx = h.indexOf(n);
  if (idx === 0) return 1000;
  if (idx > 0) return 700 - idx;
  let score = 0, hi = 0, streak = 0;
  for (const ch of n) {
    const found = h.indexOf(ch, hi);
    if (found === -1) return -1;
    streak = found === hi ? streak + 1 : 0;
    score += 12 + streak * 6 - Math.min(found - hi, 12);
    hi = found + 1;
  }
  return score;
}

function initSpotlight() {
  const root = document.getElementById('spotlight');
  const input = document.getElementById('sl-input');
  const list = document.getElementById('sl-results');
  if (!root || !input || !list) return;

  let index = [];
  let matches = [];
  let active = 0;

  function open() {
    if (!index.length) index = buildSpotlightIndex();
    root.hidden = false;
    input.value = '';
    render('');
    input.focus();
  }
  function close() {
    root.hidden = true;
    list.textContent = '';
  }

  function render(q) {
    matches = (q.trim()
      ? index.map(it => ({ it, s: Math.max(fuzzyScore(q, it.title), fuzzyScore(q, it.sub) - 220) }))
             .filter(m => m.s > 0)
             .sort((a, b) => b.s - a.s)
             .slice(0, 9)
             .map(m => m.it)
      : index.filter(it => it.kind === 'App').slice(0, 6));
    active = 0;
    list.textContent = '';

    if (!matches.length) {
      const li = document.createElement('li');
      li.className = 'sl-empty';
      li.textContent = 'No results for “' + q + '”';
      list.appendChild(li);
      return;
    }

    matches.forEach((m, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      const kind = document.createElement('span');
      kind.className = 'sl-kind';
      kind.textContent = m.kind.slice(0, 4);
      const txt = document.createElement('span');
      txt.className = 'sl-txt';
      const b = document.createElement('b'); b.textContent = m.title;
      const em = document.createElement('em'); em.textContent = m.sub;
      txt.append(b, em);
      li.append(kind, txt);
      li.addEventListener('click', () => { m.run(); close(); });
      li.addEventListener('pointerenter', () => setActive(i));
      list.appendChild(li);
    });
  }

  function setActive(i) {
    if (!matches.length) return;
    active = (i + matches.length) % matches.length;
    [...list.children].forEach((li, n) => li.setAttribute('aria-selected', String(n === active)));
    list.children[active]?.scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); matches[active]?.run(); close(); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });
  root.addEventListener('click', (e) => { if (e.target === root) close(); });

  document.getElementById('mb-search')?.addEventListener('click', (e) => { e.stopPropagation(); open(); });
  document.getElementById('pop-spotlight')?.addEventListener('click', open);

  spotlightOpen = open;
  spotlightClose = close;
  spotlightIsOpen = () => !root.hidden;
}

let spotlightOpen = () => {};
let spotlightClose = () => {};
let spotlightIsOpen = () => false;

/* ------------------------------------------------------------
   Boot screen
   ------------------------------------------------------------ */
const BOOT_HOLD = 2450;   // write (260 + 1750) then a short beat before dismissing

function initBoot(onDone) {
  const boot = document.getElementById('boot');
  if (!boot) { onDone(); return; }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    boot.classList.add('is-done');
    document.removeEventListener('keydown', onKey, true);
    // Leave it in the DOM until the fade completes, then take it out of the
    // layer tree entirely so its gradients stop compositing.
    setTimeout(() => { boot.style.display = 'none'; onDone(); }, 640);
  };

  // Capture phase + stopPropagation so the key that dismisses the boot screen
  // does not also fire the desktop shortcuts underneath it.
  const onKey = (e) => { e.stopPropagation(); finish(); };

  boot.addEventListener('click', finish);
  document.addEventListener('keydown', onKey, true);

  setTimeout(finish, reduceMotion() ? 900 : BOOT_HOLD);
}

/* ------------------------------------------------------------
   Init
   ------------------------------------------------------------ */
function init() {
  initWindows();
  initNotes();
  initClock();
  initTerminal();
  initDock();
  initMenus();
  initSafari();
  initPhotos();
  initMail();
  initSpotlight();
  initKeys();

  initBoot(() => {
    // Opening move: focus the terminal prompt on a real desktop, but don't
    // summon the keyboard on touch devices.
    if (!isCompact() && !matchMedia('(pointer: coarse)').matches) {
      document.getElementById('term-in')?.focus();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

'use strict';
/* js/state.js */
const OS = {
  bootComplete:      false,
  loggedIn:          false,
  openWindows:       new Map(),
  zTop:              200,
  activeWindow:      null,
  screensaverTimer:  null,
  screensaverActive: false,
  idleTimeout:       120000,
  altTabOpen:        false,
  altTabIndex:       0,
  calOpen:           false,
  calMonth:          new Date().getMonth(),
  calYear:           new Date().getFullYear(),
  viewport:          { w: window.innerWidth, h: window.innerHeight },
  compact:           window.innerWidth <= 1180,
  narrow:            window.innerWidth <= 860,
};

const SNAP = {
  active:       false,
  zone:         null,
  ghostEl:      null,
  zoneEls:      {},
};

const WIN_GEOMETRY = {
  about:      { wFrac:0.50, hFrac:0.62, minW:460, minH:380, maxW:860,  maxH:680 },
  experience: { wFrac:0.56, hFrac:0.68, minW:480, minH:420, maxW:920,  maxH:720 },
  projects:   { wFrac:0.56, hFrac:0.66, minW:460, minH:420, maxW:940,  maxH:720 },
  services:   { wFrac:0.54, hFrac:0.62, minW:460, minH:400, maxW:900,  maxH:680 },
  contact:    { wFrac:0.46, hFrac:0.70, minW:420, minH:480, maxW:720,  maxH:760 },
  resume:     { wFrac:0.38, hFrac:0.56, minW:380, minH:380, maxW:600,  maxH:640 },
  theme:      { wFrac:0.48, hFrac:0.60, minW:440, minH:420, maxW:780,  maxH:660 },
  terminal:   { wFrac:0.48, hFrac:0.52, minW:420, minH:340, maxW:800,  maxH:620 },
  calculator: { wFrac:0.21, hFrac:0.52, minW:280, minH:400, maxW:340,  maxH:500 },
  notepad:    { wFrac:0.40, hFrac:0.48, minW:380, minH:320, maxW:680,  maxH:560 },
  sysinfo:    { wFrac:0.44, hFrac:0.52, minW:420, minH:380, maxW:700,  maxH:580 },
  music:      { wFrac:0.21, hFrac:0.001,minW:280, minH:10,  maxW:320,  maxH:10  },

};

const TASKBAR_ICONS = {
  about:      'icons/075.ico',
  photos:     'icons/094.ico',
  experience: 'icons/030.ico',
  projects:   'icons/053.ico',
  services:   'icons/349.ico',
  contact:    'icons/093.ico',
  terminal:   'icons/285.ico',
  music:      'icons/049.ico',
  sysinfo:    'icons/vista_white.ico',
  resume:     'icons/vista_book_1.ico',
  theme:      'icons/windowsxpicon.ico',
  notepad:    'icons/notepad.ico',
  calculator: 'icons/windowsxpicon.ico',
};

const WINDOW_ICONS = {
  about:      '►',
  experience: '▣',
  projects:   '▤',
  services:   '◈',
  contact:    '✆',
  resume:     '▦',
  terminal:   '▶',
  music:      '♪',
  calculator: '±',
  notepad:    '▤',
  sysinfo:    '▣',
  theme:      '◉',
  photos:     '▨',
};

const SNAP_EDGE_PX        = 24;
const SNAP_CORNER_PX      = 80;
const SNAP_DRAG_THRESHOLD = 12;
const SNAP_PROXIMITY_PX   = 16;

const RESIZE_CONFIG = {
  edgeHit:         10,
  cornerHit:       16,
  edgeOverhang:     4,
  minDragToCommit:  2,
};

const BOOT_STEPS = [
  'Loading Glen\'s workspace...',
  'Starting Luna Aero OS · 2026 Edition...',
  'Mounting portfolio environment...',
  'Loading project records...',
  'Initializing window manager...',
  'Starting Aero Snap engine...',
  'Loading audio subsystem...',
  'Resolving viewport geometry...',
  'All systems ready.',
];

const sceneFrames = new Map();
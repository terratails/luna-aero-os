#!/usr/bin/env node
'use strict';
/* ================================================================
   generate-picturelist.js  —  Luna Aero OS Photo Viewer
   ================================================================
   WHAT IT DOES
   ─────────────
   Scans ./pictures/ and writes TWO output files so the Photo
   Viewer works everywhere — Vercel, Netlify, nginx, local dev
   server, and even plain file:// (no CORS, no fetch, no server).

     pictures/picturelist.json  → fetched by main.js over HTTP
     pictures/picturelist.js    → window.__PICTURELIST__ via <script>
                                   (works when fetch() is blocked)

   VERCEL USAGE
   ─────────────
   Add to vercel.json:
     { "buildCommand": "node generate-picturelist.js" }

   Or package.json:
     "prebuild": "node generate-picturelist.js"
     "predev":   "node generate-picturelist.js"

   LOCAL DEV
   ──────────
     node generate-picturelist.js           # one-shot
     node generate-picturelist.js --watch   # hot-reload on change
     node generate-picturelist.js --verbose # extra logging
     node generate-picturelist.js --dry-run # no file writes

   SUPPORTED FORMATS
   ──────────────────
     .jpg  .jpeg  .png   (only these — by design)

   NAMING CONVENTION  (auto-parsed for caption)
   ──────────────────
     My Vacation Photo.jpg  → caption "My Vacation Photo"
     01 Sunset.png          → leading number stripped → "Sunset"
     IMG_4821.jpg           → kept as-is → "IMG_4821"
================================================================ */

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

/* ── Config ──────────────────────────────────────────────────── */
const FOLDER    = path.resolve(__dirname, 'pictures');
const OUT_JSON  = path.join(FOLDER, 'picturelist.json');
const OUT_JS    = path.join(FOLDER, 'picturelist.js');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png']);
const WATCH_MODE = process.argv.includes('--watch');
const VERBOSE    = process.argv.includes('--verbose');
const DRY_RUN    = process.argv.includes('--dry-run');

/* ── ANSI colours ────────────────────────────────────────────── */
const C = {
  reset:  '\x1b[0m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
};

function log(icon, msg, colour = C.reset) {
  console.log(`${colour}${icon}  ${msg}${C.reset}`);
}
function verbose(msg) { if (VERBOSE) console.log(`${C.dim}   › ${msg}${C.reset}`); }
function warn(msg)    { console.warn(`${C.yellow}⚠  ${msg}${C.reset}`); }
function fatal(msg)   { console.error(`${C.red}✖  ${msg}${C.reset}`); process.exit(1); }
function hr()         { console.log(`${C.dim}${'─'.repeat(60)}${C.reset}`); }

/* ── File helpers ────────────────────────────────────────────── */
function fileHash(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(data).digest('hex').slice(0, 8);
  } catch (_) { return 'unknown'; }
}

function fileSizeKB(filePath) {
  try { return +(fs.statSync(filePath).size / 1024).toFixed(1); }
  catch (_) { return null; }
}

function fileSizeBytes(filePath) {
  try { return fs.statSync(filePath).size; }
  catch (_) { return null; }
}

function mimeFromExt(ext) {
  return ext === '.png' ? 'image/png' : 'image/jpeg';
}

/* ── Caption parser ──────────────────────────────────────────── */
function parseCaption(filename) {
  const ext  = path.extname(filename);
  let   base = path.basename(filename, ext).trim();
  // Strip leading track/sequence number: "01 ", "01. ", "01 - "
  base = base.replace(/^\d{1,4}[\s.\-_]+/, '').trim();
  // Replace underscores/hyphens with spaces for readability
  base = base.replace(/[_\-]+/g, ' ').trim();
  return base || path.basename(filename, ext);
}

/* ── Scan folder ─────────────────────────────────────────────── */
function scanFolder() {
  if (!fs.existsSync(FOLDER)) {
    fatal(
      `No '${path.relative(process.cwd(), FOLDER)}/' folder found.\n` +
      `   Create it and drop your JPG/PNG files inside, then re-run.`
    );
  }

  const entries = fs.readdirSync(FOLDER, { withFileTypes: true });
  const files   = entries
    .filter(e => e.isFile() && IMAGE_EXTS.has(path.extname(e.name).toLowerCase()))
    .map(e => e.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  verbose(`Found ${files.length} image file(s) in ${FOLDER}`);
  return files;
}

/* ── Build manifest ──────────────────────────────────────────── */
function buildManifest(files) {
  return files.map((filename, index) => {
    const filePath = path.join(FOLDER, filename);
    const ext      = path.extname(filename).toLowerCase();
    const hash     = fileHash(filePath);
    const caption  = parseCaption(filename);

    verbose(`[${String(index + 1).padStart(3)}] ${caption}  (${fileSizeKB(filePath)} KB)`);

    return {
      id:         `pic_${hash}_${index}`,
      file:       filename,
      caption,
      mimeType:   mimeFromExt(ext),
      sizeBytes:  fileSizeBytes(filePath),
      sizeKB:     fileSizeKB(filePath),
      hash,
      sortIndex:  index,
    };
  });
}

/* ── Write outputs ───────────────────────────────────────────── */
const HEADER = `/* ================================================================
   AUTO-GENERATED by generate-picturelist.js
   DO NOT EDIT BY HAND — your changes will be overwritten.
   Re-generate with:  node generate-picturelist.js
   Generated:         ${new Date().toISOString()}
================================================================ */`;

function writeJSON(pictures) {
  if (DRY_RUN) { verbose('DRY RUN: skipping picturelist.json write'); return; }
  fs.writeFileSync(OUT_JSON, JSON.stringify(pictures, null, 2) + '\n', 'utf8');
  log('📄', `Wrote ${path.relative(process.cwd(), OUT_JSON)}  (${pictures.length} images)`, C.cyan);
}

function writeJS(pictures) {
  if (DRY_RUN) { verbose('DRY RUN: skipping picturelist.js write'); return; }

  const payload = JSON.stringify(pictures, null, 2);
  const content = [
    HEADER,
    '',
    '/* Loaded via <script src="pictures/picturelist.js"> in index.html.',
    '   Works under file://, vercel, netlify, nginx, etc.',
    '   main.js checks window.__PICTURELIST__ before attempting fetch(). */',
    '',
    `window.__PICTURELIST__ = ${payload};`,
    '',
    '/* Signal that the script-tag manifest is ready */',
    'window.__PICTURELIST_READY__ = true;',
    '',
  ].join('\n');

  fs.writeFileSync(OUT_JS, content, 'utf8');
  log('📄', `Wrote ${path.relative(process.cwd(), OUT_JS)}  (window.__PICTURELIST__)`, C.cyan);
}

/* ── Main ────────────────────────────────────────────────────── */
function run() {
  hr();
  log('🖼️', `Luna Aero OS · Picturelist Generator`, C.bold + C.cyan);
  log('📂', `Scanning: ${path.relative(process.cwd(), FOLDER) || './pictures'}`, C.dim);
  hr();

  const files = scanFolder();

  if (files.length === 0) {
    warn(`No image files found in pictures/`);
    warn(`Supported: ${[...IMAGE_EXTS].join('  ')}`);
    warn(`Writing empty manifests so the viewer doesn't crash on deploy.`);
  }

  const pictures = buildManifest(files);

  writeJSON(pictures);
  writeJS(pictures);

  hr();
  if (files.length > 0) {
    log('✅', `Done! ${pictures.length} image(s) ready for Vercel deploy.`, C.green);
    pictures.forEach((p, i) => {
      const num  = String(i + 1).padStart(3, ' ');
      const size = p.sizeKB != null ? `${p.sizeKB} KB` : '?';
      console.log(
        `${C.dim}   ${num}.${C.reset} ${C.bold}${p.caption}${C.reset}` +
        `  ${C.dim}(${size}, ${p.mimeType}, ${p.file})${C.reset}`
      );
    });
  } else {
    log('⚠ ', `No images found — add jpg/jpeg/png files to pictures/ and re-run.`, C.yellow);
  }
  hr();
}

run();

/* ── Watch mode ─────────────────────────────────────────────── */
if (WATCH_MODE) {
  log('👀', `Watching pictures/ for changes… (Ctrl+C to stop)`, C.cyan);
  let debounceTimer = null;

  fs.watch(FOLDER, { persistent: true }, (event, filename) => {
    if (!filename) return;
    const ext = path.extname(filename).toLowerCase();
    // Ignore changes to the generated files themselves
    if (filename === 'picturelist.json' || filename === 'picturelist.js') return;
    if (!IMAGE_EXTS.has(ext)) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log();
      log('🔄', `Change detected: ${filename}`, C.yellow);
      run();
    }, 300);
  });
}

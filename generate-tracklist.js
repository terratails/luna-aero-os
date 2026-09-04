'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_FOLDER = path.resolve(__dirname, 'musics');
const OUT_JSON = path.join(ROOT_FOLDER, 'tracklist.json');
const OUT_JS = path.join(ROOT_FOLDER, 'tracklist.js');
const OUT_META = path.join(ROOT_FOLDER, 'tracklist.meta.json');

const AUDIO_EXTS = new Set(['.mp3', '.ogg', '.wav', '.flac', '.m4a', '.aac', '.opus', '.weba']);
const WATCH_MODE = process.argv.includes('--watch');
const VERBOSE = process.argv.includes('--verbose');
const DRY_RUN = process.argv.includes('--dry-run');

const LIBRARY_ID = 'library';
const LIBRARY_LABEL = 'Library';
const MAX_SCAN_DEPTH = 1;

const AERO_PALETTES = [
  { accent: '#3ec9ee', glow: 'rgba(62,201,238,0.5)', name: 'aqua' },
  { accent: '#22ddb0', glow: 'rgba(34,221,176,0.5)', name: 'aurora' },
  { accent: '#a060f0', glow: 'rgba(160,96,240,0.5)', name: 'violet' },
  { accent: '#f09030', glow: 'rgba(240,144,48,0.5)', name: 'sunset' },
  { accent: '#f060a0', glow: 'rgba(240,96,160,0.5)', name: 'rose' },
  { accent: '#6888c8', glow: 'rgba(104,136,200,0.5)', name: 'steel' },
  { accent: '#42d68a', glow: 'rgba(66,214,138,0.5)', name: 'green' },
  { accent: '#f5c842', glow: 'rgba(245,200,66,0.5)', name: 'gold' },
];

const C = {
  reset: '\x1b[0m', cyan: '\x1b[36m', green: '\x1b[32m',
  yellow: '\x1b[33m', red: '\x1b[31m', dim: '\x1b[2m', bold: '\x1b[1m',
};

function log(tag, msg, colour = C.reset) {
  console.log(`${colour}${tag}  ${msg}${C.reset}`);
}
function verbose(msg) {
  if (VERBOSE) console.log(`${C.dim}   > ${msg}${C.reset}`);
}
function warn(msg) { console.warn(`${C.yellow}WARN  ${msg}${C.reset}`); }
function fatal(msg) { console.error(`${C.red}FATAL  ${msg}${C.reset}`); process.exit(1); }
function hr() { console.log(`${C.dim}${'-'.repeat(60)}${C.reset}`); }

function fileHash(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(data).digest('hex').slice(0, 8);
  } catch (_) {
    return 'unknown';
  }
}

function fileSizeMB(filePath) {
  try { return +(fs.statSync(filePath).size / 1024 / 1024).toFixed(2); }
  catch (_) { return null; }
}

function fileSizeBytes(filePath) {
  try { return fs.statSync(filePath).size; }
  catch (_) { return null; }
}

function mimeFromExt(ext) {
  const map = {
    '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
    '.flac': 'audio/flac', '.m4a': 'audio/mp4', '.aac': 'audio/aac',
    '.opus': 'audio/opus', '.weba': 'audio/webm',
  };
  return map[ext] || 'audio/mpeg';
}

function slugify(name) {
  return String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category';
}

function titleCase(name) {
  return String(name).replace(/[-_]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
}

function parseFilename(filename) {
  const ext = path.extname(filename);
  let base = path.basename(filename, ext).trim();
  base = base.replace(/^\d{1,3}[\s.\-]+/, '').trim();
  const parts = base.split(/\s*[-–—]\s*/).map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return { artist: 'Unknown Artist', album: null, title: filename };
  if (parts.length === 1) return { artist: 'Unknown Artist', album: null, title: parts[0] };
  if (parts.length === 2) return { artist: parts[0], album: null, title: parts[1] };
  return { artist: parts[0], album: parts[1], title: parts.slice(2).join(' - ') };
}

function listAudioFiles(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true })
    .filter(e => e.isFile() && AUDIO_EXTS.has(path.extname(e.name).toLowerCase()))
    .map(e => e.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function listSubdirectories(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function discoverCategoryFolders(root, depth) {
  const found = [];
  function walk(currentFolder, relFolder, currentDepth) {
    const dirs = listSubdirectories(currentFolder);
    dirs.forEach(dirName => {
      const absPath = path.join(currentFolder, dirName);
      const relPath = relFolder ? `${relFolder}/${dirName}` : dirName;
      found.push({ absPath, relPath, depth: currentDepth });
      if (currentDepth < depth) walk(absPath, relPath, currentDepth + 1);
    });
  }
  walk(root, '', 1);
  return found;
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function buildTrack(filename, absFolder, relFolder, categoryId, index) {
  const { artist, album, title } = parseFilename(filename);
  const filePath = path.join(absFolder, filename);
  const relPath = relFolder ? `${relFolder}/${filename}` : filename;
  const hash = fileHash(filePath);
  const palette = AERO_PALETTES[(index + hashSeed(categoryId)) % AERO_PALETTES.length];
  return {
    id: `${categoryId}_${hash}_${index}`,
    file: filename,
    relPath,
    title,
    artist,
    album: album || null,
    duration: '--:--',
    palette: { accent: palette.accent, glow: palette.glow, name: palette.name },
    hash,
    sizeBytes: fileSizeBytes(filePath),
    sizeMB: fileSizeMB(filePath),
    mimeType: mimeFromExt(path.extname(filename).toLowerCase()),
    sortIndex: index,
  };
}

function buildCategories() {
  if (!fs.existsSync(ROOT_FOLDER)) {
    fatal(
      `No '${path.relative(process.cwd(), ROOT_FOLDER)}/' folder found.\n` +
      `   Create it and drop your audio files or subfolders inside, then re-run.`
    );
  }

  const categories = [];

  const libraryFiles = listAudioFiles(ROOT_FOLDER);
  if (libraryFiles.length) {
    categories.push({
      id: LIBRARY_ID,
      label: LIBRARY_LABEL,
      folder: 'musics',
      tracks: libraryFiles.map((f, i) => buildTrack(f, ROOT_FOLDER, '', LIBRARY_ID, i)),
    });
  }

  const subfolders = discoverCategoryFolders(ROOT_FOLDER, MAX_SCAN_DEPTH);
  subfolders.forEach(sub => {
    const files = listAudioFiles(sub.absPath);
    if (!files.length) return;
    const id = slugify(sub.relPath);
    const label = titleCase(sub.relPath.split('/').pop());
    categories.push({
      id,
      label,
      folder: `musics/${sub.relPath}`,
      tracks: files.map((f, i) => buildTrack(f, sub.absPath, sub.relPath, id, i)),
    });
  });

  return categories;
}

function reportDuplicates(categories) {
  const seen = new Map();
  categories.forEach(cat => {
    cat.tracks.forEach(t => {
      const key = `${t.artist.toLowerCase()}::${t.title.toLowerCase()}`;
      seen.set(key, (seen.get(key) || 0) + 1);
    });
  });
  seen.forEach((count, key) => {
    if (count > 1) warn(`Possible duplicate: "${key.replace('::', ' - ')}" appears ${count} times`);
  });
}

function writeJSON(categories) {
  if (DRY_RUN) { verbose('dry run: skipping tracklist.json write'); return; }
  const payload = { version: 2, categories };
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  log('FILE', `Wrote ${path.relative(process.cwd(), OUT_JSON)}  (${categories.length} categories)`, C.cyan);
}

function writeJS(categories) {
  if (DRY_RUN) { verbose('dry run: skipping tracklist.js write'); return; }
  const payload = JSON.stringify({ version: 2, categories }, null, 2);
  const content = [
    `window.__TRACKLIST__ = ${payload};`,
    'window.__TRACKLIST_READY__ = true;',
    '',
  ].join('\n');
  fs.writeFileSync(OUT_JS, content, 'utf8');
  log('FILE', `Wrote ${path.relative(process.cwd(), OUT_JS)}`, C.cyan);
}

function writeMeta(categories) {
  if (DRY_RUN) { verbose('dry run: skipping tracklist.meta.json write'); return; }
  const meta = {
    generated: new Date().toISOString(),
    generatedBy: 'generate-tracklist.js',
    totalCategories: categories.length,
    totalTracks: categories.reduce((n, c) => n + c.tracks.length, 0),
    totalSizeMB: +(categories.reduce((sum, c) => sum + c.tracks.reduce((s, t) => s + (t.sizeMB || 0), 0), 0)).toFixed(2),
    palettes: AERO_PALETTES,
    categories: categories.map(c => ({
      id: c.id,
      label: c.label,
      folder: c.folder,
      trackCount: c.tracks.length,
      tracks: c.tracks.map(t => ({ id: t.id, file: t.file, relPath: t.relPath, hash: t.hash, sizeMB: t.sizeMB })),
    })),
  };
  fs.writeFileSync(OUT_META, JSON.stringify(meta, null, 2) + '\n', 'utf8');
  log('FILE', `Wrote ${path.relative(process.cwd(), OUT_META)}`, C.dim);
}

function run() {
  hr();
  log('MUSIC', 'Luna Aero OS - Tracklist Generator', C.bold + C.cyan);
  log('SCAN', `Root: ${path.relative(process.cwd(), ROOT_FOLDER) || './musics'}`, C.dim);
  hr();

  const categories = buildCategories();
  reportDuplicates(categories);

  const totalTracks = categories.reduce((n, c) => n + c.tracks.length, 0);

  if (totalTracks === 0) {
    warn('No audio files found in musics/ or its subfolders');
    warn(`Supported: ${[...AUDIO_EXTS].join('  ')}`);
    warn('Writing empty manifests so the player does not crash on deploy.');
  }

  writeJSON(categories);
  writeJS(categories);
  writeMeta(categories);

  hr();
  if (totalTracks > 0) {
    log('DONE', `${totalTracks} track(s) across ${categories.length} playlist(s) ready for deploy.`, C.green);
    categories.forEach(cat => {
      console.log(`${C.bold}${cat.label}${C.reset} ${C.dim}(${cat.folder})${C.reset}`);
      cat.tracks.forEach((t, i) => {
        const num = String(i + 1).padStart(3, ' ');
        const size = t.sizeMB != null ? `${t.sizeMB} MB` : '?';
        console.log(`${C.dim}   ${num}.${C.reset} ${t.artist} ${C.dim}-${C.reset} ${t.title} ${C.dim}(${size}, ${t.file})${C.reset}`);
      });
    });
  } else {
    log('EMPTY', 'No tracks found. Add audio files to musics/, musics/chill/, or musics/favorites/ and re-run.', C.yellow);
  }
  hr();
}

function setupWatch() {
  let debounceTimer = null;
  let watchers = [];

  function teardown() {
    watchers.forEach(w => { try { w.close(); } catch (_) {} });
    watchers = [];
  }

  function handleChange(filename) {
    if (!filename) return;
    if (['tracklist.json', 'tracklist.js', 'tracklist.meta.json'].includes(path.basename(filename))) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log();
      log('WATCH', `Change detected: ${filename}`, C.yellow);
      teardown();
      run();
      attach();
    }, 300);
  }

  function attach() {
    const folders = [ROOT_FOLDER, ...discoverCategoryFolders(ROOT_FOLDER, MAX_SCAN_DEPTH).map(s => s.absPath)];
    folders.forEach(folder => {
      try {
        watchers.push(fs.watch(folder, { persistent: true }, (event, filename) => handleChange(filename)));
      } catch (_) {}
    });
  }

  attach();
}

run();

if (WATCH_MODE) {
  log('WATCH', 'Watching musics/ and its subfolders for changes... (Ctrl+C to stop)', C.cyan);
  setupWatch();
}
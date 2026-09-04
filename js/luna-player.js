'use strict';
/* js/luna-player.js */
const MP = {
  audioCtx: null, analyser: null, gainNode: null,
  eqNodes: [], source: null, audio: null,
  categories: [], activeCategoryId: 'all',
  playlist: [], currentIdx: -1,
  shuffle: false, repeat: 'none', muted: false, volume: 1.0,
  volDialAngle: 225, visualMode: 'bars',
  seeking: false, connected: false, animFrame: null,
  eqPresets: {
    flat: [0,0,0,0,0,0,0,0,0],
    bass: [6,5,4,2,0,-1,-1,-2,-2],
    rock: [4,3,0,0,-1,0,2,3,3],
    pop: [-1,0,2,3,3,2,0,-1,-1],
    jazz: [0,0,0,2,3,3,2,1,0],
  },
  eqFreqs: [60,170,310,600,1000,3000,6000,14000,16000],
};

const LIBRARY_ID    = 'library';
const LIBRARY_LABEL = 'Library';
const AUDIO_EXT_RE  = /\.(mp3|ogg|wav|flac|m4a|aac|opus|weba)$/i;

function initMusicPlayer() {
  MP.audio = new Audio();
  MP.audio.crossOrigin = 'anonymous';
  MP.audio.volume      = MP.volume;
  MP.audio.addEventListener('timeupdate',     updateSeekBar);
  MP.audio.addEventListener('ended',          onTrackEnd);
  MP.audio.addEventListener('loadedmetadata', onMetadataLoaded);
  MP.audio.addEventListener('canplay',        () => updateStatusLight('stopped'));
  MP.audio.addEventListener('error',          () => showToast('Playback Error', 'Could not play this file.', 'img:icons/256.ico'));

  document.getElementById('xp-play-btn')?.       addEventListener('click', togglePlay);
  document.getElementById('xp-stop-btn')?.        addEventListener('click', stopPlayback);
  document.getElementById('xp-prev')?.            addEventListener('click', prevTrack);
  document.getElementById('xp-next')?.            addEventListener('click', nextTrack);
  document.getElementById('xp-shuffle')?.         addEventListener('click', toggleShuffle);
  document.getElementById('xp-repeat')?.          addEventListener('click', toggleRepeat);
  document.getElementById('xp-mute')?.            addEventListener('click', toggleMute);
  document.getElementById('xp-open-btn')?.        addEventListener('click', () => document.getElementById('xp-file-input')?.click());
  document.getElementById('xp-playlist-toggle')?.addEventListener('click', togglePlaylist);
  document.getElementById('xp-eq-btn')?.          addEventListener('click', toggleEQ);
  document.getElementById('xp-vis-toggle')?.      addEventListener('click', cycleVisualizer);

  document.getElementById('xp-file-input')?.addEventListener('change', e => {
    const files = [...e.target.files].filter(f => f.type.startsWith('audio/'));
    if (files.length) addFilesToPlaylist(files);
    e.target.value = '';
  });

  document.getElementById('xp-pl-add-btn')?.addEventListener('click',  () => document.getElementById('xp-file-input')?.click());
  document.getElementById('xp-pl-clear-btn')?.addEventListener('click', clearPlaylist);

  document.querySelectorAll('.xp-eq-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      applyEQPreset(btn.dataset.preset);
      document.querySelectorAll('.xp-eq-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
function formatTime(s) {
  if (!isFinite(s)) return '--:--';
  return Math.floor(s / 60).toString().padStart(2, '0') + ':' + Math.floor(s % 60).toString().padStart(2, '0');
}

function drawVolumeDial(angleDeg) {
  const canvas = document.getElementById('xp-volume-dial');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 24, cy = 24, r = 18;
  ctx.clearRect(0, 0, 48, 48);
  const grd = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, r);
  grd.addColorStop(0, '#1a60d0'); grd.addColorStop(0.5, '#0a40a0'); grd.addColorStop(1, '#061c5e');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
  ctx.strokeStyle = 'rgba(140,200,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  const shine = ctx.createRadialGradient(cx - 7, cy - 7, 1, cx - 4, cy - 4, r * 0.7);
  shine.addColorStop(0, 'rgba(255,255,255,0.5)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = shine; ctx.fill();
  const startRad = 225 * Math.PI / 180;
  const angleRad = angleDeg * Math.PI / 180;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, startRad, angleRad, angleDeg < 225);
  ctx.strokeStyle = `hsl(${140 + (1 - MP.volume) * (-140)},80%,55%)`;
  ctx.lineWidth = 3; ctx.stroke();
  const px = cx + Math.cos(angleRad) * (r - 6);
  const py = cy + Math.sin(angleRad) * (r - 6);
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(angleRad) * 4, cy + Math.sin(angleRad) * 4);
  ctx.lineTo(px, py);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220,240,255,0.9)'; ctx.fill();
}
  document.addEventListener('keydown', e => {
    if (OS.activeWindow !== 'music') return;
    const map = {
      ' ':togglePlay, 'ArrowRight':nextTrack, 'ArrowLeft':prevTrack,
      'm':toggleMute, 'M':toggleMute, 's':toggleShuffle, 'S':toggleShuffle,
      'r':toggleRepeat, 'R':toggleRepeat,
    };
    if (map[e.key]) { e.preventDefault(); map[e.key](); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); adjustVolume(0.05); }
    if (e.key === 'ArrowDown') { e.preventDefault(); adjustVolume(-0.05); }
  });

  initSeekBar();
  initVolumeSlider();
  initEQ();
  initDropZone();
  loadMusicFolder();
  startVisualizer();
  updateStatusLight('stopped');
}

function ensureAudioContext() {
  if (MP.connected) return;
  try {
    MP.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    MP.analyser = MP.audioCtx.createAnalyser();
    MP.analyser.fftSize = 2048;
    MP.analyser.smoothingTimeConstant = 0.82;
    MP.gainNode = MP.audioCtx.createGain();
    MP.gainNode.gain.value = MP.volume;

    MP.eqNodes = MP.eqFreqs.map((freq, i) => {
      const filter = MP.audioCtx.createBiquadFilter();
      filter.type  = i === 0 ? 'lowshelf' : i === MP.eqFreqs.length - 1 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.gain.value      = 0;
      filter.Q.value         = 1;
      return filter;
    });

    const source = MP.audioCtx.createMediaElementSource(MP.audio);
    let   node   = source;
    MP.eqNodes.forEach(eq => { node.connect(eq); node = eq; });
    node.connect(MP.gainNode);
    MP.gainNode.connect(MP.analyser);
    MP.analyser.connect(MP.audioCtx.destination);
    MP.connected = true;

    document.querySelectorAll('.xp-eq-slider').forEach((slider, i) => {
      slider.addEventListener('input', () => { if (MP.eqNodes[i]) MP.eqNodes[i].gain.value = +slider.value; });
    });
  } catch(err) { console.warn('AudioContext setup failed:', err); }
}

function addFilesToPlaylist(files) {
  const categoryId = 'local';
  let localCategory = MP.categories.find(c => c.id === categoryId);
  if (!localCategory) {
    localCategory = { id: categoryId, label: 'Local Files', tracks: [] };
    MP.categories.push(localCategory);
  }
  const startIndex = localCategory.tracks.length;
  files.forEach((file, i) => {
    const url   = URL.createObjectURL(file);
    const base  = file.name.replace(/\.[^/.]+$/, '');
    const parts = base.split(' - ');
    const track = {
      id: `local_${Date.now()}_${startIndex + i}`,
      url,
      file: file.name,
      relPath: null,
      name:   parts.length > 1 ? parts.slice(1).join(' - ') : base,
      artist: parts.length > 1 ? parts[0] : 'Unknown Artist',
      album: null,
      duration: '--:--',
      palette: null,
      categoryId,
      sortIndex: startIndex + i,
      isLocal: true,
    };
    const tempAudio = new Audio(url);
    tempAudio.addEventListener('loadedmetadata', () => { track.duration = formatTime(tempAudio.duration); renderPlaylist(); });
    localCategory.tracks.push(track);
  });
  if (MP.activeCategoryId === 'all' || MP.activeCategoryId === categoryId) {
    MP.playlist = computeCategoryTracks(MP.activeCategoryId);
  }
  renderCategoryTabs();
  renderPlaylist();
  if (MP.currentIdx === -1 && MP.playlist.length > 0) loadTrack(0);
  showToast('Media Player', `Added ${files.length} track${files.length > 1 ? 's' : ''} to ${localCategory.label}`, 'img:icons/049.ico');
}

function clearPlaylist() {
  stopPlayback();
  MP.categories.forEach(cat => cat.tracks.forEach(t => { if (t.url && t.url.startsWith('blob:')) URL.revokeObjectURL(t.url); }));
  MP.categories = [];
  MP.activeCategoryId = 'all';
  MP.playlist = [];
  MP.currentIdx = -1;
  renderCategoryTabs();
  renderPlaylist();
  updateScreenDisplay('No Track Loaded — Drop MP3 or Load File', '');
  updateStatusLight('stopped');
  updateTaskbarNowPlaying('', false);
  const tv = document.getElementById('xp-time-val');  if (tv) tv.textContent = '00:00';
  const to = document.getElementById('xp-total-val'); if (to) to.textContent = '00:00';
  const sf = document.getElementById('xp-seek-fill'); if (sf) sf.style.width = '0%';
  try { sessionStorage.setItem('luna-music-category', 'all'); } catch (_) {}
}

function renderPlaylist() {
  const list    = document.getElementById('xp-playlist-list');
  const countEl = document.getElementById('xp-pl-count');
  if (!list) return;
  if (countEl) countEl.textContent = `${MP.playlist.length} track${MP.playlist.length !== 1 ? 's' : ''}`;
  if (!MP.playlist.length) {
    list.innerHTML = '<div class="xp-pl-empty">No tracks in this playlist.<br>Click + Add Files or drag &amp; drop audio files here.</div>';
    return;
  }
  const showBadge = MP.activeCategoryId === 'all' && MP.categories.length > 1;
  list.innerHTML = '';
  MP.playlist.forEach((track, i) => {
    const item      = document.createElement('div');
    const isActive  = i === MP.currentIdx;
    const isPlaying = isActive && !MP.audio.paused;
    item.className  = 'xp-pl-item' + (isActive ? ' active' : '');
    const categoryLabel = showBadge ? (MP.categories.find(c => c.id === track.categoryId)?.label || '') : '';
    item.innerHTML  = `
      <span class="xp-pl-num">${isActive ? (isPlaying ? '▶' : '❚❚') : (i + 1)}</span>
      <span class="xp-pl-name" title="${escHtml(track.name)} — ${escHtml(track.artist)}">${escHtml(track.name)}</span>
      ${showBadge ? `<span class="xp-pl-badge">${escHtml(categoryLabel)}</span>` : ''}
      <span class="xp-pl-dur">${track.duration}</span>`;
    item.addEventListener('click', () => { loadTrack(i); startPlay(); });
    list.appendChild(item);
  });
}

function loadTrack(idx) {
  if (idx < 0 || idx >= MP.playlist.length) return;
  const track   = MP.playlist[idx];
  MP.currentIdx = idx;
  MP.audio.src  = track.url;
  MP.audio.load();
  updateScreenDisplay(track.name, track.artist);
  renderPlaylist();
  const tv = document.getElementById('xp-time-val');  if (tv) tv.textContent = '00:00';
  const to = document.getElementById('xp-total-val'); if (to) to.textContent = track.duration;
  const sf = document.getElementById('xp-seek-fill'); if (sf) sf.style.width = '0%';
}

function updateScreenDisplay(title, artist) {
  const scroll = document.getElementById('xp-title-scroll');
  if (scroll) scroll.textContent = artist ? `${title}  —  ${artist}  ·  ·  ·` : title;
}

function onMetadataLoaded() {
  const dur = MP.audio.duration;
  if (isFinite(dur)) {
    const to = document.getElementById('xp-total-val'); if (to) to.textContent = formatTime(dur);
    if (MP.currentIdx >= 0) MP.playlist[MP.currentIdx].duration = formatTime(dur);
    renderPlaylist();
  }
}

function startPlay() {
  ensureAudioContext();
  if (MP.audioCtx?.state === 'suspended') MP.audioCtx.resume();
  const p = MP.audio.play();
  if (p) p.catch(err => console.warn('Play failed:', err));
  const pb = document.getElementById('xp-play-btn'); if (pb) { const i = pb.querySelector('img'); if (i) i.src = 'icons/477.ico'; }
  updateStatusLight('playing');
  const track = MP.playlist[MP.currentIdx];
  if (track) updateTaskbarNowPlaying(track.name, true);
}

function pausePlay() {
  MP.audio.pause();
  const pb = document.getElementById('xp-play-btn'); if (pb) { const i = pb.querySelector('img'); if (i) i.src = 'icons/472.ico'; }
  updateStatusLight('paused');
  const track = MP.playlist[MP.currentIdx];
  if (track) updateTaskbarNowPlaying(track.name, false);
}

function togglePlay() {
  if (!MP.playlist.length) { document.getElementById('xp-file-input')?.click(); return; }
  if (MP.currentIdx === -1) { loadTrack(0); startPlay(); return; }
  if (MP.audio.paused) startPlay(); else pausePlay();
  renderPlaylist();
}

function stopPlayback() {
  MP.audio.pause(); MP.audio.currentTime = 0;
  const pb = document.getElementById('xp-play-btn'); if (pb) { const i = pb.querySelector('img'); if (i) i.src = 'icons/472.ico'; }
  const sf = document.getElementById('xp-seek-fill'); if (sf) sf.style.width = '0%';
  const tv = document.getElementById('xp-time-val');  if (tv) tv.textContent = '00:00';
  updateStatusLight('stopped');
  updateTaskbarNowPlaying('', false);
  renderPlaylist();
}

function nextTrack() {
  if (!MP.playlist.length) return;
  const next = MP.shuffle
    ? Math.floor(Math.random() * MP.playlist.length)
    : (MP.currentIdx + 1) % MP.playlist.length;
  loadTrack(next); startPlay();
}

function prevTrack() {
  if (!MP.playlist.length) return;
  if (MP.audio.currentTime > 3) { MP.audio.currentTime = 0; return; }
  const prev = MP.shuffle
    ? Math.floor(Math.random() * MP.playlist.length)
    : (MP.currentIdx - 1 + MP.playlist.length) % MP.playlist.length;
  loadTrack(prev); startPlay();
}

function onTrackEnd() {
  if (MP.repeat === 'one') { MP.audio.currentTime = 0; startPlay(); return; }
  if (MP.repeat === 'all' || MP.currentIdx < MP.playlist.length - 1) { nextTrack(); }
  else {
    updateStatusLight('stopped');
    updateTaskbarNowPlaying('', false);
    const pb = document.getElementById('xp-play-btn'); if (pb) { const i = pb.querySelector('img'); if (i) i.src = 'icons/472.ico'; }
  }
}

function toggleShuffle() {
  MP.shuffle = !MP.shuffle;
  document.getElementById('xp-shuffle')?.classList.toggle('active', MP.shuffle);
  showToast('Shuffle', MP.shuffle ? 'Shuffle ON' : 'Shuffle OFF', 'img:icons/288.ico');
}

function toggleRepeat() {
  const modes  = ['none','one','all'];
  MP.repeat    = modes[(modes.indexOf(MP.repeat) + 1) % 3];
  const icons  = { none:'↺', one:'↺¹', all:'↺∞' };
  const labels = { none:'Repeat OFF', one:'Repeat ONE', all:'Repeat ALL' };
  const btn    = document.getElementById('xp-repeat');
  if (btn) { btn.textContent = icons[MP.repeat]; btn.classList.toggle('active', MP.repeat !== 'none'); }
  showToast('Repeat', labels[MP.repeat], 'img:icons/288.ico');
}

function toggleMute() {
  MP.muted       = !MP.muted;
  MP.audio.muted = MP.muted;
  updateVolumeIcon();
}

function adjustVolume(delta) {
  MP.volume       = clamp(MP.volume + delta, 0, 1);
  MP.audio.volume = MP.volume;
  if (MP.gainNode) MP.gainNode.gain.value = MP.volume;
  const slider = document.getElementById('lp-vol-slider');
  if (slider) slider.value = Math.round(MP.volume * 100);
  updateVolumeIcon();
}

function initSeekBar() {
  const track = document.getElementById('xp-seek-track');
  if (!track) return;
  function seekTo(cx) {
    const rect  = track.getBoundingClientRect();
    const ratio = clamp((cx - rect.left) / rect.width, 0, 1);
    if (isFinite(MP.audio.duration)) MP.audio.currentTime = ratio * MP.audio.duration;
    updateSeekBarImmediate(ratio);
  }
  track.addEventListener('mousedown', e => { MP.seeking = true; seekTo(e.clientX); });
  document.addEventListener('mousemove', e => { if (MP.seeking) seekTo(e.clientX); });
  document.addEventListener('mouseup',   () => { MP.seeking = false; });
}

function updateSeekBar() {
  if (MP.seeking) return;
  const dur = MP.audio.duration, cur = MP.audio.currentTime;
  if (!isFinite(dur) || dur === 0) return;
  updateSeekBarImmediate(cur / dur);
  const tv = document.getElementById('xp-time-val'); if (tv) tv.textContent = formatTime(cur);
}

function updateSeekBarImmediate(ratio) {
  const fill = document.getElementById('xp-seek-fill');
  if (fill) fill.style.width = (ratio * 100) + '%';
}

function initVolumeSlider() {
  const slider = document.getElementById('lp-vol-slider');
  if (!slider) return;
  slider.value = Math.round(MP.volume * 100);
  slider.addEventListener('input', () => {
    const target = slider.value / 100;
    adjustVolume(target - MP.volume);
  });
}

function updateVolumeIcon() {
  const icon = document.getElementById('xp-vol-icon');
  if (!icon) return;
  icon.src = (MP.muted || MP.volume === 0) ? 'icons/274.ico' : 'icons/273.ico';
}

function initEQ() {
  document.querySelectorAll('.xp-eq-slider').forEach(slider => { slider.value = 0; });
}

function applyEQPreset(name) {
  const preset = MP.eqPresets[name];
  if (!preset) return;
  document.querySelectorAll('.xp-eq-slider').forEach((slider, i) => {
    slider.value = preset[i] || 0;
    if (MP.eqNodes[i]) MP.eqNodes[i].gain.value = preset[i] || 0;
  });
  const label = document.getElementById('w7p-eq-active-label');
  const presetNames = { flat:'Flat', bass:'Bass Boost', rock:'Rock', pop:'Pop', jazz:'Jazz' };
  if (label) label.textContent = presetNames[name] || name;
}

function togglePlaylist() {
  const panel = document.getElementById('xp-playlist-panel');
  const btn   = document.getElementById('xp-playlist-toggle');
  panel?.classList.toggle('hidden');
  btn?.classList.toggle('active', !panel?.classList.contains('hidden'));
}

function toggleEQ() {
  const panel = document.getElementById('xp-eq-panel');
  const btn   = document.getElementById('xp-eq-btn');
  panel?.classList.toggle('hidden');
  btn?.classList.toggle('active', !panel?.classList.contains('hidden'));
}

function cycleVisualizer() {
  const modes = ['bars', 'wave', 'circle'];
  MP.visualMode = modes[(modes.indexOf(MP.visualMode) + 1) % 3];
  const icons   = { bars:'📊', wave:'〰', circle:'◎' };
  const btn     = document.getElementById('xp-vis-toggle');
  if (btn) btn.textContent = icons[MP.visualMode];
}

function updateStatusLight(state) {
  const light = document.getElementById('xp-status-light');
  const text  = document.getElementById('xp-status-text');
  if (light) light.className = 'xp-status-light ' + state;
  if (text)  text.textContent = state.toUpperCase();
}

function initDropZone() {
  const body = document.querySelector('.xp-player-body');
  const zone = document.getElementById('xp-drop-zone');
  if (!body || !zone) return;
  body.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('active'); });
  body.addEventListener('dragleave', () => zone.classList.remove('active'));
  body.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('active');
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('audio/'));
    if (files.length) addFilesToPlaylist(files);
  });
}

function buildMusicUrl(relPath) {
  return `./musics/${String(relPath).split('/').map(encodeURIComponent).join('/')}`;
}
function stripExt(name)  { return String(name).replace(/\.[^/.]+$/, ''); }
function slugify(name)   { return String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category'; }
function titleCase(name) { return String(name).replace(/[-_]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase()); }

function normalizeManifestTrack(t, categoryId, relBase, index) {
  const relPath = t.relPath || (relBase ? `${relBase}/${t.file}` : t.file);
  return {
    id: t.id || `${categoryId}_${index}`,
    url: buildMusicUrl(relPath),
    file: t.file,
    relPath,
    name:   t.title || t.name || stripExt(t.file || ''),
    artist: t.artist || 'Unknown Artist',
    album:  t.album  || null,
    duration:  t.duration  || '--:--',
    palette:   t.palette   || null,
    categoryId,
    sortIndex: t.sortIndex != null ? t.sortIndex : index,
  };
}

function normalizeCategoryEntry(cat, index) {
  const id      = cat.id    || slugify(cat.label || cat.folder || `category-${index}`);
  const label   = cat.label || titleCase(cat.id || cat.folder || `Category ${index + 1}`);
  const relBase = cat.folder ? cat.folder.replace(/^musics\/?/, '') : (id === LIBRARY_ID ? '' : id);
  const tracks  = (cat.tracks || []).map((t, i) => normalizeManifestTrack(t, id, relBase, i));
  return { id, label, tracks };
}

function normalizeCategoryManifest(rawCategories) {
  return rawCategories.map((cat, i) => normalizeCategoryEntry(cat, i));
}

function normalizeLegacyArray(raw) {
  return [{
    id: LIBRARY_ID,
    label: LIBRARY_LABEL,
    tracks: raw.map((t, i) => normalizeManifestTrack(t, LIBRARY_ID, '', i)),
  }];
}

function buildTrackFromFilename(filename, relFolder, categoryId, index) {
  const base   = filename.replace(/\.[^/.]+$/, '').replace(/^\d{1,4}[\s.\-_]+/, '').trim();
  const parts  = base.split(/\s*[-–—]\s*/).map(s => s.trim()).filter(Boolean);
  const artist = parts.length >= 2 ? parts[0] : 'Unknown Artist';
  const name   = parts.length >= 2 ? parts.slice(1).join(' - ') : base;
  const relPath = relFolder ? `${relFolder}/${filename}` : filename;
  return {
    id: `${categoryId}_${index}`,
    url: buildMusicUrl(relPath),
    file: filename, relPath, name, artist,
    album: null, duration: '--:--', palette: null, categoryId,
    sortIndex: index,
  };
}

function buildLegacyCategory(id, label, relFolder, filenames) {
  return {
    id, label,
    tracks: filenames.map((filename, i) => buildTrackFromFilename(filename, relFolder, id, i)),
  };
}

async function fetchDirectoryListing(folder) {
  try {
    const resp = await fetchWithTimeout(`./${folder}/`, 3000);
    if (!resp.ok) return null;
    const ct = resp.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return null;
    const html = await resp.text();
    const doc  = new DOMParser().parseFromString(html, 'text/html');
    const files = [], dirs = [];
    doc.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('?') || href.startsWith('/..') || href === '../') return;
      if (href.endsWith('/')) {
        const name = decodeURIComponent(href.replace(/\/$/, '').split('/').pop());
        if (name) dirs.push(name);
      } else if (AUDIO_EXT_RE.test(href)) {
        files.push(decodeURIComponent(href.split('/').pop()));
      }
    });
    return { files, dirs };
  } catch (e) { return null; }
}

function loadCategoriesFromWindow() {
  const raw = window.__TRACKLIST__;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.length ? normalizeLegacyArray(raw) : null;
  if (raw && Array.isArray(raw.categories)) return normalizeCategoryManifest(raw.categories);
  return null;
}

async function loadCategoriesFromRootManifest() {
  const resp = await fetchWithTimeout('./musics/tracklist.json', 4000);
  if (!resp.ok) return null;
  const raw = await resp.json();
  if (Array.isArray(raw)) return raw.length ? normalizeLegacyArray(raw) : null;
  if (raw && Array.isArray(raw.categories)) return normalizeCategoryManifest(raw.categories);
  return null;
}

async function loadCategoriesFromLegacyManifest() {
  const candidates = ['./musics/playlist.json', './musics/manifest.json'];
  for (const url of candidates) {
    try {
      const resp = await fetchWithTimeout(url, 4000);
      if (!resp.ok) continue;
      const raw = await resp.json();
      if (Array.isArray(raw) && raw.length) return normalizeLegacyArray(raw);
    } catch (_) {}
  }
  return null;
}

async function loadCategoriesFromDirectoryScan() {
  const rootListing = await fetchDirectoryListing('musics');
  if (!rootListing) return null;
  const categories = [];
  if (rootListing.files.length) {
    categories.push(buildLegacyCategory(LIBRARY_ID, LIBRARY_LABEL, '', rootListing.files));
  }
  for (const dirName of rootListing.dirs) {
    const sub = await fetchDirectoryListing(`musics/${dirName}`);
    if (!sub || !sub.files.length) continue;
    const id = slugify(dirName);
    categories.push(buildLegacyCategory(id, titleCase(dirName), dirName, sub.files));
  }
  return categories.length ? categories : null;
}

async function loadMusicFolder() {
  const loaders = [
    { name: 'window.__TRACKLIST__',   run: loadCategoriesFromWindow },
    { name: 'musics/tracklist.json',  run: loadCategoriesFromRootManifest },
    { name: 'legacy manifest',        run: loadCategoriesFromLegacyManifest },
    { name: 'directory scan',         run: loadCategoriesFromDirectoryScan },
  ];
  for (const loader of loaders) {
    let categories = null;
    try { categories = await loader.run(); } catch (e) { categories = null; }
    if (categories && categories.length) {
      applyDiscoveredCategories(categories, loader.name);
      return;
    }
  }
  showToast('Media Player', 'No tracks found. Add files to musics/, musics/chill/, or musics/favorites/ and run generate-tracklist.js', 'img:icons/049.ico');
}

function computeCategoryTracks(id) {
  if (id === 'all') return MP.categories.reduce((acc, c) => acc.concat(c.tracks), []);
  const category = MP.categories.find(c => c.id === id);
  return category ? category.tracks.slice() : [];
}

function persistActiveCategory(id) {
  try { sessionStorage.setItem('luna-music-category', id); } catch (_) {}
}

function restoreActiveCategory() {
  let stored = null;
  try { stored = sessionStorage.getItem('luna-music-category'); } catch (_) {}
  MP.activeCategoryId = (stored && (stored === 'all' || MP.categories.some(c => c.id === stored))) ? stored : 'all';
}

function setActiveCategory(id) {
  const currentTrack = MP.currentIdx >= 0 ? MP.playlist[MP.currentIdx] : null;
  MP.activeCategoryId = id;
  MP.playlist = computeCategoryTracks(id);
  MP.currentIdx = currentTrack ? MP.playlist.findIndex(t => t.id === currentTrack.id) : -1;
  renderCategoryTabs();
  renderPlaylist();
  persistActiveCategory(id);
}

function renderCategoryTabs() {
  const container = document.getElementById('xp-category-tabs');
  if (!container) return;
  if (MP.categories.length <= 1) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');
  const totalTracks = MP.categories.reduce((n, c) => n + c.tracks.length, 0);
  const entries = [{ id: 'all', label: 'All Tracks', count: totalTracks }]
    .concat(MP.categories.map(c => ({ id: c.id, label: c.label, count: c.tracks.length })));
  container.innerHTML = '';
  entries.forEach(entry => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'w7p-category-tab' + (entry.id === MP.activeCategoryId ? ' active' : '');
    tab.innerHTML = `<span class="w7p-category-tab-label">${escHtml(entry.label)}</span><span class="w7p-category-tab-count">${entry.count}</span>`;
    tab.addEventListener('click', () => setActiveCategory(entry.id));
    container.appendChild(tab);
  });
}

function applyDiscoveredCategories(categories, sourceLabel) {
  if (!Array.isArray(categories) || !categories.length) return;
  const localCategory = MP.categories.find(c => c.id === 'local');
  MP.categories = localCategory ? categories.concat(localCategory) : categories;
  restoreActiveCategory();
  MP.playlist = computeCategoryTracks(MP.activeCategoryId);
  renderCategoryTabs();
  renderPlaylist();
  if (MP.playlist.length > 0 && MP.currentIdx === -1) {
    loadTrack(0);
    const totalTracks = MP.categories.reduce((n, c) => n + c.tracks.length, 0);
    showToast('Media Player', `${totalTracks} track${totalTracks !== 1 ? 's' : ''} loaded across ${MP.categories.length} playlist${MP.categories.length !== 1 ? 's' : ''}`, 'img:icons/049.ico');
  }
  console.info(`[Luna Media] applyDiscoveredCategories: ${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'} from ${sourceLabel}`);
}

function startVisualizer() {
  const canvas = document.getElementById('xp-visualizer');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function frame() {
    MP.animFrame = requestAnimationFrame(frame);
    const W = canvas.offsetWidth  || 260;
    const H = canvas.offsetHeight || 120;
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    ctx.clearRect(0, 0, W, H);

    let dataArray;
    if (MP.analyser && MP.connected && !MP.audio.paused) {
      if (MP.visualMode === 'wave') {
        dataArray = new Float32Array(MP.analyser.fftSize);
        MP.analyser.getFloatTimeDomainData(dataArray);
      } else {
        dataArray = new Uint8Array(MP.analyser.frequencyBinCount);
        MP.analyser.getByteFrequencyData(dataArray);
      }
    }

    const bgGrd = ctx.createLinearGradient(0, 0, 0, H);
    bgGrd.addColorStop(0, 'rgba(0,8,30,0)'); bgGrd.addColorStop(1, 'rgba(0,20,60,0.2)');
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, W, H);

    if (!dataArray) { drawIdleBubbles(ctx, W, H); return; }
    switch (MP.visualMode) {
      case 'bars':   drawBarVisualizer(ctx, W, H, dataArray);  break;
      case 'wave':   drawWaveVisualizer(ctx, W, H, dataArray); break;
      case 'circle': drawCircleVisualizer(ctx, W, H);           break;
    }
  }
  frame();
}

let idleBubbles = null;
function drawIdleBubbles(ctx, W, H) {
  if (!idleBubbles) idleBubbles = Array.from({ length: 6 }, (_, i) => ({
    x: 20 + i * (W / 6), y: H * 0.6, vy: -0.4 - Math.random() * 0.3,
    r: 3 + Math.random() * 5, a: 0.4 + Math.random() * 0.3, phase: i * 1.1,
  }));
  const t = Date.now() * 0.001;
  idleBubbles.forEach(b => {
    b.y += b.vy; b.x += Math.sin(t + b.phase) * 0.4;
    if (b.y < -b.r) { b.y = H + b.r; b.x = Math.random() * W; }
    const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    grad.addColorStop(0, `rgba(85,232,255,${b.a})`); grad.addColorStop(1, `rgba(0,80,200,0)`);
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
  });
  ctx.strokeStyle = 'rgba(0,60,180,0.07)'; ctx.lineWidth = 0.5;
  for (let y = 0; y < H; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawBarVisualizer(ctx, W, H, data) {
  const barCount = 48;
  const step     = Math.floor(data.length / barCount);
  const barW     = (W - barCount) / barCount;
  for (let i = 0; i < barCount; i++) {
    let sum = 0; for (let k = 0; k < step; k++) sum += data[i * step + k];
    const bH  = (sum / step / 255) * (H - 4);
    const x   = i * (barW + 1);
    const hue = 200 + (i / barCount) * 40;
    const grd = ctx.createLinearGradient(0, H, 0, H - bH);
    grd.addColorStop(0, `hsl(${hue},90%,50%)`); grd.addColorStop(0.5, `hsl(${hue + 20},85%,65%)`); grd.addColorStop(1, `hsl(${hue + 40},80%,80%)`);
    ctx.fillStyle = grd; ctx.fillRect(x, H - bH - 2, barW, bH);
    ctx.shadowColor = `hsl(${hue},90%,60%)`; ctx.shadowBlur = 6;
    ctx.fillRect(x, H - bH - 2, barW, 2); ctx.shadowBlur = 0;
    if (bH > 8) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(x, H - bH - 4, barW, 2); }
  }
}

function drawWaveVisualizer(ctx, W, H, data) {
  const sliceW = W / data.length;
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * sliceW, y = ((v + 1) / 2) * H;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#22d8ff'; ctx.lineWidth = 1.5;
  ctx.shadowColor = '#22d8ff'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.lineTo(W, H / 2); ctx.lineTo(0, H / 2);
  const fillGrd = ctx.createLinearGradient(0, 0, 0, H);
  fillGrd.addColorStop(0, 'rgba(34,216,255,0.15)'); fillGrd.addColorStop(1, 'rgba(0,80,255,0.02)');
  ctx.fillStyle = fillGrd; ctx.fill();
}

function drawCircleVisualizer(ctx, W, H) {
  const t = Date.now() * 0.001;
  const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.35;
  ctx.beginPath();
  for (let i = 0; i <= 360; i++) {
    const a  = i * Math.PI / 180;
    const rr = r + Math.sin(a * 3 + t) * r * 0.25;
    const x  = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grd = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grd.addColorStop(0, 'rgba(34,216,255,0.3)'); grd.addColorStop(1, 'rgba(0,80,255,0.1)');
  ctx.strokeStyle = '#22d8ff'; ctx.lineWidth = 1.5; ctx.shadowColor = '#22d8ff'; ctx.shadowBlur = 10;
  ctx.stroke(); ctx.shadowBlur = 0; ctx.fillStyle = grd; ctx.fill();
}
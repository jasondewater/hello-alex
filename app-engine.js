'use strict';
function renderPlan() {
  saveSettings();
  updateLabels();
  syncProgramCards();
  const total = getTotalSeconds();
  const journey = journeys[ui.journeySelect.value];
  const renderedPlan = compilePlan(total, false);

  ui.journeyCopy.innerHTML = `<h3>${journey.name}</h3><p>${journey.description}</p><div class="recommend">${journey.recommendation}</div>`;
  ui.startButton.textContent = ui.journeySelect.value === 'pure' ? 'Start Pure Ganzflicker' : 'Start full journey';
  ui.launchDockMode.textContent = journey.name;
  ui.launchDockButton.textContent = ui.journeySelect.value === 'pure' ? 'START GANZFLICKER' : 'START JOURNEY';
  const runMode = ui.endBehavior.value === 'hold' ? 'until STOP' : formatDuration(total);
  const audioLabel = ui.audioProfile.value === 'silent' ? 'visual only' : ui.audioProfile.options[ui.audioProfile.selectedIndex].text.toLowerCase();
  ui.launchDockDetail.textContent = ui.journeySelect.value === 'pure'
    ? `${Number(ui.flickerFrequency.value).toFixed(1)} Hz · ${runMode} · ${audioLabel}`
    : `${runMode} · ${audioLabel}`;
  ui.dreamCuePanel.classList.toggle('hidden', !['lucid', 'wbtb', 'beacon'].includes(ui.journeySelect.value));
  ui.previewButton.textContent = ui.journeySelect.value === 'pure' ? 'Run short Ganzflicker test' : 'Run compressed preview';
  ui.timeline.innerHTML = '';
  ui.phaseList.innerHTML = '';

  renderedPlan.phases.forEach(phase => {
    const segment = document.createElement('div');
    segment.className = 'timeline-segment';
    segment.style.flex = String(phase.weight);
    segment.title = `${phase.name}: ${formatDuration(phase.duration)}`;
    if (phase.weight >= 0.07) segment.textContent = phase.name;
    ui.timeline.appendChild(segment);

    const row = document.createElement('div');
    row.className = 'phase-row';
    row.innerHTML = `<div class="phase-name">${phase.name}</div><div class="phase-time">${formatDuration(phase.duration)}</div><div class="phase-time">${formatDuration(phase.start)} in</div><div class="phase-detail">${phase.detail}</div>`;
    ui.phaseList.appendChild(row);
  });

  if (renderedPlan.cues.length) {
    const cueTimes = renderedPlan.cues.map(c => formatDuration(c.start)).join(', ');
    ui.cueSummary.textContent = `Estimated dream-cue windows begin around: ${cueTimes}. These are timing heuristics, not REM detection.`;
  } else {
    ui.cueSummary.textContent = ui.journeySelect.value === 'pure' ? 'Pure mode has no dream cues or phase changes.' : 'This journey has no overnight dream-cue windows.';
  }

  const hours = total / 3600;
  if (ui.journeySelect.value === 'pure') {
    ui.durationWarning.textContent = ui.endBehavior.value === 'hold' ? 'Continuous Pure Ganzflicker will run until you press STOP. The selected duration is ignored as a stopping point.' : '';
  } else if (ui.journeySelect.value === 'hypnagogic' && hours > 2) {
    ui.durationWarning.textContent = 'This selection creates a very long flicker-heavy session. For an overnight run, Lucid Dream Incubator or All-Night Dream Beacon is the smarter program.';
  } else if ((ui.journeySelect.value === 'wbtb' || ui.journeySelect.value === 'beacon') && hours < 4) {
    ui.durationWarning.textContent = 'This sleep architecture is compressed at the selected duration. It will still run, but the phase timing is less biologically plausible.';
  } else if (hours >= 6) {
    ui.durationWarning.textContent = 'Long-run mode keeps most sleep phases black and nearly silent. Keep Safari active and test the compressed preview first.';
  } else {
    ui.durationWarning.textContent = '';
  }
}

function createNoiseBuffer(context, type) {
  const seconds = 4;
  const length = context.sampleRate * seconds;
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let brown = 0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] = pink * 0.11;
      } else {
        brown = (brown + 0.02 * white) / 1.02;
        data[i] = brown * 3.5;
      }
    }
  }
  return buffer;
}

async function ensureAudio() {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioCtx = new AudioContextClass();
  await audioCtx.resume();

  masterGain = audioCtx.createGain();
  toneGain = audioCtx.createGain();
  noiseGain = audioCtx.createGain();
  masterGain.gain.value = Number(ui.baseVolume.value);
  toneGain.gain.value = 0;
  noiseGain.gain.value = 0;

  const merger = audioCtx.createChannelMerger(2);
  const leftGain = audioCtx.createGain();
  const rightGain = audioCtx.createGain();
  leftGain.gain.value = 0.72;
  rightGain.gain.value = 0.72;

  leftOsc = audioCtx.createOscillator();
  rightOsc = audioCtx.createOscillator();
  leftOsc.type = 'sine';
  rightOsc.type = 'sine';
  leftOsc.frequency.value = Number(ui.carrier.value);
  rightOsc.frequency.value = Number(ui.carrier.value) + 6;
  leftOsc.connect(leftGain).connect(merger, 0, 0);
  rightOsc.connect(rightGain).connect(merger, 0, 1);
  merger.connect(toneGain).connect(masterGain);

  if (ui.noiseType.value !== 'off') {
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(audioCtx, ui.noiseType.value);
    noiseSource.loop = true;
    noiseSource.connect(noiseGain).connect(masterGain);
    noiseSource.start();
  }

  masterGain.connect(audioCtx.destination);
  leftOsc.start();
  rightOsc.start();
}

function stopAudio() {
  [leftOsc, rightOsc, noiseSource].forEach(node => { try { if (node) node.stop(); } catch (_) {} });
  try { if (audioCtx) audioCtx.close(); } catch (_) {}
  audioCtx = masterGain = toneGain = noiseGain = leftOsc = rightOsc = noiseSource = null;
  audioTestRunning = false;
  ui.audioTestButton.textContent = 'Test background audio';
}

function setAudio(beatHz, toneLevel, noiseLevel, baseLevel) {
  if (!audioCtx || !masterGain || !toneGain || !noiseGain || !leftOsc || !rightOsc) return;
  const now = audioCtx.currentTime;
  const carrier = Number(ui.carrier.value);
  leftOsc.frequency.setTargetAtTime(carrier, now, 0.06);
  rightOsc.frequency.setTargetAtTime(carrier + beatHz, now, 0.06);
  masterGain.gain.setTargetAtTime(baseLevel, now, 0.08);
  toneGain.gain.setTargetAtTime(clamp(toneLevel, 0, 1), now, 0.08);
  noiseGain.gain.setTargetAtTime(clamp(noiseLevel, 0, 1), now, 0.08);
}

function playCueMotif(level = 1) {
  if (!audioCtx || !masterGain) return;
  const start = audioCtx.currentTime + 0.03;
  const frequencies = [523.25, 659.25, 783.99];
  frequencies.forEach((frequency, index) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const t = start + index * 0.31;
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.002, Number(ui.cueVolume.value) * 0.8 * level), t + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.27);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

function speakIntention() {
  if (!ui.voiceCue.checked || !('speechSynthesis' in window)) return;
  const text = ui.intentionText.value.trim();
  if (!text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.72;
  utterance.pitch = 0.86;
  utterance.volume = clamp(Number(ui.cueVolume.value) * 4.2, 0.08, 0.72);
  window.speechSynthesis.speak(utterance);
}

async function testCue() {
  await ensureAudio();
  playCueMotif(1);
  setTimeout(speakIntention, 1150);
}

function phaseAt(elapsed) {
  return plan.phases.find(p => elapsed >= p.start && elapsed < p.end) || plan.phases[plan.phases.length - 1];
}

function cueAt(elapsed) {
  return plan.cues.find(c => elapsed >= c.start && elapsed < c.end) || null;
}

function redValue(fraction) {
  return Math.round(255 * (Number(ui.visualIntensity.value) / 100) * clamp(fraction, 0, 1));
}

function renderVisual(phase, phaseT, elapsed, activeCue) {
  let redFraction = 0;
  if (activeCue) {
    const cueT = (elapsed - activeCue.start) / Math.max(0.01, activeCue.end - activeCue.start);
    const envelope = Math.sin(Math.PI * clamp(cueT, 0, 1));
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * Math.PI * 0.42);
    redFraction = (0.06 + 0.42 * pulse) * activeCue.level * envelope;
  } else {
    const a = phase.redA ?? 0;
    const b = phase.redB ?? a;
    switch (phase.visual) {
      case 'red': redFraction = lerp(a, b, phaseT); break;
      case 'redPulse': {
        const slow = 0.5 + 0.5 * Math.sin(elapsed * Math.PI * 0.16);
        redFraction = lerp(a, b, slow);
        break;
      }
      case 'redBreathe': {
        const slow = 0.5 + 0.5 * Math.sin(elapsed * Math.PI * 0.09);
        redFraction = lerp(a, b, slow);
        break;
      }
      case 'redFade': redFraction = lerp(a, b, phaseT); break;
      case 'redFadeIn': redFraction = lerp(a, b, phaseT); break;
      case 'flicker': {
        const hz = Number(ui.flickerFrequency.value);
        const cycle = (elapsed * hz) % 1;
        redFraction = cycle < (Number(ui.flickerDuty.value) / 100) ? a : 0;
        break;
      }
      default: redFraction = 0;
    }
  }
  ui.stage.style.backgroundColor = `rgb(${redValue(redFraction)},0,0)`;
}

function renderAudio(phase, phaseT, activeCue) {
  const beat = lerp(phase.beatA ?? 6, phase.beatB ?? phase.beatA ?? 6, phaseT);
  const toneA = phase.tone ?? 0;
  const toneB = phase.toneB ?? toneA;
  const noiseA = phase.noise ?? 0;
  const noiseB = phase.noiseB ?? noiseA;
  let tone = lerp(toneA, toneB, phaseT);
  let noise = lerp(noiseA, noiseB, phaseT);
  let base = Number(ui.baseVolume.value);
  const profile = ui.audioProfile.value;
  if (profile === 'binaural') noise = 0;
  if (profile === 'noise') tone = 0;
  if (profile === 'silent') { tone = 0; noise = 0; base = 0; }
  if (activeCue && profile !== 'silent') {
    tone = Math.max(tone, 0.16 * activeCue.level);
    noise *= 0.6;
    base = Math.max(base, Number(ui.cueVolume.value) * 0.75);
  }
  setAudio(beat, tone, noise, base);
}

function maybeTriggerCues(phase, elapsed, activeCue) {
  if (phase.training) {
    const interval = previewMode ? 10 : 42;
    if (elapsed - lastTrainingCueAt >= interval) {
      lastTrainingCueAt = elapsed;
      playCueMotif(0.9);
    }
  }

  if (activeCue) {
    const interval = previewMode ? 4 : 17;
    if (elapsed - lastWindowCueAt >= interval) {
      lastWindowCueAt = elapsed;
      playCueMotif(activeCue.level);
    }
    if (!spokenWindowIds.has(activeCue.id)) {
      spokenWindowIds.add(activeCue.id);
      setTimeout(speakIntention, 1100);
    }
  }
}

function frame(now) {
  if (!running) return;
  const rawElapsed = (now - sessionStartedAt) / 1000;
  const behavior = previewMode ? 'stop' : ui.endBehavior.value;
  const pureContinuous = plan.journeyKey === 'pure' && behavior === 'hold';
  const reachedEnd = !pureContinuous && rawElapsed >= plan.totalSeconds;

  if (reachedEnd && behavior === 'stop') {
    finishSession(true);
    return;
  }

  const elapsed = reachedEnd ? plan.totalSeconds - 0.001 : rawElapsed;
  const phase = phaseAt(elapsed);
  const phaseT = clamp((elapsed - phase.start) / Math.max(0.001, phase.duration), 0, 1);
  const activeCue = cueAt(elapsed);

  if (phase.index !== currentPhaseIndex) {
    currentPhaseIndex = phase.index;
    lastTrainingCueAt = -Infinity;
    ui.stagePhase.textContent = phase.name;
    if (phase.voice) setTimeout(speakIntention, 850);
  }

  renderVisual(phase, phaseT, rawElapsed, activeCue);
  renderAudio(phase, phaseT, activeCue);
  maybeTriggerCues(phase, elapsed, activeCue);

  ui.cueBadge.classList.toggle('active', Boolean(activeCue));
  const shownElapsed = rawElapsed;
  if (pureContinuous) {
    ui.stageClock.textContent = `${formatDuration(shownElapsed, true)} elapsed · continuous`;
    ui.progressBar.style.width = '0%';
  } else if (reachedEnd && behavior === 'hold') {
    ui.stageClock.textContent = `${formatDuration(shownElapsed, true)} elapsed - final phase held`;
    ui.progressBar.style.width = '100%';
  } else {
    const remaining = Math.max(0, plan.totalSeconds - elapsed);
    ui.stageClock.textContent = `${formatDuration(elapsed, true)} elapsed · ${formatDuration(remaining, true)} remaining`;
    ui.progressBar.style.width = `${clamp(elapsed / plan.totalSeconds * 100, 0, 100)}%`;
  }

  rafId = requestAnimationFrame(frame);
}

async function requestWakeLock() {
  if (!ui.screenWake.checked || !('wakeLock' in navigator)) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); } catch (_) { wakeLock = null; }
}

async function releaseWakeLock() {
  try { if (wakeLock) await wakeLock.release(); } catch (_) {}
  wakeLock = null;
}

function ensureLaunchAcknowledged() {
  return true;
}

async function startSession(isPreview) {
  if (!isPreview && !ensureLaunchAcknowledged()) return;
  saveSettings();
  previewMode = isPreview;
  const total = isPreview ? Number(ui.previewLength.value) : getTotalSeconds();
  plan = compilePlan(total, isPreview);
  currentPhaseIndex = -1;
  lastTrainingCueAt = -Infinity;
  lastWindowCueAt = -Infinity;
  spokenWindowIds = new Set();

  await ensureAudio();
  await requestWakeLock();
  try {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) await document.documentElement.requestFullscreen();
  } catch (_) {}

  running = true;
  ui.stage.classList.add('active');
  ui.stageJourney.textContent = isPreview ? `${plan.journey.name} · compressed preview` : plan.journey.name;
  ui.stagePhase.textContent = plan.phases[0].name;
  sessionStartedAt = performance.now();
  lastSession = { journeyName: plan.journey.name, plannedSeconds: plan.totalSeconds, preview: isPreview, startedAt: new Date().toISOString() };
  rafId = requestAnimationFrame(frame);
}

async function finishSession(naturalEnd = false) {
  if (!running) return;
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  const actualSeconds = Math.max(0, (performance.now() - sessionStartedAt) / 1000);
  ui.stage.classList.remove('active');
  ui.stage.style.backgroundColor = '#000';
  ui.cueBadge.classList.remove('active');
  stopAudio();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  await releaseWakeLock();
  try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (_) {}

  if (lastSession) {
    lastSession.actualSeconds = actualSeconds;
    lastSession.naturalEnd = naturalEnd;
  }
  if (!previewMode && plan?.journeyKey !== 'pure') openJournal();
}

function openJournal() {
  if (!lastSession) return;
  ui.journalContext.textContent = `${lastSession.journeyName}, ${formatDuration(lastSession.actualSeconds)} completed.`;
  ui.journalOverlay.classList.add('active');
}

function closeJournal() {
  ui.journalOverlay.classList.remove('active');
  ui.dreamNotes.value = '';
  ui.lucidityScore.value = '0';
  ui.vividnessScore.value = '0';
}

function getLog() {
  try { return JSON.parse(localStorage.getItem('ganzflickerDreamLogV6') || '[]'); } catch (_) { return []; }
}

function renderLog() {
  const log = getLog();
  if (!log.length) {
    ui.logList.className = 'help';
    ui.logList.textContent = 'No entries yet.';
    return;
  }
  ui.logList.className = '';
  ui.logList.innerHTML = '';
  log.slice().reverse().forEach(entry => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    const date = new Date(entry.date).toLocaleString();
    div.innerHTML = `<strong>${entry.journey}</strong><div class="log-meta">${date} · ${entry.duration} · Lucidity ${entry.lucidity}/5 · Vividness ${entry.vividness}/5</div><div class="log-notes"></div>`;
    div.querySelector('.log-notes').textContent = entry.notes || 'No notes.';
    ui.logList.appendChild(div);
  });
}

function saveJournal() {
  const log = getLog();
  log.push({
    date: new Date().toISOString(),
    journey: lastSession?.journeyName || 'Unknown journey',
    duration: formatDuration(lastSession?.actualSeconds || 0),
    lucidity: Number(ui.lucidityScore.value),
    vividness: Number(ui.vividnessScore.value),
    notes: ui.dreamNotes.value.trim()
  });
  try { localStorage.setItem('ganzflickerDreamLogV6', JSON.stringify(log.slice(-100))); } catch (_) {}
  renderLog();
  closeJournal();
}

async function launchPure(profile) {
  ui.journeySelect.value = 'pure';
  ui.endBehavior.value = 'hold';
  ui.audioProfile.value = profile;
  syncProgramCards();
  renderPlan();
  await startSession(false);
}

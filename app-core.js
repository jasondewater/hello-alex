'use strict';
document.documentElement.classList.add('js');

const $ = id => document.getElementById(id);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

const journeys = window.GF_JOURNEYS;

const ui = {
  journeySelect: $('journeySelect'), journeyCopy: $('journeyCopy'), endBehavior: $('endBehavior'),
  durationValue: $('durationValue'), durationUnit: $('durationUnit'), previewLength: $('previewLength'),
  cycleLength: $('cycleLength'), cycleOut: $('cycleOut'), cueStrength: $('cueStrength'), cueStrengthOut: $('cueStrengthOut'),
  cueVolume: $('cueVolume'), cueVolumeOut: $('cueVolumeOut'), intentionText: $('intentionText'), voiceCue: $('voiceCue'),
  visualIntensity: $('visualIntensity'), visualOut: $('visualOut'), baseVolume: $('baseVolume'), baseVolumeOut: $('baseVolumeOut'),
  carrier: $('carrier'), carrierOut: $('carrierOut'), audioProfile: $('audioProfile'), noiseType: $('noiseType'), flickerFrequency: $('flickerFrequency'), flickerOut: $('flickerOut'), flickerDuty: $('flickerDuty'), flickerDutyOut: $('flickerDutyOut'),
  screenWake: $('screenWake'), timeline: $('timeline'), phaseList: $('phaseList'), cueSummary: $('cueSummary'),
  ack: $('ack'), startButton: $('startButton'), previewButton: $('previewButton'), cueTestButton: $('cueTestButton'), audioTestButton: $('audioTestButton'),
  durationWarning: $('durationWarning'), continuousButton: $('continuousButton'), dreamCuePanel: $('dreamCuePanel'), stage: $('stage'), stageJourney: $('stageJourney'), stagePhase: $('stagePhase'),
  stageClock: $('stageClock'), progressBar: $('progressBar'), cueBadge: $('cueBadge'), stopButton: $('stopButton'),
  journalOverlay: $('journalOverlay'), journalContext: $('journalContext'), lucidityScore: $('lucidityScore'), vividnessScore: $('vividnessScore'),
  dreamNotes: $('dreamNotes'), saveJournalButton: $('saveJournalButton'), skipJournalButton: $('skipJournalButton'), logList: $('logList'), clearLogButton: $('clearLogButton'),
  quickPureButton: $('quickPureButton'), quickThetaButton: $('quickThetaButton'), launchDock: $('launchDock'), launchDockMode: $('launchDockMode'), launchDockDetail: $('launchDockDetail'), launchDockButton: $('launchDockButton')
};

let plan = null;
let running = false;
let previewMode = false;
let sessionStartedAt = 0;
let rafId = null;
let currentPhaseIndex = -1;
let lastTrainingCueAt = -Infinity;
let lastWindowCueAt = -Infinity;
let spokenWindowIds = new Set();
let wakeLock = null;
let audioTestRunning = false;
let lastSession = null;

let audioCtx = null;
let masterGain = null;
let toneGain = null;
let noiseGain = null;
let leftOsc = null;
let rightOsc = null;
let noiseSource = null;

if (!ui.journeySelect.options.length) {
  for (const [id, journey] of Object.entries(journeys)) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = journey.name;
    ui.journeySelect.appendChild(option);
  }
}

function syncProgramCards() {
  document.querySelectorAll('[data-program]').forEach(card => {
    const selected = card.dataset.program === ui.journeySelect.value;
    card.classList.toggle('selected', selected);
    const radio = card.querySelector('input[type="radio"]');
    if (radio) radio.checked = selected;
  });
}

function getTotalSeconds() {
  const raw = clamp(Number(ui.durationValue.value) || 1, 1, 1440);
  return ui.durationUnit.value === 'hours' ? raw * 3600 : raw * 60;
}

function formatDuration(seconds, precise = false) {
  seconds = Math.max(0, Math.round(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (precise || seconds < 600) {
    return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  }
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function compilePlan(totalSeconds, isPreview = false) {
  const journey = journeys[ui.journeySelect.value];
  let cursor = 0;
  const phases = journey.phases.map((source, index) => {
    const duration = totalSeconds * source.weight;
    const phase = { ...source, index, start: cursor, duration, end: cursor + duration };
    cursor += duration;
    return phase;
  });

  const cues = [];
  const cycleSeconds = Number(ui.cycleLength.value) * 60;
  const strength = Number(ui.cueStrength.value);

  for (const phase of phases) {
    if (!phase.sleepCues) continue;
    if (isPreview) {
      const start = phase.start + phase.duration * 0.5;
      cues.push({ id: `preview-${phase.index}`, phaseIndex: phase.index, start, end: start + Math.min(9, phase.duration * 0.25), level: 1, label: 'Preview dream cue' });
      continue;
    }

    const localCues = [];
    if (phase.duration < cycleSeconds * 0.75) {
      if (phase.duration >= 8 * 60) {
        localCues.push(phase.duration * 0.82);
      }
    } else {
      let center = cycleSeconds * 0.9;
      while (center < phase.duration - 90) {
        localCues.push(center);
        center += cycleSeconds;
      }
    }

    localCues.forEach((center, idx) => {
      const laterWeight = localCues.length <= 1 ? 1 : 0.58 + 0.42 * (idx / (localCues.length - 1));
      const boost = phase.cueBoost || 1;
      const level = clamp((strength / 5) * laterWeight * boost, 0.2, 1.25);
      const windowSeconds = (45 + strength * 18) * (0.82 + laterWeight * 0.35);
      const start = phase.start + center - windowSeconds / 2;
      cues.push({
        id: `${phase.index}-${idx}`,
        phaseIndex: phase.index,
        start: Math.max(phase.start, start),
        end: Math.min(phase.end, start + windowSeconds),
        level,
        label: `Dream cue ${idx + 1}`
      });
    });
  }

  return { journeyKey: ui.journeySelect.value, journey, phases, cues, totalSeconds, isPreview };
}

function currentSettings() {
  return {
    journey: ui.journeySelect.value,
    endBehavior: ui.endBehavior.value,
    durationValue: ui.durationValue.value,
    durationUnit: ui.durationUnit.value,
    cycleLength: ui.cycleLength.value,
    cueStrength: ui.cueStrength.value,
    cueVolume: ui.cueVolume.value,
    intentionText: ui.intentionText.value,
    voiceCue: ui.voiceCue.checked,
    visualIntensity: ui.visualIntensity.value,
    baseVolume: ui.baseVolume.value,
    carrier: ui.carrier.value,
    audioProfile: ui.audioProfile.value,
    noiseType: ui.noiseType.value,
    flickerFrequency: ui.flickerFrequency.value,
    flickerDuty: ui.flickerDuty.value,
    screenWake: ui.screenWake.checked
  };
}

function saveSettings() {
  try { localStorage.setItem('ganzflickerDreamLabSettingsV6', JSON.stringify(currentSettings())); } catch (_) {}
}

function restoreSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('ganzflickerDreamLabSettingsV6') || '{}');
    for (const [key, value] of Object.entries(saved)) {
      if (!(key in ui)) continue;
      const node = ui[key];
      if (node.type === 'checkbox') node.checked = Boolean(value);
      else node.value = value;
    }
  } catch (_) {}
}

function updateLabels() {
  ui.cycleOut.textContent = `${ui.cycleLength.value} min`;
  ui.cueStrengthOut.textContent = `${ui.cueStrength.value} / 5`;
  ui.cueVolumeOut.textContent = `${Math.round(Number(ui.cueVolume.value) / 0.18 * 100)}%`;
  ui.visualOut.textContent = `${ui.visualIntensity.value}%`;
  ui.baseVolumeOut.textContent = `${Math.round(Number(ui.baseVolume.value) / 0.16 * 100)}%`;
  ui.carrierOut.textContent = `${ui.carrier.value} Hz`;
  ui.flickerOut.textContent = `${Number(ui.flickerFrequency.value).toFixed(1)} Hz`;
  ui.flickerDutyOut.textContent = `${ui.flickerDuty.value}%`;
}

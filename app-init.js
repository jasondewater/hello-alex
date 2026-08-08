'use strict';
function attachEvents() {
  const controls = [
    ui.journeySelect, ui.endBehavior, ui.durationValue, ui.durationUnit, ui.cycleLength, ui.cueStrength,
    ui.cueVolume, ui.intentionText, ui.voiceCue, ui.visualIntensity, ui.baseVolume, ui.carrier,
    ui.audioProfile, ui.noiseType, ui.flickerFrequency, ui.flickerDuty, ui.screenWake
  ];
  controls.forEach(control => control.addEventListener('input', renderPlan));
  controls.forEach(control => control.addEventListener('change', renderPlan));


  document.querySelectorAll('input[name="programCard"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      ui.journeySelect.value = radio.value;
      if (radio.value === 'pure') ui.endBehavior.value = 'hold';
      renderPlan();
    });
  });

  document.querySelectorAll('[data-duration]').forEach(button => {
    button.addEventListener('click', () => {
      ui.durationUnit.value = 'minutes';
      ui.durationValue.value = button.dataset.duration;
      renderPlan();
    });
  });

  ui.continuousButton.addEventListener('click', () => {
    ui.endBehavior.value = 'hold';
    renderPlan();
  });

  ui.ack.addEventListener('change', () => {
    ui.startButton.disabled = false;
  });
  ui.startButton.addEventListener('click', () => startSession(false));
  ui.quickPureButton.addEventListener('click', () => launchPure('silent'));
  ui.quickThetaButton.addEventListener('click', () => launchPure('mix'));
  ui.launchDockButton.addEventListener('click', () => startSession(false));
  ui.previewButton.addEventListener('click', () => startSession(true));
  ui.stopButton.addEventListener('click', () => finishSession(false));
  ui.cueTestButton.addEventListener('click', testCue);
  ui.audioTestButton.addEventListener('click', async () => {
    if (audioTestRunning) {
      stopAudio();
      return;
    }
    await ensureAudio();
    audioTestRunning = true;
    ui.audioTestButton.textContent = 'Stop background audio';
    setAudio(6, 0.55, ui.noiseType.value === 'off' ? 0 : 0.18, Number(ui.baseVolume.value));
  });

  ui.saveJournalButton.addEventListener('click', saveJournal);
  ui.skipJournalButton.addEventListener('click', closeJournal);
  ui.clearLogButton.addEventListener('click', () => {
    if (confirm('Clear the local dream log from this browser?')) {
      try { localStorage.removeItem('ganzflickerDreamLogV6'); } catch (_) {}
      renderLog();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && running) finishSession(false);
  });

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && running && ui.screenWake.checked && !wakeLock) await requestWakeLock();
  });

  window.addEventListener('beforeunload', event => {
    if (!running) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

restoreSettings();
syncProgramCards();
attachEvents();
renderPlan();
renderLog();

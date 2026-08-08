'use strict';

/*
 * Ganzflicker Dream Lab v8
 * True immersive renderer for Apple Vision Pro Safari.
 *
 * v8 fixes the black-screen startup race in v7. The v7 path entered WebXR,
 * then called the legacy DOM-fullscreen startup routine before it marked the
 * journey as running. On Vision Pro that could leave an active XR compositor
 * with no scheduled application frames. v8 starts the journey directly inside
 * WebXR, never requests DOM fullscreen, and clears each eye viewport explicitly.
 */

const gfNativeRAF = window.requestAnimationFrame.bind(window);
const gfNativeCancelRAF = window.cancelAnimationFrame.bind(window);
const gfOriginalStartSession = startSession;
const gfOriginalFinishSession = finishSession;
const gfOriginalRenderPlan = renderPlan;
const gfOriginalRenderVisual = renderVisual;

let gfXRSession = null;
let gfXRReferenceSpace = null;
let gfXRGl = null;
let gfXRCanvas = null;
let gfXRStarting = false;
let gfXRFinishing = false;
let gfXRStartedAt = 0;
let gfXRSupported = null;
let gfXRLastError = '';
let gfXRStatusNode = null;
let gfXRTargetFrameRate = null;
let gfCurrentRed = 0;
let gfXRFrameCount = 0;
let gfXRRedFrameCount = 0;

function gfParseStageRed() {
  const inlineColor = ui.stage.style.backgroundColor || '';
  const inlineMatch = inlineColor.match(/rgba?\(\s*([\d.]+)/i);
  if (inlineMatch) return clamp((Number(inlineMatch[1]) || 0) / 255, 0, 1);

  try {
    const computedColor = getComputedStyle(ui.stage).backgroundColor || '';
    const computedMatch = computedColor.match(/rgba?\(\s*([\d.]+)/i);
    if (computedMatch) return clamp((Number(computedMatch[1]) || 0) / 255, 0, 1);
  } catch (_) {}

  return 0;
}

function gfSetInitialRed() {
  gfCurrentRed = clamp(Number(ui.visualIntensity.value) / 100, 0, 1);
  ui.stage.style.backgroundColor = `rgb(${Math.round(gfCurrentRed * 255)},0,0)`;
}

renderVisual = function renderVisualAndCaptureXRColor(phase, phaseT, elapsed, activeCue) {
  gfOriginalRenderVisual(phase, phaseT, elapsed, activeCue);
  gfCurrentRed = gfParseStageRed();
};

function gfRenderImmersiveFrame(xrFrame) {
  const session = gfXRSession;
  const gl = gfXRGl;
  const layer = session?.renderState?.baseLayer;
  if (!session || !gl || !layer) return;

  let pose = null;
  try {
    if (gfXRReferenceSpace) pose = xrFrame.getViewerPose(gfXRReferenceSpace);
  } catch (_) {}

  const red = clamp(gfCurrentRed, 0, 1);

  gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.colorMask(true, true, true, true);
  gl.clearColor(red, 0, 0, 1);

  // Clear the full XR layer first. This provides a fallback even if the viewer
  // pose is temporarily unavailable during the first headset frame.
  gl.disable(gl.SCISSOR_TEST);
  gl.viewport(0, 0, layer.framebufferWidth, layer.framebufferHeight);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Then clear each eye viewport explicitly. This is the canonical WebXR path
  // and avoids relying on a compositor to treat one whole-layer clear as valid
  // content for both views.
  if (pose?.views?.length) {
    gl.enable(gl.SCISSOR_TEST);
    for (const view of pose.views) {
      const viewport = layer.getViewport(view);
      if (!viewport) continue;
      gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      gl.scissor(viewport.x, viewport.y, viewport.width, viewport.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.disable(gl.SCISSOR_TEST);
  }

  gl.flush();
  gfXRFrameCount += 1;
  if (red > 0.01) gfXRRedFrameCount += 1;
}

function gfInstallXRAnimationClock() {
  window.requestAnimationFrame = callback => {
    if (!gfXRSession) return gfNativeRAF(callback);
    return gfXRSession.requestAnimationFrame((time, xrFrame) => {
      try {
        callback(time);
      } catch (error) {
        console.error('Ganzflicker XR frame callback failed:', error);
        gfSetXRStatus('error', `XR frame callback failed: ${error?.message || String(error)}`);
      }
      if (gfXRSession && running) gfRenderImmersiveFrame(xrFrame);
    });
  };

  window.cancelAnimationFrame = id => {
    if (gfXRSession) {
      try { gfXRSession.cancelAnimationFrame(id); } catch (_) {}
      return;
    }
    gfNativeCancelRAF(id);
  };
}

function gfRestoreAnimationClock() {
  window.requestAnimationFrame = gfNativeRAF;
  window.cancelAnimationFrame = gfNativeCancelRAF;
}

function gfSetXRStatus(kind, message) {
  gfXRLastError = kind === 'error' ? message : '';
  if (!gfXRStatusNode) return;
  gfXRStatusNode.dataset.kind = kind;
  gfXRStatusNode.textContent = message;
}

async function gfDetectXR() {
  if (!navigator.xr?.isSessionSupported) {
    gfXRSupported = false;
    gfSetXRStatus('fallback', 'WebXR is not exposed here. Starts will use the Safari-window fallback.');
    return false;
  }

  try {
    gfXRSupported = await navigator.xr.isSessionSupported('immersive-vr');
  } catch (_) {
    gfXRSupported = false;
  }

  gfSetXRStatus(
    gfXRSupported ? 'ready' : 'fallback',
    gfXRSupported
      ? 'True immersive WebXR is ready. v8 starts the XR frame loop directly, without DOM fullscreen.'
      : 'Immersive-vr is unavailable in this browser configuration. Starts will use the Safari-window fallback.'
  );
  return gfXRSupported;
}

async function gfOpenXRSession() {
  if (!navigator.xr?.requestSession || typeof XRWebGLLayer === 'undefined') {
    throw new Error('WebXR immersive-vr is not available.');
  }

  // requestSession must be called immediately inside the initiating pinch/click.
  const sessionPromise = navigator.xr.requestSession('immersive-vr');

  gfXRCanvas = document.createElement('canvas');
  gfXRCanvas.width = 4;
  gfXRCanvas.height = 4;
  gfXRCanvas.setAttribute('aria-hidden', 'true');
  gfXRCanvas.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(gfXRCanvas);

  const contextOptions = {
    xrCompatible: true,
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  };

  gfXRGl = gfXRCanvas.getContext('webgl2', contextOptions)
    || gfXRCanvas.getContext('webgl', contextOptions);

  if (!gfXRGl) {
    const pending = await sessionPromise;
    try { await pending.end(); } catch (_) {}
    throw new Error('Safari could not create an XR-compatible WebGL context.');
  }

  const session = await sessionPromise;
  gfXRSession = session;

  if (gfXRGl.makeXRCompatible) await gfXRGl.makeXRCompatible();

  const baseLayer = new XRWebGLLayer(session, gfXRGl, {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    framebufferScaleFactor: 1
  });
  session.updateRenderState({ baseLayer });

  if (session.updateTargetFrameRate && session.supportedFrameRates) {
    const rates = Array.from(session.supportedFrameRates).map(Number).filter(Number.isFinite);
    gfXRTargetFrameRate = [120, 90, 96, 100]
      .find(target => rates.some(rate => Math.abs(rate - target) < 0.1)) || null;
    if (gfXRTargetFrameRate) {
      try {
        await session.updateTargetFrameRate(gfXRTargetFrameRate);
      } catch (_) {
        gfXRTargetFrameRate = null;
      }
    }
  }

  try {
    gfXRReferenceSpace = await session.requestReferenceSpace('local');
  } catch (_) {
    gfXRReferenceSpace = await session.requestReferenceSpace('viewer');
  }

  gfXRFrameCount = 0;
  gfXRRedFrameCount = 0;
  gfXRStartedAt = performance.now();
  gfSetInitialRed();
  gfInstallXRAnimationClock();

  session.addEventListener('select', () => {
    // Ignore input that may bleed through from the launch pinch.
    if (performance.now() - gfXRStartedAt < 1800) return;
    finishSession(false);
  });

  session.addEventListener('end', () => {
    const shouldFinish = running && !gfXRFinishing;
    gfXRSession = null;
    gfXRReferenceSpace = null;
    gfRestoreAnimationClock();
    if (shouldFinish) {
      finishSession(false, true);
    } else {
      gfCleanupXRObjects();
    }
  }, { once: true });

  // Paint one red bootstrap frame immediately. The application journey loop
  // takes over on the next XR callback.
  session.requestAnimationFrame((_, xrFrame) => {
    if (gfXRSession === session) gfRenderImmersiveFrame(xrFrame);
  });

  const rateText = gfXRTargetFrameRate ? ` at ${gfXRTargetFrameRate} Hz` : '';
  gfSetXRStatus('active', `Immersive session active${rateText}. Pinch once anywhere or use the Digital Crown to exit.`);
  return session;
}

function gfCleanupXRObjects() {
  gfXRReferenceSpace = null;
  gfXRTargetFrameRate = null;
  gfXRGl = null;
  if (gfXRCanvas) {
    try { gfXRCanvas.remove(); } catch (_) {}
  }
  gfXRCanvas = null;
  gfRestoreAnimationClock();
}

function gfStartJourneyInsideXR(isPreview) {
  if (!isPreview && !ensureLaunchAcknowledged()) return false;

  saveSettings();
  previewMode = isPreview;
  const total = isPreview ? Number(ui.previewLength.value) : getTotalSeconds();
  plan = compilePlan(total, isPreview);
  currentPhaseIndex = -1;
  lastTrainingCueAt = -Infinity;
  lastWindowCueAt = -Infinity;
  spokenWindowIds = new Set();

  running = true;
  ui.stage.classList.add('active');
  ui.stageJourney.textContent = isPreview
    ? `${plan.journey.name} · compressed preview`
    : plan.journey.name;
  ui.stagePhase.textContent = plan.phases[0].name;
  sessionStartedAt = performance.now();
  lastSession = {
    journeyName: plan.journey.name,
    plannedSeconds: plan.totalSeconds,
    preview: isPreview,
    startedAt: new Date().toISOString()
  };

  // Calling frame directly computes the first red/black state immediately and
  // schedules the continuing loop on the XR session clock.
  frame(sessionStartedAt);
  void requestWakeLock();
  return true;
}

startSession = async function startSessionWithImmersion(isPreview) {
  if (running || gfXRStarting) return;
  gfXRStarting = true;

  const wantsAudio = ui.audioProfile.value !== 'silent';
  const audioWarmup = wantsAudio
    ? ensureAudio().catch(error => {
        console.warn('Audio initialization failed:', error);
        return null;
      })
    : Promise.resolve();

  try {
    await gfOpenXRSession();
    const started = gfStartJourneyInsideXR(isPreview);
    if (!started) {
      const session = gfXRSession;
      if (session) await session.end();
      return;
    }
    // Audio initialization continues independently so it cannot block the first
    // visual XR frames. It was initiated inside the launch gesture above.
    void audioWarmup;
  } catch (error) {
    const message = error?.message || String(error);
    gfSetXRStatus('error', `Immersive launch failed, so window mode started instead: ${message}`);

    const pendingSession = gfXRSession;
    gfXRSession = null;
    try { if (pendingSession) await pendingSession.end(); } catch (_) {}
    gfCleanupXRObjects();

    await audioWarmup;
    await gfOriginalStartSession(isPreview);
  } finally {
    gfXRStarting = false;
  }
};

finishSession = async function finishSessionWithImmersion(naturalEnd = false, fromXREnd = false) {
  if (gfXRFinishing) return;
  gfXRFinishing = true;

  const session = gfXRSession;
  try {
    // Keep the XR session reference alive while the original engine cancels its
    // XR requestAnimationFrame ID and tears down audio/wake lock state.
    if (running) await gfOriginalFinishSession(naturalEnd);

    if (session && !fromXREnd) {
      try { await session.end(); } catch (_) {}
    }
  } finally {
    if (gfXRSession === session) gfXRSession = null;
    gfCleanupXRObjects();
    gfXRFinishing = false;

    if (gfXRSupported) {
      const diagnostics = gfXRFrameCount
        ? ` Last run rendered ${gfXRFrameCount} XR frames, including ${gfXRRedFrameCount} red frames.`
        : '';
      gfSetXRStatus(
        'ready',
        `True immersive WebXR is ready. v8 starts the XR frame loop directly, without DOM fullscreen.${diagnostics}`
      );
    }
  }
};

renderPlan = function renderPlanWithImmersiveLabels() {
  gfOriginalRenderPlan();
  const pure = ui.journeySelect.value === 'pure';
  ui.startButton.textContent = pure ? 'Enter Immersive Ganzflicker' : 'Enter Immersive Journey';
  ui.launchDockButton.textContent = pure ? 'ENTER IMMERSIVE GF' : 'ENTER IMMERSIVE JOURNEY';
};

function gfDecorateUI() {
  const quick = document.querySelector('.quick-launch');
  if (quick) {
    gfXRStatusNode = document.createElement('div');
    gfXRStatusNode.id = 'xrStatus';
    gfXRStatusNode.dataset.kind = 'checking';
    gfXRStatusNode.textContent = 'Checking Vision Pro immersive WebXR support…';
    gfXRStatusNode.style.cssText = [
      'grid-column:1/-1',
      'margin-top:12px',
      'padding:11px 13px',
      'border-radius:12px',
      'border:1px solid rgba(255,255,255,.18)',
      'background:rgba(0,0,0,.28)',
      'font-size:14px',
      'line-height:1.4'
    ].join(';');
    quick.appendChild(gfXRStatusNode);
  }

  ui.quickPureButton.textContent = 'ENTER IMMERSIVE GANZFLICKER';
  ui.quickThetaButton.textContent = 'ENTER IMMERSIVE + THETA';

  const note = document.querySelector('.quick-note');
  if (note) {
    note.textContent = 'v8 fills both eye buffers directly. Pinch once after launch or use the Digital Crown to exit.';
  }

  const privateNote = document.querySelector('.private-note');
  if (privateNote) {
    privateNote.textContent = 'Private experimental build v8 · WebXR black-screen fix · local settings and dream notes';
  }
}

gfDecorateUI();
gfDetectXR();

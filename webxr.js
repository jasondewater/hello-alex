'use strict';

/*
 * True immersive renderer for Apple Vision Pro Safari.
 * The existing journey engine remains the source of timing, audio, cues, and
 * phase colors. While an immersive-vr session is active, its requestAnimationFrame
 * becomes the app clock and the computed color is cleared across both eye buffers.
 */

const gfNativeRAF = window.requestAnimationFrame.bind(window);
const gfNativeCancelRAF = window.cancelAnimationFrame.bind(window);
const gfOriginalStartSession = startSession;
const gfOriginalFinishSession = finishSession;
const gfOriginalRenderPlan = renderPlan;

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

function gfParseStageRed() {
  const color = ui.stage.style.backgroundColor || 'rgb(0, 0, 0)';
  const match = color.match(/rgba?\(\s*([\d.]+)/i);
  return clamp((Number(match?.[1]) || 0) / 255, 0, 1);
}

function gfRenderImmersiveFrame(xrFrame) {
  const session = gfXRSession;
  const gl = gfXRGl;
  const layer = session?.renderState?.baseLayer;
  if (!session || !gl || !layer) return;

  // Asking for the viewer pose keeps the render path aligned with WebXR's frame lifecycle.
  // A solid field does not need geometry or per-eye transforms.
  if (gfXRReferenceSpace) xrFrame.getViewerPose(gfXRReferenceSpace);

  gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
  gl.viewport(0, 0, layer.framebufferWidth, layer.framebufferHeight);
  gl.disable(gl.SCISSOR_TEST);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.colorMask(true, true, true, true);
  gl.clearColor(gfParseStageRed(), 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
}

function gfInstallXRAnimationClock() {
  window.requestAnimationFrame = callback => {
    if (!gfXRSession) return gfNativeRAF(callback);
    return gfXRSession.requestAnimationFrame((time, xrFrame) => {
      callback(time);
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
      ? 'True immersive WebXR is ready. Starting a mode will replace the room and Safari window.'
      : 'Immersive-vr is unavailable in this browser configuration. Starts will use the Safari-window fallback.'
  );
  return gfXRSupported;
}

async function gfOpenXRSession() {
  if (!navigator.xr?.requestSession || typeof XRWebGLLayer === 'undefined') {
    throw new Error('WebXR immersive-vr is not available.');
  }

  // Call requestSession immediately inside the initiating pinch/click. Safari requires
  // transient user activation for an immersive session.
  // A uniform binocular field needs no floor map, room bounds, or hand-joint data.
  // Request only the core session to keep Vision Pro's permission flow minimal.
  const sessionPromise = navigator.xr.requestSession('immersive-vr');

  gfXRCanvas = document.createElement('canvas');
  gfXRCanvas.width = 4;
  gfXRCanvas.height = 4;
  gfXRCanvas.setAttribute('aria-hidden', 'true');
  gfXRCanvas.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(gfXRCanvas);

  gfXRGl = gfXRCanvas.getContext('webgl2', {
    xrCompatible: true,
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  }) || gfXRCanvas.getContext('webgl', {
    xrCompatible: true,
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  });

  if (!gfXRGl) {
    const pending = await sessionPromise;
    try { await pending.end(); } catch (_) {}
    throw new Error('Safari could not create an XR-compatible WebGL context.');
  }

  const session = await sessionPromise;
  gfXRSession = session;

  if (gfXRGl.makeXRCompatible) await gfXRGl.makeXRCompatible();
  session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gfXRGl, {
      alpha: false, antialias: false, depth: false, stencil: false
    })
  });

  if (session.updateTargetFrameRate && session.supportedFrameRates) {
    const rates = Array.from(session.supportedFrameRates).map(Number).filter(Number.isFinite);
    gfXRTargetFrameRate = [120, 90, 96, 100].find(target => rates.some(rate => Math.abs(rate - target) < 0.1)) || null;
    if (gfXRTargetFrameRate) {
      try { await session.updateTargetFrameRate(gfXRTargetFrameRate); } catch (_) { gfXRTargetFrameRate = null; }
    }
  }

  try {
    gfXRReferenceSpace = await session.requestReferenceSpace('local');
  } catch (_) {
    gfXRReferenceSpace = await session.requestReferenceSpace('viewer');
  }

  gfXRStartedAt = performance.now();
  gfInstallXRAnimationClock();

  session.addEventListener('select', () => {
    // Ignore any input that may bleed through from the launch gesture.
    if (performance.now() - gfXRStartedAt < 1800) return;
    finishSession(false);
  });

  session.addEventListener('end', () => {
    const shouldFinish = running && !gfXRFinishing;
    gfXRSession = null;
    gfXRReferenceSpace = null;
    gfRestoreAnimationClock();
    if (shouldFinish) finishSession(false, true);
  }, { once: true });

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

startSession = async function startSessionWithImmersion(isPreview) {
  if (running || gfXRStarting) return;
  gfXRStarting = true;

  // Begin audio initialization in the same user gesture as the XR request.
  const audioWarmup = ensureAudio();

  try {
    await gfOpenXRSession();
    await audioWarmup;
    await gfOriginalStartSession(isPreview);
  } catch (error) {
    const message = error?.message || String(error);
    gfSetXRStatus('error', `Immersive launch failed, so window mode started instead: ${message}`);
    const pendingSession = gfXRSession;
    gfXRSession = null;
    try { if (pendingSession) await pendingSession.end(); } catch (_) {}
    gfCleanupXRObjects();
    try { await audioWarmup; } catch (_) {}
    await gfOriginalStartSession(isPreview);
  } finally {
    gfXRStarting = false;
  }
};

finishSession = async function finishSessionWithImmersion(naturalEnd = false, fromXREnd = false) {
  if (gfXRFinishing) return;
  gfXRFinishing = true;

  const session = gfXRSession;
  gfXRSession = null;
  gfRestoreAnimationClock();

  if (session && !fromXREnd) {
    try { await session.end(); } catch (_) {}
  }

  gfCleanupXRObjects();
  try {
    await gfOriginalFinishSession(naturalEnd);
  } finally {
    gfXRFinishing = false;
    if (gfXRSupported) {
      gfSetXRStatus('ready', 'True immersive WebXR is ready. Starting a mode will replace the room and Safari window.');
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
  if (note) note.textContent = 'On Vision Pro this launches true WebXR, filling both eyes in every direction. Pinch once after launch or use the Digital Crown to exit.';

  const privateNote = document.querySelector('.private-note');
  if (privateNote) privateNote.textContent = 'Private experimental build v7 · true WebXR immersive mode · local settings and dream notes';
}

gfDecorateUI();
gfDetectXR();

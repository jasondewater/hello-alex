'use strict';

/*
 * Ganzflicker Dream Lab v10
 * Apple Vision Pro Safari WebXR renderer.
 *
 * The stimulus level is computed numerically from the journey state and passed
 * directly to WebGL. It never reads the color back from CSS. That matters on
 * wide-gamut Safari builds, where CSS colors may serialize as normalized
 * `color(display-p3 ...)` values rather than 0-255 RGB values.
 */

const gfOriginalStartSession = startSession;
const gfOriginalFinishSession = finishSession;
const gfOriginalRenderPlan = renderPlan;

let gfXRSession = null;
let gfXRReferenceSpace = null;
let gfXRGl = null;
let gfXRCanvas = null;
let gfXRProgram = null;
let gfXRBuffer = null;
let gfXRPositionLocation = -1;
let gfXRRedLocation = null;
let gfXRFrameHandle = null;
let gfXRStarting = false;
let gfXRFinishing = false;
let gfXRStartedAt = 0;
let gfXRFirstFrameAt = null;
let gfXRSupported = null;
let gfXRStatusNode = null;
let gfXRTargetFrameRate = null;
let gfXRDiagnostics = null;

function gfResetDiagnostics() {
  gfXRDiagnostics = {
    frames: 0,
    redFrames: 0,
    blackFrames: 0,
    poseFrames: 0,
    maxViews: 0,
    lastGLError: 0,
    firstFrameDelayMs: null,
    minimumRed: 1,
    maximumRed: 0
  };
}

gfResetDiagnostics();

function gfSetXRStatus(kind, message) {
  if (!gfXRStatusNode) return;
  gfXRStatusNode.dataset.kind = kind;
  gfXRStatusNode.textContent = message;
}

function gfDiagnosticSummary(prefix = 'Last immersive run') {
  const d = gfXRDiagnostics;
  const error = d.lastGLError
    ? ` · WebGL error 0x${d.lastGLError.toString(16)}`
    : '';
  return `${prefix}: ${d.frames} frames · ${d.redFrames} red · ${d.blackFrames} black · ${d.poseFrames} pose frames · red range ${d.minimumRed.toFixed(3)}-${d.maximumRed.toFixed(3)}${error}`;
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
      ? 'Immersive WebXR is ready. v10 sends the numeric stimulus directly to both eye buffers.'
      : 'Immersive-vr is unavailable in this Safari configuration. Starts will use the window fallback.'
  );
  return gfXRSupported;
}

function gfCompileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('WebGL could not allocate a shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function gfCreateRenderer(gl) {
  const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined'
    && gl instanceof WebGL2RenderingContext;

  const vertexSource = isWebGL2
    ? `#version 300 es
       in vec2 aPosition;
       void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`
    : `attribute vec2 aPosition;
       void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

  const fragmentSource = isWebGL2
    ? `#version 300 es
       precision highp float;
       uniform float uRed;
       out vec4 outColor;
       void main() { outColor = vec4(uRed, 0.0, 0.0, 1.0); }`
    : `precision highp float;
       uniform float uRed;
       void main() { gl_FragColor = vec4(uRed, 0.0, 0.0, 1.0); }`;

  const vertexShader = gfCompileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = gfCompileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error('WebGL could not allocate the XR render program.');

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Unknown shader link error.';
    gl.deleteProgram(program);
    throw new Error(log);
  }

  const positionLocation = gl.getAttribLocation(program, 'aPosition');
  const redLocation = gl.getUniformLocation(program, 'uRed');
  if (positionLocation < 0 || redLocation === null) {
    gl.deleteProgram(program);
    throw new Error('WebGL could not locate the XR shader inputs.');
  }

  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    throw new Error('WebGL could not allocate full-field geometry.');
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gfXRProgram = program;
  gfXRBuffer = buffer;
  gfXRPositionLocation = positionLocation;
  gfXRRedLocation = redLocation;
}

function gfComputeStimulusRed(phase, phaseT, elapsed, activeCue) {
  let redFraction = 0;

  if (activeCue) {
    const cueDuration = Math.max(0.01, activeCue.end - activeCue.start);
    const cueT = (elapsed - activeCue.start) / cueDuration;
    const envelope = Math.sin(Math.PI * clamp(cueT, 0, 1));
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * Math.PI * 0.42);
    redFraction = (0.06 + 0.42 * pulse) * activeCue.level * envelope;
  } else {
    const a = phase.redA ?? 0;
    const b = phase.redB ?? a;

    switch (phase.visual) {
      case 'red':
      case 'redFade':
      case 'redFadeIn':
        redFraction = lerp(a, b, phaseT);
        break;
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
      case 'flicker': {
        const hz = Math.max(0.1, Number(ui.flickerFrequency.value) || 7.5);
        const duty = clamp(Number(ui.flickerDuty.value) / 100, 0.01, 0.99);
        const cycle = (elapsed * hz) % 1;
        redFraction = cycle < duty ? a : 0;
        break;
      }
      default:
        redFraction = 0;
    }
  }

  const intensity = clamp(Number(ui.visualIntensity.value) / 100, 0, 1);
  return clamp(redFraction * intensity, 0, 1);
}

function gfDrawViewport(gl, viewport, red) {
  gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
  gl.scissor(viewport.x, viewport.y, viewport.width, viewport.height);
  gl.useProgram(gfXRProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, gfXRBuffer);
  gl.enableVertexAttribArray(gfXRPositionLocation);
  gl.vertexAttribPointer(gfXRPositionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform1f(gfXRRedLocation, red);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function gfDrawImmersiveFrame(xrFrame, red) {
  const session = gfXRSession;
  const gl = gfXRGl;
  const layer = session?.renderState?.baseLayer;
  if (!session || !gl || !layer || !layer.framebuffer || !gfXRProgram) return false;

  let pose = null;
  try {
    if (gfXRReferenceSpace) pose = xrFrame.getViewerPose(gfXRReferenceSpace);
  } catch (_) {}

  gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);
  gl.disable(gl.DITHER);
  gl.colorMask(true, true, true, true);
  gl.enable(gl.SCISSOR_TEST);

  if (pose?.views?.length) {
    gfXRDiagnostics.poseFrames += 1;
    gfXRDiagnostics.maxViews = Math.max(gfXRDiagnostics.maxViews, pose.views.length);
    for (const view of pose.views) {
      const viewport = layer.getViewport(view);
      if (!viewport) continue;
      gl.clearColor(red, 0, 0, 1);
      gl.scissor(viewport.x, viewport.y, viewport.width, viewport.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gfDrawViewport(gl, viewport, red);
    }
  } else {
    const viewport = {
      x: 0,
      y: 0,
      width: layer.framebufferWidth,
      height: layer.framebufferHeight
    };
    gl.clearColor(red, 0, 0, 1);
    gl.scissor(0, 0, viewport.width, viewport.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gfDrawViewport(gl, viewport, red);
  }

  gl.disable(gl.SCISSOR_TEST);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.useProgram(null);
  gl.flush();

  if (gfXRDiagnostics.frames < 10 || gfXRDiagnostics.frames % 300 === 0) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) gfXRDiagnostics.lastGLError = error;
  }
  return true;
}

function gfPrepareSessionState(isPreview) {
  saveSettings();
  previewMode = isPreview;
  const total = isPreview ? Number(ui.previewLength.value) : getTotalSeconds();
  plan = compilePlan(total, isPreview);
  currentPhaseIndex = -1;
  lastTrainingCueAt = -Infinity;
  lastWindowCueAt = -Infinity;
  spokenWindowIds = new Set();
  running = true;
  rafId = null;

  ui.stage.classList.add('active');
  ui.stageJourney.textContent = isPreview
    ? `${plan.journey.name} · compressed preview`
    : plan.journey.name;
  ui.stagePhase.textContent = plan.phases[0].name;
  ui.stage.style.backgroundColor = '#000';

  sessionStartedAt = 0;
  lastSession = {
    journeyName: plan.journey.name,
    plannedSeconds: plan.totalSeconds,
    preview: isPreview,
    startedAt: new Date().toISOString()
  };
}

function gfAdvanceJourney(now) {
  if (!running || !plan) return null;
  if (!sessionStartedAt) sessionStartedAt = now;

  const rawElapsed = Math.max(0, (now - sessionStartedAt) / 1000);
  const behavior = previewMode ? 'stop' : ui.endBehavior.value;
  const pureContinuous = plan.journeyKey === 'pure' && behavior === 'hold';
  const reachedEnd = !pureContinuous && rawElapsed >= plan.totalSeconds;

  if (reachedEnd && behavior === 'stop') {
    finishSession(true);
    return null;
  }

  const elapsed = reachedEnd
    ? Math.max(0, plan.totalSeconds - 0.001)
    : rawElapsed;
  const phase = phaseAt(elapsed);
  if (!phase) return null;

  const phaseT = clamp(
    (elapsed - phase.start) / Math.max(0.001, phase.duration),
    0,
    1
  );
  const activeCue = cueAt(elapsed);

  if (phase.index !== currentPhaseIndex) {
    currentPhaseIndex = phase.index;
    lastTrainingCueAt = -Infinity;
    ui.stagePhase.textContent = phase.name;
    if (phase.voice) setTimeout(speakIntention, 850);
  }

  const red = gfComputeStimulusRed(phase, phaseT, rawElapsed, activeCue);
  ui.stage.style.backgroundColor = `rgb(${Math.round(red * 255)},0,0)`;

  renderAudio(phase, phaseT, activeCue);
  maybeTriggerCues(phase, elapsed, activeCue);
  ui.cueBadge.classList.toggle('active', Boolean(activeCue));

  if (pureContinuous) {
    ui.stageClock.textContent = `${formatDuration(rawElapsed, true)} elapsed · continuous`;
    ui.progressBar.style.width = '0%';
  } else if (reachedEnd && behavior === 'hold') {
    ui.stageClock.textContent = `${formatDuration(rawElapsed, true)} elapsed · final phase held`;
    ui.progressBar.style.width = '100%';
  } else {
    const remaining = Math.max(0, plan.totalSeconds - elapsed);
    ui.stageClock.textContent = `${formatDuration(elapsed, true)} elapsed · ${formatDuration(remaining, true)} remaining`;
    ui.progressBar.style.width = `${clamp(elapsed / plan.totalSeconds * 100, 0, 100)}%`;
  }

  return red;
}

function gfXRFrame(time, xrFrame) {
  const session = gfXRSession;
  if (!session || xrFrame.session !== session || !running) return;

  if (gfXRFirstFrameAt === null) {
    gfXRFirstFrameAt = time;
    gfXRDiagnostics.firstFrameDelayMs = Math.max(0, performance.now() - gfXRStartedAt);
  }

  let red = gfAdvanceJourney(time);
  if (red === null || !gfXRSession || !running) return;

  // Visible launch marker, followed by the numerically computed stimulus.
  if (time - gfXRFirstFrameAt < 600) red = Math.max(red, 0.85);

  if (gfDrawImmersiveFrame(xrFrame, red)) {
    gfXRDiagnostics.frames += 1;
    gfXRDiagnostics.minimumRed = Math.min(gfXRDiagnostics.minimumRed, red);
    gfXRDiagnostics.maximumRed = Math.max(gfXRDiagnostics.maximumRed, red);
    if (red > 0.02) gfXRDiagnostics.redFrames += 1;
    else gfXRDiagnostics.blackFrames += 1;
  }

  if (gfXRSession && running) {
    gfXRFrameHandle = gfXRSession.requestAnimationFrame(gfXRFrame);
  }
}

async function gfOpenXRSession(sessionPromise) {
  gfXRCanvas = document.createElement('canvas');
  gfXRCanvas.width = 16;
  gfXRCanvas.height = 16;
  gfXRCanvas.setAttribute('aria-hidden', 'true');
  gfXRCanvas.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.appendChild(gfXRCanvas);

  const options = {
    xrCompatible: true,
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  };

  gfXRGl = gfXRCanvas.getContext('webgl2', options)
    || gfXRCanvas.getContext('webgl', options);
  if (!gfXRGl) {
    const pending = await sessionPromise;
    try { await pending.end(); } catch (_) {}
    throw new Error('Safari could not create an XR-compatible WebGL context.');
  }

  const session = await sessionPromise;
  gfXRSession = session;
  if (gfXRGl.makeXRCompatible) await gfXRGl.makeXRCompatible();
  gfCreateRenderer(gfXRGl);

  const baseLayer = new XRWebGLLayer(session, gfXRGl, {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    ignoreDepthValues: true,
    framebufferScaleFactor: 1
  });
  session.updateRenderState({ baseLayer });

  try {
    gfXRReferenceSpace = await session.requestReferenceSpace('local');
  } catch (_) {
    gfXRReferenceSpace = await session.requestReferenceSpace('viewer');
  }

  if (session.updateTargetFrameRate && session.supportedFrameRates) {
    const rates = Array.from(session.supportedFrameRates)
      .map(Number)
      .filter(Number.isFinite);
    gfXRTargetFrameRate = [90, 120, 96, 100]
      .find(target => rates.some(rate => Math.abs(rate - target) < 0.1))
      || null;
    if (gfXRTargetFrameRate) {
      try { await session.updateTargetFrameRate(gfXRTargetFrameRate); }
      catch (_) { gfXRTargetFrameRate = null; }
    }
  }

  gfXRStartedAt = performance.now();
  gfXRFirstFrameAt = null;

  session.addEventListener('select', () => {
    if (performance.now() - gfXRStartedAt < 1800) return;
    finishSession(false);
  });

  session.addEventListener('end', gfHandleXREnd, { once: true });
  return session;
}

function gfCleanupXR() {
  const gl = gfXRGl;
  if (gl) {
    try { if (gfXRBuffer) gl.deleteBuffer(gfXRBuffer); } catch (_) {}
    try { if (gfXRProgram) gl.deleteProgram(gfXRProgram); } catch (_) {}
  }

  gfXRProgram = null;
  gfXRBuffer = null;
  gfXRPositionLocation = -1;
  gfXRRedLocation = null;
  gfXRReferenceSpace = null;
  gfXRTargetFrameRate = null;
  gfXRFrameHandle = null;
  gfXRFirstFrameAt = null;
  gfXRGl = null;

  if (gfXRCanvas) {
    try { gfXRCanvas.remove(); } catch (_) {}
  }
  gfXRCanvas = null;
}

async function gfHandleXREnd() {
  const shouldFinish = running && !gfXRFinishing;
  gfXRSession = null;
  gfCleanupXR();

  if (shouldFinish) {
    gfXRFinishing = true;
    try { await gfOriginalFinishSession(false); }
    finally { gfXRFinishing = false; }
  }

  gfSetXRStatus('ready', `${gfDiagnosticSummary()} · Ready for another immersive run.`);
}

startSession = async function startSessionWithImmersion(isPreview) {
  if (running || gfXRStarting) return;

  if (!navigator.xr?.requestSession || gfXRSupported === false) {
    await gfOriginalStartSession(isPreview);
    return;
  }

  gfXRStarting = true;
  gfResetDiagnostics();

  try {
    // Both privileged operations are initiated by the same user gesture.
    const sessionPromise = navigator.xr.requestSession('immersive-vr');
    const audioPromise = ui.audioProfile.value === 'silent'
      ? Promise.resolve()
      : ensureAudio().catch(error => {
          gfSetXRStatus('error', `Visuals can run, but audio failed: ${error?.message || error}`);
        });

    await gfOpenXRSession(sessionPromise);
    gfPrepareSessionState(isPreview);
    requestWakeLock().catch(() => {});
    void audioPromise;

    const rateText = gfXRTargetFrameRate ? ` · ${gfXRTargetFrameRate} Hz target` : '';
    gfSetXRStatus(
      'active',
      `Immersive renderer active${rateText}. The first 0.6 seconds are solid red; then the direct numeric stimulus begins. Pinch once after launch or use the Digital Crown to exit.`
    );
    gfXRFrameHandle = gfXRSession.requestAnimationFrame(gfXRFrame);
  } catch (error) {
    const message = error?.message || String(error);
    const pending = gfXRSession;
    gfXRSession = null;
    try { if (pending) await pending.end(); } catch (_) {}
    gfCleanupXR();
    gfSetXRStatus('error', `Immersive launch failed; Safari-window mode started instead: ${message}`);
    await gfOriginalStartSession(isPreview);
  } finally {
    gfXRStarting = false;
  }
};

finishSession = async function finishSessionWithImmersion(naturalEnd = false) {
  if (gfXRFinishing) return;
  if (!gfXRSession) {
    await gfOriginalFinishSession(naturalEnd);
    return;
  }

  gfXRFinishing = true;
  const session = gfXRSession;
  gfXRSession = null;
  gfXRFrameHandle = null;
  rafId = null;

  try {
    if (running) await gfOriginalFinishSession(naturalEnd);
    try { await session.end(); } catch (_) {}
  } finally {
    gfCleanupXR();
    gfXRFinishing = false;
    gfSetXRStatus('ready', `${gfDiagnosticSummary()} · Ready for another immersive run.`);
  }
};

renderPlan = function renderPlanWithImmersiveLabels() {
  gfOriginalRenderPlan();
  const pure = ui.journeySelect.value === 'pure';
  ui.startButton.textContent = pure
    ? 'Enter Immersive Ganzflicker'
    : 'Enter Immersive Journey';
  ui.launchDockButton.textContent = pure
    ? 'ENTER IMMERSIVE GF'
    : 'ENTER IMMERSIVE JOURNEY';
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
    note.textContent = 'v10 computes the stimulus numerically and sends it directly to both eye buffers. It does not read color back from CSS.';
  }

  const privateNote = document.querySelector('.private-note');
  if (privateNote) {
    privateNote.textContent = 'Private experimental build v10 · direct numeric WebXR stimulus · local settings and dream notes';
  }
}

window.GF_XR_DIAGNOSTICS = () => ({ ...gfXRDiagnostics });

gfDecorateUI();
gfDetectXR();

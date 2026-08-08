'use strict';

/*
 * Ganzflicker Dream Lab v8
 * Dedicated immersive renderer for Apple Vision Pro Safari.
 *
 * v7 successfully opened immersive-vr, but its stimulus still depended on the
 * ordinary webpage animation loop. Safari can pause that loop while WebXR owns
 * presentation, leaving the headset's XR framebuffer black. v8 advances the
 * journey and draws both eye views directly from XRSession.requestAnimationFrame.
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
let gfXRColorLocation = null;
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
    firstFrameDelayMs: null
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
  const error = d.lastGLError ? ` · WebGL error 0x${d.lastGLError.toString(16)}` : '';
  return `${prefix}: ${d.frames} frames · ${d.redFrames} red · ${d.blackFrames} black · ${d.poseFrames} pose frames${error}`;
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
      ? 'Immersive WebXR is ready. v8 renders both eyes from the headset frame clock.'
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
       uniform vec3 uColor;
       out vec4 outColor;
       void main() { outColor = vec4(uColor, 1.0); }`
    : `precision highp float;
       uniform vec3 uColor;
       void main() { gl_FragColor = vec4(uColor, 1.0); }`;

  const vertex = gfCompileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = gfCompileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error('WebGL could not allocate the XR render program.');

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Unknown shader link error.';
    gl.deleteProgram(program);
    throw new Error(log);
  }

  const positionLocation = gl.getAttribLocation(program, 'aPosition');
  const colorLocation = gl.getUniformLocation(program, 'uColor');
  if (positionLocation < 0 || colorLocation === null) {
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
  gfXRColorLocation = colorLocation;
}

function gfStageRedLevel() {
  const color = ui.stage.style.backgroundColor
    || getComputedStyle(ui.stage).backgroundColor
    || 'rgb(0,0,0)';
  const values = color.match(/[\d.]+/g);
  return clamp((Number(values?.[0]) || 0) / 255, 0, 1);
}

function gfDrawViewport(gl, viewport, red) {
  gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
  gl.useProgram(gfXRProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, gfXRBuffer);
  gl.enableVertexAttribArray(gfXRPositionLocation);
  gl.vertexAttribPointer(gfXRPositionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform3f(gfXRColorLocation, red, 0, 0);
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
  gl.disable(gl.SCISSOR_TEST);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);
  gl.colorMask(true, true, true, true);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (pose?.views?.length) {
    gfXRDiagnostics.poseFrames += 1;
    gfXRDiagnostics.maxViews = Math.max(gfXRDiagnostics.maxViews, pose.views.length);
    for (const view of pose.views) {
      const viewport = layer.getViewport(view);
      if (viewport) gfDrawViewport(gl, viewport, red);
    }
  } else {
    gfDrawViewport(gl, {
      x: 0,
      y: 0,
      width: layer.framebufferWidth,
      height: layer.framebufferHeight
    }, red);
  }

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

  // The first XR frame supplies the exact session clock origin.
  sessionStartedAt = 0;
  lastSession = {
    journeyName: plan.journey.name,
    plannedSeconds: plan.totalSeconds,
    preview: isPreview,
    startedAt: new Date().toISOString()
  };
}

function gfAdvanceJourney(now) {
  if (!running || !plan) return false;
  if (!sessionStartedAt) sessionStartedAt = now;

  const rawElapsed = Math.max(0, (now - sessionStartedAt) / 1000);
  const behavior = previewMode ? 'stop' : ui.endBehavior.value;
  const pureContinuous = plan.journeyKey === 'pure' && behavior === 'hold';
  const reachedEnd = !pureContinuous && rawElapsed >= plan.totalSeconds;

  if (reachedEnd && behavior === 'stop') {
    finishSession(true);
    return false;
  }

  const elapsed = reachedEnd ? Math.max(0, plan.totalSeconds - 0.001) : rawElapsed;
  const phase = phaseAt(elapsed);
  if (!phase) return false;

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

  return true;
}

function gfXRFrame(time, xrFrame) {
  const session = gfXRSession;
  if (!session || xrFrame.session !== session || !running) return;

  if (gfXRFirstFrameAt === null) {
    gfXRFirstFrameAt = time;
    gfXRDiagnostics.firstFrameDelayMs = Math.max(0, performance.now() - gfXRStartedAt);
  }

  if (!gfAdvanceJourney(time) || !gfXRSession || !running) return;

  let red = gfStageRedLevel();
  // This visible startup marker makes successful rendering unmistakable.
  if (time - gfXRFirstFrameAt < 600) red = Math.max(red, 0.85);

  if (gfDrawImmersiveFrame(xrFrame, red)) {
    gfXRDiagnostics.frames += 1;
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
    framebufferScaleFactor: 1
  });
  session.updateRenderState({ baseLayer });

  try {
    gfXRReferenceSpace = await session.requestReferenceSpace('local');
  } catch (_) {
    gfXRReferenceSpace = await session.requestReferenceSpace('viewer');
  }

  if (session.updateTargetFrameRate && session.supportedFrameRates) {
    const rates = Array.from(session.supportedFrameRates).map(Number).filter(Number.isFinite);
    gfXRTargetFrameRate = [90, 120, 96, 100]
      .find(target => rates.some(rate => Math.abs(rate - target) < 0.1)) || null;
    if (gfXRTargetFrameRate) {
      try { await session.updateTargetFrameRate(gfXRTargetFrameRate); }
      catch (_) { gfXRTargetFrameRate = null; }
    }
  }

  gfXRStartedAt = performance.now();
  gfXRFirstFrameAt = null;

  session.addEventListener('select', () => {
    // Ignore the pinch used to launch the experience.
    if (performance.now() - gfXRStartedAt < 1800) return;
    finishSession(false);
  });

  session.addEventListener('end', () => {
    const shouldFinish = running && !gfXRFinishing;
    gfXRSession = null;
    if (shouldFinish) {
      gfXRFinishing = true;
      gfOriginalFinishSession(false)
        .finally(() => {
          gfCleanupXR();
          gfXRFinishing = false;
          gfSetXRStatus('ready', `${gfDiagnosticSummary()} · Ready for another immersive run.`);
        });
    }
  }, { once: true });

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
  gfXRColorLocation = null;
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

startSession = async function startSessionWithImmersion(isPreview) {
  if (running || gfXRStarting) return;

  if (!navigator.xr?.requestSession || gfXRSupported === false) {
    await gfOriginalStartSession(isPreview);
    return;
  }

  gfXRStarting = true;
  gfResetDiagnostics();

  try {
    // This must be the first privileged call made by the launch click/pinch.
    const sessionPromise = navigator.xr.requestSession('immersive-vr');

    // Begin audio from the same user gesture, but never let it gate visuals.
    if (ui.audioProfile.value !== 'silent') {
      ensureAudio().catch(error => {
        gfSetXRStatus('error', `Visuals can still run, but audio could not start: ${error?.message || error}`);
      });
    }

    await gfOpenXRSession(sessionPromise);
    gfPrepareSessionState(isPreview);
    requestWakeLock().catch(() => {});

    const rateText = gfXRTargetFrameRate ? ` · ${gfXRTargetFrameRate} Hz target` : '';
    gfSetXRStatus('active', `Immersive renderer active${rateText}. The first 0.6 seconds are solid red, then the selected program begins. Pinch once after launch or use the Digital Crown to exit.`);
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
  if (note) note.textContent = 'v8 renders a full-field triangle into both Vision Pro eye views on every headset frame. The first 0.6 seconds are solid red. Pinch once after launch or use the Digital Crown to exit.';

  const privateNote = document.querySelector('.private-note');
  if (privateNote) privateNote.textContent = 'Private experimental build v8 · dedicated per-eye WebXR renderer · local settings and dream notes';
}

window.GF_XR_DIAGNOSTICS = () => ({ ...gfXRDiagnostics });

gfDecorateUI();
gfDetectXR();

'use strict';
const gfOriginalStartSession = startSession;
const gfOriginalFinishSession = finishSession;
const gfOriginalRenderPlan = renderPlan;
let gfXRSession = null;
let gfXRReferenceSpace = null;
let gfXRGl = null;
let gfXRCanvas = null;
let gfXRProgram = null;
let gfXRVertexBuffer = null;
let gfXRVertexArray = null;
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
poseFrames: 0,
views: 0,
redFrames: 0,
blackFrames: 0,
firstFrameDelayMs: null,
lastGLError: 0,
environmentBlendMode: null
};
}
gfResetDiagnostics();
function gfSetXRStatus(kind, message) {
if (!gfXRStatusNode) return;
gfXRStatusNode.dataset.kind = kind;
gfXRStatusNode.textContent = message;
}
function gfDiagnosticSummary(prefix = 'Last immersive run') {
const d = gfXRDiagnostics || {};
const glPart = d.lastGLError ? ` · WebGL error ${d.lastGLError}` : '';
return `${prefix}: ${d.frames || 0} frames · ${d.redFrames || 0} red · ${d.blackFrames || 0} black · ${d.poseFrames || 0} pose frames${glPart}`;
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
? 'Immersive WebXR is ready. v9 starts the per-eye visual renderer before audio.'
: 'Immersive-vr is unavailable in this browser configuration. Starts will use the Safari-window fallback.'
);
return gfXRSupported;
}
function gfCompileShader(gl, type, source) {
const shader = gl.createShader(type);
if (!shader) throw new Error('WebGL could not create a shader.');
gl.shaderSource(shader, source);
gl.compileShader(shader);
if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
const log = gl.getShaderInfoLog(shader) || 'Unknown shader error';
gl.deleteShader(shader);
throw new Error(`XR shader compilation failed: ${log}`);
}
return shader;
}
function gfCreateXRRenderer(gl) {
const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
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
if (!program) throw new Error('WebGL could not create the XR shader program.');
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.deleteShader(vertexShader);
gl.deleteShader(fragmentShader);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
const log = gl.getProgramInfoLog(program) || 'Unknown program link error';
gl.deleteProgram(program);
throw new Error(`XR shader link failed: ${log}`);
}
const buffer = gl.createBuffer();
if (!buffer) throw new Error('WebGL could not create the XR vertex buffer.');
if (isWebGL2 && gl.createVertexArray) {
gfXRVertexArray = gl.createVertexArray();
gl.bindVertexArray(gfXRVertexArray);
}
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
const positionLocation = gl.getAttribLocation(program, 'aPosition');
const redLocation = gl.getUniformLocation(program, 'uRed');
if (positionLocation < 0 || !redLocation) throw new Error('XR shader locations were unavailable.');
gl.useProgram(program);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
if (isWebGL2 && gl.bindVertexArray) gl.bindVertexArray(null);
gl.bindBuffer(gl.ARRAY_BUFFER, null);
gl.useProgram(null);
gfXRProgram = program;
gfXRVertexBuffer = buffer;
gfXRPositionLocation = positionLocation;
gfXRRedLocation = redLocation;
}
function gfStageRedLevel() {
const inline = ui.stage.style.backgroundColor;
const color = inline || getComputedStyle(ui.stage).backgroundColor || 'rgb(0,0,0)';
const match = color.match(/rgba?\(\s*([\d.]+)/i);
return clamp((Number(match?.[1]) || 0) / 255, 0, 1);
}
function gfDrawImmersiveFrame(xrFrame, redLevel) {
const session = gfXRSession;
const gl = gfXRGl;
const layer = session?.renderState?.baseLayer;
if (!session || !gl || !layer || !gfXRProgram || !gfXRReferenceSpace) return false;
const pose = xrFrame.getViewerPose(gfXRReferenceSpace);
if (!pose || !pose.views?.length) {
gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
gl.disable(gl.SCISSOR_TEST);
gl.viewport(0, 0, layer.framebufferWidth, layer.framebufferHeight);
gl.clearColor(redLevel, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.flush();
return true;
}
gfXRDiagnostics.poseFrames += 1;
gfXRDiagnostics.views = Math.max(gfXRDiagnostics.views, pose.views.length);
gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
gl.useProgram(gfXRProgram);
if (gfXRVertexArray && gl.bindVertexArray) {
gl.bindVertexArray(gfXRVertexArray);
} else {
gl.bindBuffer(gl.ARRAY_BUFFER, gfXRVertexBuffer);
gl.enableVertexAttribArray(gfXRPositionLocation);
gl.vertexAttribPointer(gfXRPositionLocation, 2, gl.FLOAT, false, 0, 0);
}
gl.disable(gl.BLEND);
gl.disable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);
gl.disable(gl.DITHER);
gl.colorMask(true, true, true, true);
gl.uniform1f(gfXRRedLocation, redLevel);
gl.enable(gl.SCISSOR_TEST);
for (const view of pose.views) {
const viewport = layer.getViewport(view);
if (!viewport) continue;
gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
gl.scissor(viewport.x, viewport.y, viewport.width, viewport.height);
gl.clearColor(redLevel, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);
}
gl.disable(gl.SCISSOR_TEST);
if (gfXRVertexArray && gl.bindVertexArray) gl.bindVertexArray(null);
gl.bindBuffer(gl.ARRAY_BUFFER, null);
gl.useProgram(null);
gl.flush();
if (gfXRDiagnostics.frames < 12 || gfXRDiagnostics.frames % 90 === 0) {
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
ui.stageJourney.textContent = isPreview ? `${plan.journey.name} · compressed preview` : plan.journey.name;
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
function gfUpdateSessionState(now) {
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
function gfEnsureAudioAfterImmersion() {
if (ui.audioProfile.value === 'silent') return;
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
if (!AudioContextClass) return;
try {
if (!audioCtx) {
audioCtx = new AudioContextClass();
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
const resume = () => {
try {
if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
} catch (_) {}
};
resume();
setTimeout(resume, 250);
setTimeout(resume, 1000);
} catch (_) {
}
}
function gfXRFrame(time, xrFrame) {
const session = gfXRSession;
if (!session || xrFrame.session !== session || !running) return;
if (gfXRFirstFrameAt === null) {
gfXRFirstFrameAt = time;
gfXRDiagnostics.firstFrameDelayMs = Math.max(0, performance.now() - gfXRStartedAt);
}
const stillRunning = gfUpdateSessionState(time);
if (!stillRunning || !gfXRSession || !running) return;
let redLevel = gfStageRedLevel();
if (time - gfXRFirstFrameAt < 600) redLevel = Math.max(redLevel, 0.85);
const drew = gfDrawImmersiveFrame(xrFrame, redLevel);
gfXRDiagnostics.frames += 1;
if (redLevel > 0.02) gfXRDiagnostics.redFrames += 1;
else gfXRDiagnostics.blackFrames += 1;
if ((!drew || gfXRDiagnostics.poseFrames === 0) && gfXRDiagnostics.frames === 30) {
gfSetXRStatus('error', 'Immersive session opened, but Safari supplied no renderable viewer pose in the first 30 frames.');
}
if (gfXRSession && running) gfXRFrameHandle = gfXRSession.requestAnimationFrame(gfXRFrame);
}
async function gfOpenXRSession() {
if (!navigator.xr?.requestSession || typeof XRWebGLLayer === 'undefined') {
throw new Error('WebXR immersive-vr is not available.');
}
const sessionPromise = navigator.xr.requestSession('immersive-vr');
gfXRCanvas = document.createElement('canvas');
gfXRCanvas.width = 16;
gfXRCanvas.height = 16;
gfXRCanvas.setAttribute('aria-hidden', 'true');
gfXRCanvas.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
document.body.appendChild(gfXRCanvas);
const contextOptions = {
xrCompatible: true,
alpha: false,
antialias: false,
depth: false,
stencil: false,
premultipliedAlpha: true,
preserveDrawingBuffer: false,
powerPreference: 'high-performance'
};
gfXRGl = gfXRCanvas.getContext('webgl2', contextOptions) || gfXRCanvas.getContext('webgl', contextOptions);
if (!gfXRGl) {
const pending = await sessionPromise;
try { await pending.end(); } catch (_) {}
throw new Error('Safari could not create an XR-compatible WebGL context.');
}
const session = await sessionPromise;
gfXRSession = session;
gfXRDiagnostics.environmentBlendMode = session.environmentBlendMode || 'unknown';
if (gfXRGl.makeXRCompatible) await gfXRGl.makeXRCompatible();
const layer = new XRWebGLLayer(session, gfXRGl, {
alpha: false,
antialias: false,
depth: false,
stencil: false,
ignoreDepthValues: true,
framebufferScaleFactor: 1.0
});
session.updateRenderState({ baseLayer: layer });
try {
gfXRReferenceSpace = await session.requestReferenceSpace('local');
} catch (_) {
gfXRReferenceSpace = await session.requestReferenceSpace('viewer');
}
gfCreateXRRenderer(gfXRGl);
if (session.updateTargetFrameRate && session.supportedFrameRates) {
const rates = Array.from(session.supportedFrameRates).map(Number).filter(Number.isFinite);
gfXRTargetFrameRate = [90, 120, 96, 100].find(target => rates.some(rate => Math.abs(rate - target) < 0.1)) || null;
if (gfXRTargetFrameRate) {
try { await session.updateTargetFrameRate(gfXRTargetFrameRate); } catch (_) { gfXRTargetFrameRate = null; }
}
}
gfXRStartedAt = performance.now();
session.addEventListener('select', () => {
if (performance.now() - gfXRStartedAt < 1800) return;
finishSession(false);
});
session.addEventListener('end', gfHandleXREnd, { once: true });
return session;
}
function gfDeleteXRResources() {
const gl = gfXRGl;
if (gl) {
try { if (gfXRVertexBuffer) gl.deleteBuffer(gfXRVertexBuffer); } catch (_) {}
try { if (gfXRProgram) gl.deleteProgram(gfXRProgram); } catch (_) {}
try { if (gfXRVertexArray && gl.deleteVertexArray) gl.deleteVertexArray(gfXRVertexArray); } catch (_) {}
}
gfXRProgram = null;
gfXRVertexBuffer = null;
gfXRVertexArray = null;
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
const shouldFinishApp = running && !gfXRFinishing;
gfXRSession = null;
gfDeleteXRResources();
if (shouldFinishApp) {
gfXRFinishing = true;
try { await gfOriginalFinishSession(false); } finally { gfXRFinishing = false; }
}
gfSetXRStatus('ready', `${gfDiagnosticSummary()} · Immersive WebXR is ready for another run.`);
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
await gfOpenXRSession();
gfPrepareSessionState(isPreview);
requestWakeLock().catch(() => {});
gfEnsureAudioAfterImmersion();
const rateText = gfXRTargetFrameRate ? ` · ${gfXRTargetFrameRate} Hz display target` : '';
gfSetXRStatus('active', `Immersive renderer active${rateText}. First 0.6 seconds are solid red, then the selected program begins. Pinch once after launch or use the Digital Crown to exit.`);
gfXRFrameHandle = gfXRSession.requestAnimationFrame(gfXRFrame);
} catch (error) {
const message = error?.message || String(error);
const pendingSession = gfXRSession;
gfXRSession = null;
try { if (pendingSession) await pendingSession.end(); } catch (_) {}
gfDeleteXRResources();
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
try {
if (running) await gfOriginalFinishSession(naturalEnd);
try { await session.end(); } catch (_) {}
} finally {
gfDeleteXRResources();
gfXRFinishing = false;
gfSetXRStatus('ready', `${gfDiagnosticSummary()} · Immersive WebXR is ready for another run.`);
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
if (note) note.textContent = 'v9 uses a dedicated per-eye WebGL renderer. The first 0.6 seconds are solid red; then Ganzflicker begins. Pinch once after launch or use the Digital Crown to exit.';
const privateNote = document.querySelector('.private-note');
if (privateNote) privateNote.textContent = 'Private experimental build v9 · dedicated per-eye WebXR renderer · local settings and dream notes';
}
window.GF_XR_DIAGNOSTICS = () => ({ ...gfXRDiagnostics });
gfDecorateUI();
gfDetectXR();

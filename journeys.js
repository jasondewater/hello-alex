'use strict';
window.GF_JOURNEYS = {
pure: {
name: 'Pure Ganzflicker',
description: 'One continuous red-black Ganzflicker field. No journey phases, no dream cue windows, and no automatic visual transitions. Audio can be mixed, binaural only, noise only, or completely silent.',
recommendation: 'Choose Timed for a fixed run, or Continuous for unlimited Ganzflicker until you press STOP.',
phases: [
{ name: 'Pure Ganzflicker', weight: 1, visual: 'flicker', detail: 'Continuous Ganzflicker at the selected frequency, duty cycle, and red intensity.', beatA: 6, beatB: 6, tone: 0.72, noise: 0.14, redA: 1, redB: 1 }
]
},
lucid: {
name: 'Lucid Dream Incubator',
description: 'A full arc from intention training to Ganzflicker induction, descent, long dark dream field, estimated REM cue windows, and a gentle return.',
recommendation: 'Best fit: 60 minutes to 9 hours. The eight-hour version spends most of the night black and nearly silent.',
phases: [
{ name: 'Intent Lock', weight: 0.04, visual: 'redPulse', detail: 'Pair the three-note cue with your lucidity intention.', beatA: 9, beatB: 6, tone: 0.72, noise: 0.25, redA: 0.25, redB: 0.48, training: true, voice: true },
{ name: 'Hypnagogic Gate', weight: 0.03, visual: 'flicker', detail: 'Classic red-black Ganzflicker with theta audio.', beatA: 7, beatB: 6, tone: 0.8, noise: 0.16, redA: 0.95, redB: 0.95 },
{ name: 'Descent', weight: 0.08, visual: 'redFade', detail: 'Red and audio gradually dissolve toward darkness.', beatA: 6, beatB: 3, tone: 0.65, toneB: 0.12, noise: 0.32, noiseB: 0.08, redA: 0.5, redB: 0 },
{ name: 'Dream Field', weight: 0.82, visual: 'black', detail: 'Dark sleep field with brief conditioned cues near estimated REM windows.', beatA: 2.5, beatB: 2, tone: 0.05, noise: 0.05, sleepCues: true },
{ name: 'Return', weight: 0.03, visual: 'redFadeIn', detail: 'Dim red dawn and a gradual shift back toward alpha.', beatA: 4, beatB: 9, tone: 0.12, toneB: 0.48, noise: 0.05, noiseB: 0.18, redA: 0, redB: 0.42 }
]
},
wbtb: {
name: 'Wake-Back-to-Bed Lucidity',
description: 'Sleep first, wake gently in red light for a deliberate lucid-dream reset, rehearse the intention again, then return to a second dream field with stronger cue windows.',
recommendation: 'Best fit: 5 to 9 hours. At eight hours, the wake-back-to-bed phase begins a little after the four-hour mark.',
phases: [
{ name: 'Intent Lock', weight: 0.04, visual: 'redPulse', detail: 'Condition the cue and set the intention.', beatA: 9, beatB: 6, tone: 0.72, noise: 0.25, redA: 0.25, redB: 0.48, training: true, voice: true },
{ name: 'First Descent', weight: 0.06, visual: 'redFade', detail: 'Fade into darkness and low delta audio.', beatA: 6, beatB: 2.5, tone: 0.58, toneB: 0.08, noise: 0.28, noiseB: 0.05, redA: 0.42, redB: 0 },
{ name: 'First Sleep', weight: 0.50, visual: 'black', detail: 'Long dark sleep block without deliberate cueing.', beatA: 2.2, beatB: 2, tone: 0.035, noise: 0.045 },
{ name: 'Wake-Back-to-Bed', weight: 0.06, visual: 'redFadeIn', detail: 'Gentle red wake-up, intention speech, and the familiar cue motif.', beatA: 4, beatB: 8, tone: 0.18, toneB: 0.52, noise: 0.08, noiseB: 0.22, redA: 0.05, redB: 0.55, training: true, voice: true },
{ name: 'MILD Re-entry', weight: 0.08, visual: 'redFade', detail: 'Rehearse becoming lucid, then descend again.', beatA: 7, beatB: 4, tone: 0.58, toneB: 0.12, noise: 0.25, noiseB: 0.06, redA: 0.45, redB: 0, training: true },
{ name: 'Second Dream Field', weight: 0.23, visual: 'black', detail: 'Dark return to sleep with concentrated cue windows.', beatA: 3, beatB: 2, tone: 0.04, noise: 0.04, sleepCues: true, cueBoost: 1.25 },
{ name: 'Return', weight: 0.03, visual: 'redFadeIn', detail: 'Slow red return and waking audio.', beatA: 4, beatB: 9, tone: 0.12, toneB: 0.48, noise: 0.05, noiseB: 0.18, redA: 0, redB: 0.42 }
]
},
beacon: {
name: 'All-Night Dream Beacon',
description: 'Minimal induction, then a mostly black night. The same cue learned at the beginning returns briefly near estimated REM windows, with later windows carrying more weight.',
recommendation: 'Best fit: 4 to 12 hours. This is the least visually aggressive overnight program.',
phases: [
{ name: 'Cue Training', weight: 0.03, visual: 'redPulse', detail: 'Pair the three-note cue with your intention.', beatA: 8, beatB: 6, tone: 0.62, noise: 0.2, redA: 0.2, redB: 0.4, training: true, voice: true },
{ name: 'Sleep Descent', weight: 0.07, visual: 'redFade', detail: 'Dim red and theta fade into darkness.', beatA: 6, beatB: 2.5, tone: 0.5, toneB: 0.06, noise: 0.24, noiseB: 0.04, redA: 0.38, redB: 0 },
{ name: 'Dream Beacon Field', weight: 0.87, visual: 'black', detail: 'Black field with estimated REM cue windows only.', beatA: 2, beatB: 2, tone: 0.025, noise: 0.035, sleepCues: true, cueBoost: 1.1 },
{ name: 'Return', weight: 0.03, visual: 'redFadeIn', detail: 'Dim red return toward waking.', beatA: 4, beatB: 9, tone: 0.1, toneB: 0.42, noise: 0.04, noiseB: 0.16, redA: 0, redB: 0.38 }
]
},
hypnagogic: {
name: 'Hypnagogic Portal',
description: 'An awake, eyes-closed visual journey built around red immersion, two Ganzflicker passages, theta darkness, and a slow integration phase.',
recommendation: 'Best fit: 20 to 90 minutes. This is the most flicker-heavy journey.',
phases: [
{ name: 'Red Arrival', weight: 0.12, visual: 'redFadeIn', detail: 'Red rises while the binaural difference descends toward theta.', beatA: 10, beatB: 7, tone: 0.45, toneB: 0.64, noise: 0.18, redA: 0.08, redB: 0.62 },
{ name: 'First Gate', weight: 0.18, visual: 'flicker', detail: 'First Ganzflicker passage.', beatA: 7, beatB: 6, tone: 0.7, noise: 0.12, redA: 0.95, redB: 0.95 },
{ name: 'Theta Void', weight: 0.20, visual: 'black', detail: 'Dark integration with theta and brown noise.', beatA: 6, beatB: 5, tone: 0.42, toneB: 0.32, noise: 0.22 },
{ name: 'Second Gate', weight: 0.22, visual: 'flicker', detail: 'Longer Ganzflicker passage.', beatA: 6, beatB: 5, tone: 0.68, noise: 0.1, redA: 0.95, redB: 0.95 },
{ name: 'Red Integration', weight: 0.18, visual: 'redBreathe', detail: 'Slow red breathing with deeper audio.', beatA: 5, beatB: 3, tone: 0.42, toneB: 0.22, noise: 0.18, redA: 0.25, redB: 0.55 },
{ name: 'Stillness', weight: 0.10, visual: 'black', detail: 'Dark finish and near-silence.', beatA: 3, beatB: 2, tone: 0.12, toneB: 0.02, noise: 0.06, noiseB: 0 }
]
},
redTheta: {
name: 'Red Theta Voyage',
description: 'No rapid flicker. A long red immersion that slowly breathes and darkens while audio glides from relaxed alpha through theta toward delta.',
recommendation: 'Best fit: 20 minutes to several hours. Useful when you want the visual intensity without Ganzflicker.',
phases: [
{ name: 'Red Sunrise', weight: 0.12, visual: 'redFadeIn', detail: 'Red rises gradually.', beatA: 10, beatB: 7, tone: 0.4, toneB: 0.58, noise: 0.14, redA: 0.04, redB: 0.6 },
{ name: 'Theta Immersion', weight: 0.58, visual: 'redBreathe', detail: 'Slow red breathing and a 7-to-5 Hz descent.', beatA: 7, beatB: 5, tone: 0.55, toneB: 0.4, noise: 0.18, redA: 0.3, redB: 0.7 },
{ name: 'Deep Red', weight: 0.18, visual: 'red', detail: 'Steady dimmer red with low-theta audio.', beatA: 5, beatB: 3, tone: 0.35, toneB: 0.22, noise: 0.12, redA: 0.42, redB: 0.42 },
{ name: 'Black Descent', weight: 0.12, visual: 'redFade', detail: 'Red and audio fade into darkness.', beatA: 3, beatB: 2, tone: 0.2, toneB: 0.01, noise: 0.08, noiseB: 0, redA: 0.35, redB: 0 }
]
}
};;

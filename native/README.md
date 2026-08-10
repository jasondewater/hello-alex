# Ganzflicker Native v0.1

This package is the first private native scaffold for Jason DeWater's Apple Vision Pro, Apple Watch, and paired iPhone.

## Contents

- A platform-independent Swift core that reproduces the validated Frequency Odyssey v12 journey mathematics.
- A visionOS control app and Compositor Services rendering scaffold.
- An Apple Watch telemetry companion for heart rate and wrist motion.
- An iPhone relay that bridges Apple Watch data to Vision Pro.
- A synchronized JSON Lines session model for stimulus, physiology, motion, markers, and clock synchronization.
- Core tests and a Codex/Xcode acceptance checklist.

## Start here

1. Download and extract `ganzflicker-native-v0.1.zip`.
2. Run the portable core tests:

   ```bash
   cd native-compact/Core
   swift test
   ```

3. On a Mac with Xcode and XcodeGen:

   ```bash
   cd native-compact
   brew install xcodegen
   xcodegen generate
   open GanzflickerLab.xcodeproj
   ```

4. Apply your Apple development team, bundle identifiers, HealthKit permissions, and signing profiles.
5. Build the iPhone relay, Watch companion, and visionOS targets in that order.

## Validation status

- Portable Swift core: **9 tests passing** on Swift 6.2.1.
- Frequency Odyssey one-hour phase boundaries: verified against v12.
- 7.5 Hz cadence at 90 Hz: verified as six red frames followed by six black frames.
- Telemetry encoding, relay framing, clock synchronization, and conservative state hints: verified by tests.
- Apple SDK compilation, code signing, and physical-device behavior: **UNVERIFIED pending Xcode/Codex and device testing**.

The working WebXR v12 application remains untouched at the repository root on the `gf-v12` branch.

# Premium Shell Release Evidence

Branch: `fix/premium-shell`

## What changed

- Full-viewport landscape presentation on phone and desktop.
- Bundled Barlow Condensed/Barlow typography, with no device-font dependency.
- Three.js r185 module renderer with adaptive Retina resolution, PCF shadows,
  environment lighting, ACES output, and restrained post-processing.
- Distinct compact Sidewinder twin-flywheel and Bootlegger pressure-hopper
  mechanisms with animated loading, tension, recoil, and Pip ceremonies.
- Launcher-origin pull gesture with a 28 px dead zone, full phone-thumb power
  range, live lift/juice/lane telemetry, and no opponent-click shortcut.
- A low-latency direct-render path during aiming and impact frames to keep
  WebGL/HTML overlays crisp on mobile compositors.
- Persistent craters and juice stains plus authored lug shock rings, contact
  light, camera punch, debris, haptics, and hybrid sampled/synthesized audio.
- Boot gate, press feedback, screen transitions, redesigned install icon, and
  a 1.3 MB deploy bundle with an offline 3D core cache.

## Automated proof

Run:

```sh
npm test
npm run test:browser
npm run test:pwa
node scripts/capture-premium.js
```

The browser matrix covers 568×320, 740×360, 844×390, and 932×430 landscape
phones plus a 1440×900 desktop. It also proves opponent-tap rejection, dead-zone
cancellation, strong low-pull reach, one complete player/AI exchange,
deterministic skill-shot damage, best-of-three continuation, four-bottle health,
Three.js r185 activation, and the full-bleed contract. The PWA smoke test boots
the complete 3D game with the browser forced offline after installation.

## Captures

- `04-premium-title.png`
- `04-premium-field.png`
- `04-premium-aim.png`
- `04-premium-impact.png`

These are generated from the actual running build at a 844×390 phone viewport;
they are not concept art. Retina output is asserted separately by the renderer
and browser test contracts.

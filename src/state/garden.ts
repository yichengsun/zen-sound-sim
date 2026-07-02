import type { GestureEvent } from '../events';

/**
 * Global garden state — six slow parameters that everything reads.
 * Gestures nudge them; they ease back toward their resting baseline.
 * Soft ceilings keep rapid input from turning into chaos: taps buy
 * density and playfulness only up to a tasteful limit, while sustained
 * gentle contact earns the richest warmth.
 */

export interface GardenParams {
  wakefulness: number;
  calm: number;
  density: number;
  brightness: number;
  warmth: number;
  playfulness: number;
}

const BASELINE: GardenParams = {
  wakefulness: 0.18,
  calm: 0.65,
  density: 0.2,
  brightness: 0.35,
  warmth: 0.3,
  playfulness: 0.15,
};

/** seconds to travel ~63% of the way home */
const TAU: GardenParams = {
  wakefulness: 30,
  calm: 45,
  density: 26,
  brightness: 20,
  warmth: 55,
  playfulness: 14,
};

const CEILING: GardenParams = {
  wakefulness: 1,
  calm: 1,
  density: 0.75, // taps can never saturate the mix
  brightness: 0.85,
  warmth: 1,
  playfulness: 0.7,
};

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export class GardenState {
  params: GardenParams = { ...BASELINE };
  private lastUpdate = performance.now();

  nudge(partial: Partial<GardenParams>) {
    for (const key of Object.keys(partial) as (keyof GardenParams)[]) {
      const delta = partial[key] ?? 0;
      this.params[key] = clamp(this.params[key] + delta, 0, CEILING[key]);
    }
  }

  onGesture(ev: GestureEvent) {
    const i = ev.intensity;
    switch (ev.gestureType) {
      case 'tap':
        this.nudge({
          wakefulness: 0.05 * i,
          playfulness: 0.03,
          density: 0.025,
          calm: -0.015,
        });
        break;
      case 'rapid_tap':
        this.nudge({
          wakefulness: 0.06,
          playfulness: 0.07,
          density: 0.045,
          brightness: 0.03,
          calm: -0.03,
        });
        break;
      case 'press_start':
        this.nudge({ wakefulness: 0.04 });
        break;
      case 'press_update':
        // sustained gentle contact = the richest reward
        this.nudge({ warmth: 0.04, calm: 0.02, density: 0.022, wakefulness: 0.012 });
        break;
      case 'caress':
        this.nudge({
          warmth: 0.03,
          brightness: 0.018,
          calm: 0.01,
          wakefulness: 0.014,
          density: 0.012,
        });
        break;
      case 'hug_start':
        this.nudge({ warmth: 0.28, calm: 0.16, density: 0.08, wakefulness: 0.1 });
        break;
      default:
        break;
    }
  }

  /** call every frame; eases parameters home */
  update() {
    const now = performance.now();
    const dt = Math.min(0.25, (now - this.lastUpdate) / 1000);
    this.lastUpdate = now;
    for (const key of Object.keys(this.params) as (keyof GardenParams)[]) {
      const k = 1 - Math.exp(-dt / TAU[key]);
      this.params[key] += (BASELINE[key] - this.params[key]) * k;
    }
  }
}

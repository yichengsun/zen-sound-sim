import * as Tone from 'tone';
import type { AudioEngine } from '../engine';
import type { GestureEvent } from '../../events';

/**
 * Sleepy Guardian — slow, heavy, calm, affectionate.
 * Deep drone that swells under a resting palm, warm low knocks,
 * a slow pulse awakened by gentle pats, and a garden-deepening hug.
 */
export class GuardianVoice {
  private knock: Tone.MembraneSynth;
  private droneA: Tone.Oscillator;
  private droneB: Tone.Oscillator;
  private droneFilter: Tone.Filter;
  private droneGain: Tone.Gain;
  private bloom: Tone.PolySynth;
  private pulseSynth: Tone.MembraneSynth;
  private pulseEnergy = 0;
  private pressing = false;

  constructor(private engine: AudioEngine) {
    const bus = new Tone.Gain(1);
    bus.connect(engine.master);
    bus.connect(engine.send(0.6));

    this.knock = new Tone.MembraneSynth({
      pitchDecay: 0.07,
      octaves: 1.6,
      envelope: { attack: 0.002, decay: 0.45, sustain: 0, release: 0.4 },
      volume: -11,
    }).connect(bus);

    this.droneA = new Tone.Oscillator('C2', 'sawtooth');
    this.droneB = new Tone.Oscillator('G2', 'sine');
    this.droneB.detune.value = -6;
    this.droneFilter = new Tone.Filter(240, 'lowpass', -24);
    this.droneGain = new Tone.Gain(0);
    this.droneA.connect(this.droneFilter);
    this.droneB.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(bus);
    this.droneA.start();
    this.droneB.start();

    this.bloom = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 3, decay: 2, sustain: 0.6, release: 7 },
      volume: -20,
    }).connect(bus);

    this.pulseSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 1.2,
      envelope: { attack: 0.004, decay: 0.4, sustain: 0, release: 0.3 },
      volume: -16,
    }).connect(bus);

    // the slow heartbeat — silent until pats wake it
    new Tone.Loop((time) => {
      if (this.pulseEnergy < 0.06) return;
      this.pulseSynth.triggerAttackRelease(this.engine.note(0, -2), 0.3, time, 0.1 + this.pulseEnergy * 0.22);
      this.pulseEnergy *= 0.9;
    }, '2n').start(0);
  }

  private retuneDrone() {
    const root = Tone.Frequency(this.engine.note(0, -2)).toFrequency();
    this.droneA.frequency.rampTo(root, 0.8);
    this.droneB.frequency.rampTo(root * 1.5, 0.8);
  }

  handle(ev: GestureEvent) {
    switch (ev.gestureType) {
      case 'tap':
      case 'rapid_tap': {
        if (ev.zoneId === 'head') {
          // gentle pats awaken the slow pulse
          this.pulseEnergy = Math.min(1, this.pulseEnergy + 0.32);
          this.knock.triggerAttackRelease(this.engine.note(2, -1), 0.4, undefined, 0.18 + ev.intensity * 0.2);
        } else {
          const deep = ev.zoneId === 'belly' || ev.zoneId === 'body';
          this.knock.triggerAttackRelease(
            this.engine.note(deep ? 0 : 1, deep ? -2 : -1),
            0.5,
            undefined,
            0.25 + ev.intensity * 0.35
          );
        }
        return;
      }
      case 'press_start':
        this.pressing = true;
        this.retuneDrone();
        this.droneGain.gain.rampTo(0.09, 1.4);
        this.droneFilter.frequency.rampTo(340, 1.6);
        return;
      case 'press_update': {
        // the longer the palm rests, the warmer and more open it grows
        const open = Math.min(1, ev.duration / 6);
        this.droneGain.gain.rampTo(0.09 + open * 0.06, 0.6);
        this.droneFilter.frequency.rampTo(340 + open * 520, 0.8);
        if (ev.duration > 2 && ev.duration < 2.3) {
          this.bloom.triggerAttack(this.engine.note(2, -1), undefined, 0.4);
        }
        return;
      }
      case 'hug_start':
        this.retuneDrone();
        this.droneGain.gain.rampTo(0.14, 2.5);
        this.droneFilter.frequency.rampTo(620, 3);
        this.bloom.triggerAttack(
          [this.engine.note(0, -1), this.engine.note(2, -1), this.engine.note(4, -1)],
          undefined,
          0.5
        );
        return;
      case 'press_end':
      case 'hug_end':
        this.pressing = false;
        this.bloom.releaseAll();
        this.droneGain.gain.rampTo(0, 3.5);
        this.droneFilter.frequency.rampTo(240, 3);
        return;
      case 'caress': {
        // slow body strokes stir the drone awake
        this.retuneDrone();
        this.droneGain.gain.rampTo(Math.min(0.1, 0.035 + ev.speed * 0.09), 0.25);
        this.droneFilter.frequency.rampTo(280 + ev.brightness * 460, 0.4);
        this.scheduleDroneFade();
        return;
      }
      default:
        return;
    }
  }

  private droneFadeTimer: number | undefined;
  private scheduleDroneFade() {
    window.clearTimeout(this.droneFadeTimer);
    this.droneFadeTimer = window.setTimeout(() => {
      if (!this.pressing) this.droneGain.gain.rampTo(0, 2.2);
    }, 320);
  }

  idleMurmur(intensity: number) {
    if (Math.random() < 0.6) {
      this.knock.triggerAttackRelease(this.engine.note(0, -2), 0.5, undefined, 0.05 + intensity * 0.06);
    } else {
      this.retuneDrone();
      this.droneGain.gain.rampTo(0.018 + intensity * 0.015, 2.5);
      window.setTimeout(() => {
        if (!this.pressing) this.droneGain.gain.rampTo(0, 3);
      }, 3000);
    }
  }

  invite() {
    this.retuneDrone();
    this.droneGain.gain.rampTo(0.022, 2);
    window.setTimeout(() => {
      if (!this.pressing) this.droneGain.gain.rampTo(0, 2.6);
    }, 2400);
  }
}

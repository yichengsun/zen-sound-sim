import * as Tone from 'tone';
import type { AudioEngine } from '../engine';
import type { GestureEvent } from '../../events';

/**
 * Stacked Trickster — bright, mischievous, curious, social.
 * Wood clicks, plucked fragments, offbeat jingles. Repeated taps
 * seed a small quantized pattern that fades as attention drifts.
 */
export class TricksterVoice {
  private pluck: Tone.PluckSynth;
  private click: Tone.NoiseSynth;
  private jingle: Tone.FMSynth;
  private scrape: Tone.NoiseSynth;

  /** 8-step pattern seeded by rapid taps, decaying over time */
  private steps: number[] = new Array(8).fill(0);
  private stepIndex = 0;
  private patternEnergy = 0;

  constructor(private engine: AudioEngine) {
    const bus = new Tone.Gain(1);
    bus.connect(engine.master);
    bus.connect(engine.send(0.45));

    this.pluck = new Tone.PluckSynth({
      attackNoise: 0.6,
      dampening: 3600,
      resonance: 0.94,
      volume: -5,
    }).connect(bus);

    this.click = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 },
      volume: -11,
    });
    const clickFilter = new Tone.Filter({ frequency: 2300, type: 'bandpass', Q: 2.2 });
    this.click.connect(clickFilter);
    clickFilter.connect(bus);

    this.jingle = new Tone.FMSynth({
      harmonicity: 7.9,
      modulationIndex: 16,
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.5 },
      modulationEnvelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.2 },
      volume: -19,
    }).connect(bus);

    this.scrape = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.02, decay: 0.12, sustain: 0, release: 0.08 },
      volume: -24,
    });
    const scrapeFilter = new Tone.Filter({ frequency: 1400, type: 'bandpass', Q: 1 });
    this.scrape.connect(scrapeFilter);
    scrapeFilter.connect(bus);

    // the quiet sequencer heart — plays only while a seeded pattern lives
    new Tone.Loop((time) => {
      this.stepIndex = (this.stepIndex + 1) % 8;
      if (this.patternEnergy < 0.05) return;
      this.patternEnergy *= 0.985;
      if (!this.steps[this.stepIndex]) return;
      const vel = 0.1 + this.patternEnergy * 0.25;
      this.click.triggerAttackRelease(0.03, time, vel);
      if (Math.random() < 0.4) {
        this.pluck.triggerAttack(this.engine.randNote(0, 5), time + 0.01);
      }
      if (Math.random() < 0.12) {
        this.jingle.triggerAttackRelease(this.engine.randNote(2, 4), 0.2, time + 0.02, vel * 0.5);
      }
      // patterns slowly forget themselves
      if (this.patternEnergy < 0.3 && Math.random() < 0.05) {
        this.steps[this.stepIndex] = 0;
      }
    }, '8n').start(0);
  }

  handle(ev: GestureEvent) {
    switch (ev.gestureType) {
      case 'tap': {
        const degree = Math.round(ev.brightness * 4);
        this.click.triggerAttackRelease(0.03, undefined, 0.3 + ev.intensity * 0.3);
        this.pluck.triggerAttack(this.engine.note(degree, 0), '+0.005');
        if (ev.zoneId === 'face' || ev.zoneId === 'head') {
          this.jingle.triggerAttackRelease(this.engine.note(degree + 3, 1), 0.2, '+0.09', 0.25);
        }
        return;
      }
      case 'rapid_tap': {
        this.click.triggerAttackRelease(0.03, undefined, 0.35);
        this.pluck.triggerAttack(this.engine.randNote(0, 5), '+0.005');
        // seed the pattern — capped so enthusiasm stays tasteful
        const filled = this.steps.reduce((a, b) => a + b, 0);
        if (filled < 5) {
          const empty = this.steps.map((v, idx) => (v ? -1 : idx)).filter((v) => v >= 0);
          this.steps[empty[Math.floor(Math.random() * empty.length)]] = 1;
        }
        this.patternEnergy = Math.min(1, this.patternEnergy + 0.28);
        return;
      }
      case 'press_start':
        // the trickster doesn't like sitting still — a held hand gets a wry little answer
        this.jingle.triggerAttackRelease(this.engine.note(4, 1), 0.3, '+0.4', 0.15);
        return;
      case 'hug_start':
        this.jingle.triggerAttackRelease(this.engine.note(3, 1), 0.25, undefined, 0.18);
        this.jingle.triggerAttackRelease(this.engine.note(5, 1), 0.25, '+0.25', 0.14);
        this.pluck.triggerAttack(this.engine.note(0, 0), '+0.5');
        return;
      case 'caress':
        if (Math.random() < 0.35) {
          this.scrape.triggerAttackRelease(0.1, undefined, 0.2 + ev.speed * 0.3);
        }
        if (Math.random() < 0.08) {
          this.pluck.triggerAttack(this.engine.randNote(0, 5));
        }
        return;
      default:
        return;
    }
  }

  idleMurmur(intensity: number) {
    this.click.triggerAttackRelease(0.03, undefined, 0.08 + intensity * 0.1);
    if (Math.random() < 0.4) {
      window.setTimeout(() => this.click.triggerAttackRelease(0.03, undefined, 0.06), 140);
    }
    if (Math.random() < 0.25) {
      this.jingle.triggerAttackRelease(this.engine.randNote(2, 4), 0.15, '+0.3', 0.08);
    }
  }

  invite() {
    this.pluck.triggerAttack(this.engine.note(2, 0));
    window.setTimeout(() => this.pluck.triggerAttack(this.engine.note(4, 0)), 200);
  }
}

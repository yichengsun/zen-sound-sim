import * as Tone from 'tone';
import type { AudioEngine } from '../engine';
import type { GestureEvent } from '../../events';

/**
 * Listening Vessel — shy, tender, attentive, ancient.
 * Breath, soft bells, stereo shimmer. Ears open the stereo field,
 * the face answers with small voice-like tones, holding blooms warm.
 */
export class VesselVoice {
  private bells: Tone.PolySynth<Tone.FMSynth>;
  private bloom: Tone.PolySynth;
  private voice: Tone.Synth;
  private breath: Tone.Noise;
  private breathFilter: Tone.Filter;
  private breathGain: Tone.Gain;
  private pingpong: Tone.PingPongDelay;
  private bus: Tone.Gain;
  private holding = false;
  private earTimeout: number | undefined;

  constructor(private engine: AudioEngine) {
    // sculpture bus → stereo delay (closed by default) → master + reverb
    this.bus = new Tone.Gain(1);
    this.pingpong = new Tone.PingPongDelay({ delayTime: '8n.', feedback: 0.38, wet: 0 });
    this.bus.connect(this.pingpong);
    this.pingpong.connect(engine.master);
    this.pingpong.connect(engine.send(0.75));

    this.bells = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2.01,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.003, decay: 1.4, sustain: 0, release: 3.2 },
      modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0, release: 2 },
      volume: -11,
    }).connect(this.bus);

    this.voice = new Tone.Synth({
      oscillator: { type: 'triangle' },
      portamento: 0.09,
      envelope: { attack: 0.06, decay: 0.3, sustain: 0.25, release: 0.9 },
      volume: -15,
    }).connect(this.bus);

    this.bloom = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 1.5, sustain: 0.7, release: 5.5 },
      volume: -14,
    }).connect(this.bus);

    this.breath = new Tone.Noise('pink');
    this.breathFilter = new Tone.Filter({ frequency: 900, type: 'bandpass', Q: 0.9 });
    this.breathGain = new Tone.Gain(0);
    this.breath.connect(this.breathFilter);
    this.breathFilter.connect(this.breathGain);
    this.breathGain.connect(this.bus);
    this.breath.start();
  }

  private get harmonicity() {
    return this.engine.preset?.bellHarmonicity ?? 2.01;
  }

  handle(ev: GestureEvent) {
    switch (ev.gestureType) {
      case 'tap':
      case 'rapid_tap': {
        if (ev.zoneId === 'ear') return this.earTouch(ev);
        if (ev.zoneId === 'face') return this.faceTouch(ev);
        const degree = Math.round(ev.brightness * 5);
        this.bells.set({ harmonicity: this.harmonicity });
        this.bells.triggerAttackRelease(this.engine.note(degree, 0), 2, undefined, 0.25 + ev.intensity * 0.4);
        if (ev.gestureType === 'rapid_tap' && Math.random() < 0.5) {
          this.bells.triggerAttackRelease(this.engine.note(degree + 2, 0), 1.5, '+0.18', 0.15);
        }
        return;
      }
      case 'press_start':
        this.holding = true;
        this.breathGain.gain.rampTo(0.08, 1.2);
        if (ev.zoneId === 'belly' || ev.zoneId === 'body') {
          this.bloom.triggerAttack([this.engine.note(0, 0), this.engine.note(2, 0)], undefined, 0.55);
        }
        return;
      case 'press_update':
        // warmth grows with attention — new tones join as the hold deepens
        if (ev.duration > 1.4 && ev.duration < 1.7) {
          this.bloom.triggerAttack(this.engine.note(4, 0), undefined, 0.4);
        } else if (ev.duration > 3 && ev.duration < 3.3) {
          this.bloom.triggerAttack(this.engine.note(5, 0), undefined, 0.32);
        } else if (ev.duration > 5 && ev.duration < 5.3) {
          this.bloom.triggerAttack(this.engine.note(1, 1), undefined, 0.25);
        }
        return;
      case 'hug_start':
        this.breathGain.gain.rampTo(0.12, 2);
        this.bloom.triggerAttack(
          [this.engine.note(0, -1), this.engine.note(1, 0), this.engine.note(4, 0)],
          undefined,
          0.6
        );
        return;
      case 'press_end':
      case 'hug_end':
        this.holding = false;
        this.bloom.releaseAll();
        this.breathGain.gain.rampTo(0, 2.5);
        return;
      case 'caress': {
        if (ev.zoneId === 'ear') this.openStereo(0.3 + ev.speed * 0.3);
        // breath follows the hand: position sets color, speed sets air
        const f = 500 + ev.brightness * 1600;
        this.breathFilter.frequency.rampTo(f, 0.15);
        this.breathGain.gain.rampTo(Math.min(0.15, 0.045 + ev.speed * 0.14), 0.12);
        // slow strokes coax out little shimmer tones
        if (Math.random() < 0.09) {
          this.bells.set({ harmonicity: this.harmonicity });
          this.bells.triggerAttackRelease(this.engine.note(3 + Math.round(ev.brightness * 3), 1), 2.2, undefined, 0.1);
        }
        if (!this.holding) this.scheduleBreathFade();
        if (ev.zoneId === 'face' && Math.random() < 0.06) this.faceTouch(ev, 0.5);
        return;
      }
      default:
        return;
    }
  }

  private breathFadeTimer: number | undefined;
  private scheduleBreathFade() {
    window.clearTimeout(this.breathFadeTimer);
    this.breathFadeTimer = window.setTimeout(() => {
      if (!this.holding) this.breathGain.gain.rampTo(0, 1.4);
    }, 260);
  }

  /** ears open the stereo field */
  private earTouch(ev: GestureEvent) {
    this.openStereo(0.55);
    this.bells.set({ harmonicity: this.harmonicity });
    this.bells.triggerAttackRelease(this.engine.note(4 + Math.round(ev.intensity * 2), 1), 1.6, undefined, 0.22);
    if (Math.random() < 0.45) {
      this.bells.triggerAttackRelease(this.engine.note(5, 1), 1.2, '+0.22', 0.12);
    }
  }

  private openStereo(wet: number) {
    this.pingpong.wet.rampTo(Math.min(0.6, wet), 0.35);
    window.clearTimeout(this.earTimeout);
    this.earTimeout = window.setTimeout(() => this.pingpong.wet.rampTo(0, 5), 2600);
  }

  /** small voice-like call, sometimes answered */
  private faceTouch(ev: GestureEvent, vol = 1) {
    const d = Math.round(1 + ev.brightness * 3);
    const v = 0.3 * vol;
    this.voice.triggerAttackRelease(this.engine.note(d, 0), 0.28, undefined, v);
    this.voice.triggerAttackRelease(this.engine.note(d + 1, 0), 0.34, '+0.3', v * 0.85);
    if (Math.random() < 0.4) {
      this.voice.triggerAttackRelease(this.engine.note(d - 1, 0), 0.5, '+0.75', v * 0.6);
    }
  }

  idleMurmur(intensity: number) {
    if (Math.random() < 0.5) {
      this.bells.set({ harmonicity: this.harmonicity });
      this.bells.triggerAttackRelease(this.engine.randNote(1), 2.5, undefined, 0.06 + intensity * 0.08);
    } else {
      this.breathGain.gain.rampTo(0.02 + intensity * 0.02, 1.8);
      window.setTimeout(() => {
        if (!this.holding) this.breathGain.gain.rampTo(0, 2.4);
      }, 2200);
    }
  }

  invite() {
    this.bells.set({ harmonicity: this.harmonicity });
    this.bells.triggerAttackRelease(this.engine.note(5, 0), 1.8, undefined, 0.12);
  }
}

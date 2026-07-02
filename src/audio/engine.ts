import * as Tone from 'tone';
import type { Soundscape } from './soundscapes';
import type { GardenParams } from '../state/garden';

/**
 * Master chain + the ambient bed that keeps the garden alive.
 * Sources connect dry to `master` and wet via `send()` into one shared
 * reverb, so the whole garden sits in a single believable room.
 */
export class AudioEngine {
  preset!: Soundscape;

  master: Tone.Gain;
  private toneFilter: Tone.Filter;
  private reverb: Tone.Reverb;
  private reverbNorm: Tone.Gain;
  private reverbReturn: Tone.Gain;

  // ambient bed
  private roomNoise: Tone.Noise;
  private roomGain: Tone.Gain;
  private wind: Tone.Noise;
  private windFilter: Tone.Filter;
  private windGain: Tone.Gain;
  private windLfo: Tone.LFO;
  private subOscA: Tone.Oscillator;
  private subOscB: Tone.Oscillator;
  private subGain: Tone.Gain;
  private drip: Tone.MembraneSynth;
  private dripGain: Tone.Gain;
  private bell: Tone.FMSynth;
  private bellGain: Tone.Gain;
  private chirp: Tone.NoiseSynth;
  private chirpGain: Tone.Gain;
  // the "growing garden" layers — swell with warmth/density earned by touch
  private pad: Tone.PolySynth;
  private padGain: Tone.Gain;
  private melody: Tone.FMSynth;
  private melodyGain: Tone.Gain;
  private chordStep = 0;

  private state: GardenParams | null = null;
  private started = false;

  constructor() {
    const limiter = new Tone.Limiter(-2).toDestination();
    const comp = new Tone.Compressor({ threshold: -22, ratio: 2.5, attack: 0.05, release: 0.4 }).connect(limiter);
    this.toneFilter = new Tone.Filter(2200, 'lowpass', -12).connect(comp);
    this.master = new Tone.Gain(0.9).connect(this.toneFilter);

    // Tone.Reverb's generated IR is unnormalized (~7x gain at long decays),
    // so a compensating gain keeps the send/return loop near unity.
    this.reverb = new Tone.Reverb({ decay: 10, wet: 1, preDelay: 0.03 });
    this.reverbNorm = new Tone.Gain(0.4 / Math.sqrt(10));
    this.reverbReturn = new Tone.Gain(0.45).connect(this.master);
    this.reverb.connect(this.reverbNorm);
    this.reverbNorm.connect(this.reverbReturn);

    // --- room tone: filtered brown noise, barely there
    // NB: Tone's .connect() returns the source, so chains must be explicit
    this.roomNoise = new Tone.Noise('brown');
    this.roomGain = new Tone.Gain(0);
    const roomFilter = new Tone.Filter(320, 'lowpass');
    this.roomNoise.connect(roomFilter);
    roomFilter.connect(this.roomGain);
    this.roomGain.connect(this.master);

    // --- wind: pink noise through a slowly wandering bandpass
    this.wind = new Tone.Noise('pink');
    this.windFilter = new Tone.Filter({ frequency: 480, type: 'bandpass', Q: 1.6 });
    this.windGain = new Tone.Gain(0);
    this.wind.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.master);
    this.windLfo = new Tone.LFO({ frequency: 0.035, min: 260, max: 820 });
    this.windLfo.connect(this.windFilter.frequency);

    // --- sub drone: two barely-detuned sines
    this.subOscA = new Tone.Oscillator('C2', 'sine');
    this.subOscB = new Tone.Oscillator('C2', 'sine');
    this.subOscB.detune.value = 5;
    this.subGain = new Tone.Gain(0);
    this.subOscA.connect(this.subGain);
    this.subOscB.connect(this.subGain);
    this.subGain.connect(this.master);

    // --- water drips: tiny membrane plinks, mostly reverb
    this.drip = new Tone.MembraneSynth({
      pitchDecay: 0.025,
      octaves: 2.5,
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.1 },
      volume: -18,
    });
    this.dripGain = new Tone.Gain(0);
    this.drip.connect(this.dripGain);
    this.dripGain.connect(this.master);
    this.dripGain.connect(this.send(0.5));

    // --- distant bell
    this.bell = new Tone.FMSynth({
      harmonicity: 2.01,
      modulationIndex: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.004, decay: 2.5, sustain: 0, release: 6 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.002, decay: 1.2, sustain: 0, release: 4 },
      volume: -20,
    });
    this.bellGain = new Tone.Gain(0);
    this.bell.connect(this.bellGain);
    this.bellGain.connect(this.master);
    this.bellGain.connect(this.send(0.8));

    // --- insects (tea house): tiny high chirps
    this.chirp = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.025, sustain: 0, release: 0.01 },
      volume: -26,
    });
    this.chirpGain = new Tone.Gain(0);
    const chirpFilter = new Tone.Filter(5200, 'bandpass');
    this.chirp.connect(chirpFilter);
    chirpFilter.connect(this.chirpGain);
    this.chirpGain.connect(this.master);

    // --- harmonic pad: slow chords that bloom as the garden warms
    this.pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 4.5, decay: 3, sustain: 0.5, release: 9 },
      volume: -14,
    });
    this.padGain = new Tone.Gain(0);
    this.pad.connect(this.padGain);
    this.padGain.connect(this.master);
    this.padGain.connect(this.send(0.7));

    // --- garden melody: sparse notes that appear as the spirits wake
    this.melody = new Tone.FMSynth({
      harmonicity: 1.005,
      modulationIndex: 3.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.4, decay: 1.4, sustain: 0.1, release: 3 },
      modulationEnvelope: { attack: 0.3, decay: 0.8, sustain: 0, release: 2 },
      volume: -13,
    });
    this.melodyGain = new Tone.Gain(0);
    this.melody.connect(this.melodyGain);
    this.melodyGain.connect(this.master);
    this.melodyGain.connect(this.send(0.8));
  }

  /** create a send gain into the shared reverb */
  send(level: number): Tone.Gain {
    const g = new Tone.Gain(level);
    g.connect(this.reverb);
    return g;
  }

  async start(preset: Soundscape) {
    if (this.started) return;
    this.started = true;
    await Tone.start();
    await this.reverb.ready;

    this.roomNoise.start();
    this.wind.start();
    this.subOscA.start();
    this.subOscB.start();
    this.windLfo.start();

    const transport = Tone.getTransport();
    transport.start();

    // ambient event scheduling — probabilities scale with garden density
    new Tone.Loop((time) => {
      const p = this.preset;
      const density = this.state?.density ?? 0.2;
      if (Math.random() < 0.28 * (0.4 + density) && p.ambient.water > 0.01) {
        const midi = 84 + Math.floor(Math.random() * 14);
        this.drip.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), 0.05, time, 0.3 + Math.random() * 0.5);
      }
    }, '4n').start(0);

    new Tone.Loop((time) => {
      const p = this.preset;
      const density = this.state?.density ?? 0.2;
      if (Math.random() < 0.16 * (0.5 + density) && p.ambient.bell > 0.01) {
        this.bell.harmonicity.value = p.bellHarmonicity;
        this.bell.triggerAttackRelease(this.note(Math.floor(Math.random() * 3) + 3, 1), 4, time, 0.25 + Math.random() * 0.3);
      }
    }, '2m').start('1m');

    // slow chord cycle — inaudible until touch earns warmth
    const CHORDS = [
      [0, 2, 4],
      [1, 3, 5],
      [0, 3, 5],
      [2, 4, 6],
    ];
    new Tone.Loop((time) => {
      const warmth = this.state?.warmth ?? 0.3;
      const chord = CHORDS[this.chordStep % CHORDS.length];
      this.chordStep++;
      const vel = 0.25 + warmth * 0.4;
      chord.forEach((deg, i) => {
        this.pad.triggerAttackRelease(this.note(deg, i === 0 ? -1 : 0), 7, time + i * 0.9, vel * (i === 0 ? 1 : 0.75));
      });
    }, '4m').start('2m');

    // sparse melody notes, more likely (and braver) as the garden wakes
    new Tone.Loop((time) => {
      const p = this.state;
      if (!p) return;
      const chance = 0.08 + p.warmth * 0.35 + p.wakefulness * 0.2;
      if (Math.random() > chance) return;
      const deg = Math.floor(Math.random() * 6) + (Math.random() < p.brightness ? 3 : 0);
      this.melody.triggerAttackRelease(this.note(deg, 0), 1.8, time, 0.12 + p.warmth * 0.3);
    }, '2n.').start('1m');

    new Tone.Loop((time) => {
      const p = this.preset;
      if (p.ambient.insects > 0.01 && Math.random() < 0.2) {
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          this.chirp.triggerAttackRelease(0.02, time + i * (0.04 + Math.random() * 0.02), 0.4);
        }
      }
    }, '2n').start(0);

    this.setSoundscape(preset, true);
  }

  setSoundscape(preset: Soundscape, immediate = false) {
    this.preset = preset;
    const t = immediate ? 0.5 : 2.5;

    this.roomGain.gain.rampTo(0.032 * preset.ambient.room, t);
    this.windGain.gain.rampTo(0.05 * preset.ambient.wind, t);
    this.subGain.gain.rampTo(0.055 * preset.ambient.sub, t);
    this.dripGain.gain.rampTo(0.5 * preset.ambient.water, t);
    this.bellGain.gain.rampTo(0.5 * preset.ambient.bell, t);
    this.chirpGain.gain.rampTo(0.5 * preset.ambient.insects, t);

    const rootHz = Tone.Frequency(preset.root).toFrequency();
    this.subOscA.frequency.rampTo(rootHz, t);
    this.subOscB.frequency.rampTo(rootHz * 1.5, t); // quiet fifth above
    // age = memory-like wobble
    this.subOscB.detune.rampTo(5 + preset.age * 14, t);

    this.reverb.decay = preset.reverb.decay;
    void this.reverb.generate();
    this.reverbNorm.gain.rampTo(0.4 / Math.sqrt(preset.reverb.decay), t);

    Tone.getTransport().bpm.rampTo(preset.tempo, t);
  }

  /** called ~10x/sec with the current garden state */
  applyState(p: GardenParams) {
    this.state = p;
    const preset = this.preset;
    if (!preset) return;

    const bright = 0.55 * preset.brightness + 0.45 * p.brightness;
    let cutoff = 700 + 4200 * bright;
    cutoff *= 1.12 - 0.35 * p.calm; // calm darkens and softens
    this.toneFilter.frequency.rampTo(Math.max(500, cutoff), 0.4);

    const wet = Math.min(0.7, preset.reverb.wet + p.warmth * 0.18 + p.calm * 0.06);
    this.reverbReturn.gain.rampTo(wet, 0.6);

    this.subGain.gain.rampTo(0.055 * preset.ambient.sub * (0.55 + 0.9 * p.warmth), 0.8);
    this.windGain.gain.rampTo(0.05 * preset.ambient.wind * (0.6 + 0.7 * p.wakefulness), 1.2);

    // the garden's music grows out of sustained, gentle attention
    const padLevel = 0.35 * Math.pow(p.warmth, 1.4) * (0.45 + 0.8 * p.density);
    this.padGain.gain.rampTo(padLevel, 1.2);
    const melodyLevel = 0.3 * (0.25 + 0.75 * p.wakefulness) * (0.3 + 0.9 * p.warmth);
    this.melodyGain.gain.rampTo(melodyLevel, 1);
  }

  /** pick a pitch from the active scale; degree wraps, octaveShift transposes */
  note(degree: number, octaveShift = 0): string {
    const s = this.preset.scale;
    const len = s.length;
    const idx = ((degree % len) + len) % len;
    const extra = Math.floor(degree / len);
    return Tone.Frequency(s[idx]).transpose(12 * (octaveShift + extra)).toNote();
  }

  randNote(octaveShift = 0, maxDegree = 6): string {
    return this.note(Math.floor(Math.random() * maxDegree), octaveShift);
  }
}

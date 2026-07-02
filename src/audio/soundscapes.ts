/**
 * Five soundscape directions from the brief, expressed as parameter sets
 * over one shared engine so the artist can A/B emotional territories.
 */

export interface Soundscape {
  id: string;
  name: string;
  hint: string;
  /** shared pitch set; voices transpose into their own registers */
  scale: string[];
  root: string;
  reverb: { decay: number; wet: number };
  /** 0–1 mix levels for the ambient bed layers */
  ambient: {
    room: number;
    wind: number;
    water: number;
    bell: number;
    sub: number;
    insects: number;
  };
  /** 0–1, opens the master tone filter */
  brightness: number;
  /** bpm for the quiet transport pulse (trickster rhythm, water timing) */
  tempo: number;
  bellHarmonicity: number;
  /** 0–1, adds wobble/degradation for the ancestral feel */
  age: number;
}

export const SOUNDSCAPES: Soundscape[] = [
  {
    id: 'moss-temple',
    name: 'moss temple',
    hint: 'quiet, sacred, meditative',
    scale: ['Db4', 'Eb4', 'Gb4', 'Ab4', 'Bb4', 'Db5'],
    root: 'Db2',
    reverb: { decay: 14, wet: 0.55 },
    ambient: { room: 0.5, wind: 0.35, water: 0.3, bell: 0.35, sub: 0.5, insects: 0 },
    brightness: 0.35,
    tempo: 54,
    bellHarmonicity: 2.01,
    age: 0.1,
  },
  {
    id: 'ceramic-spirits',
    name: 'ceramic spirits',
    hint: 'gentle, creature-like, intimate',
    scale: ['E4', 'F#4', 'A4', 'B4', 'C#5', 'E5'],
    root: 'E2',
    reverb: { decay: 7, wet: 0.4 },
    ambient: { room: 0.4, wind: 0.2, water: 0.15, bell: 0.2, sub: 0.35, insects: 0 },
    brightness: 0.5,
    tempo: 66,
    bellHarmonicity: 3.05,
    age: 0.05,
  },
  {
    id: 'raked-sand',
    name: 'raked sand',
    hint: 'tactile, rhythmic, subtle',
    scale: ['D4', 'E4', 'G4', 'A4', 'C5', 'D5'],
    root: 'D2',
    reverb: { decay: 4.5, wet: 0.28 },
    ambient: { room: 0.45, wind: 0.15, water: 0.1, bell: 0.1, sub: 0.4, insects: 0 },
    brightness: 0.45,
    tempo: 72,
    bellHarmonicity: 4.5,
    age: 0.08,
  },
  {
    id: 'ancestral-garden',
    name: 'ancestral garden',
    hint: 'emotional, memory-like, mysterious',
    scale: ['C4', 'D4', 'Eb4', 'G4', 'Ab4', 'C5'],
    root: 'C2',
    reverb: { decay: 11, wet: 0.5 },
    ambient: { room: 0.55, wind: 0.5, water: 0.12, bell: 0.28, sub: 0.55, insects: 0 },
    brightness: 0.28,
    tempo: 48,
    bellHarmonicity: 2.4,
    age: 0.6,
  },
  {
    id: 'tea-house',
    name: 'tea house at dusk',
    hint: 'warm, human, quiet, inviting',
    scale: ['G4', 'A4', 'B4', 'D5', 'E5', 'G5'],
    root: 'G2',
    reverb: { decay: 5.5, wet: 0.32 },
    ambient: { room: 0.5, wind: 0.12, water: 0.45, bell: 0.15, sub: 0.3, insects: 0.35 },
    brightness: 0.55,
    tempo: 60,
    bellHarmonicity: 2.99,
    age: 0.12,
  },
];

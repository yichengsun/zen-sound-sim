/**
 * GestureEvent mirrors the contact-mic data schema from the brief.
 * The mouse layer (input/gestures.ts) produces these; a future hardware
 * layer would translate contact-mic analysis into the same fields.
 */

export type SculptureId = 'vessel' | 'guardian' | 'trickster' | 'garden';

export type ZoneId =
  | 'head'
  | 'face'
  | 'ear'
  | 'belly'
  | 'body'
  | 'sand';

export type GestureType =
  | 'tap'
  | 'rapid_tap'
  | 'press_start'
  | 'press_update'
  | 'press_end'
  | 'caress'
  | 'hug_start'
  | 'hug_end'
  | 'proximity';

export interface GestureEvent {
  sculptureId: SculptureId;
  zoneId: ZoneId;
  gestureType: GestureType;
  /** 0–1, touch strength (tap sharpness / press weight) */
  intensity: number;
  /** 0–1, normalized movement speed (caress) */
  speed: number;
  /** seconds of continuous contact so far */
  duration: number;
  /** taps per second in the recent window */
  tapRate: number;
  /** 0–1, how continuous recent contact has been */
  contactContinuity: number;
  /** 0–1, higher = touch nearer the top of the sculpture */
  brightness: number;
  /** 0–1, jitter/scratchiness of movement */
  roughness: number;
  /** ms epoch */
  timestamp: number;
  /** screen position, for visual feedback only */
  x: number;
  y: number;
}

export type GestureListener = (ev: GestureEvent) => void;

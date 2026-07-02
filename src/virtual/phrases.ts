import type { GestureEvent, GestureType, SculptureId, ZoneId } from '../events';
import { HUG_MS } from '../gestureTiming';

/**
 * A phrase authors gesture intent directly as a timed GestureEvent
 * stream — the same shape the real pointer-driven engine produces,
 * but built from "what a visitor decided to do" rather than raw
 * mousedown/move/up. Virtual visitors bypass the pointer GestureEngine
 * entirely (it only tracks one contact at a time; several visitors need
 * independent concurrent contacts), and emit straight into the same
 * onGesture routing the real cursor uses.
 */

export interface PhraseContext {
  sculptureId: SculptureId;
  emit: (ev: GestureEvent) => void;
  /** current screen position of a zone, or null if it doesn't exist here */
  zonePos: (zone: ZoneId) => { x: number; y: number } | null;
  signal: AbortSignal;
}

export type PhraseFn = (ctx: PhraseContext) => Promise<void>;

export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('aborted', 'AbortError'));
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new DOMException('aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}

function baseEvent(
  ctx: PhraseContext,
  zone: ZoneId,
  type: GestureType,
  extra: Partial<GestureEvent> = {}
): GestureEvent {
  const pos = ctx.zonePos(zone) ?? { x: innerWidth / 2, y: innerHeight / 2 };
  return {
    sculptureId: ctx.sculptureId,
    zoneId: zone,
    gestureType: type,
    intensity: 0.5,
    speed: 0,
    duration: 0,
    tapRate: 0,
    contactContinuity: 0,
    brightness: 0.5,
    roughness: 0.05,
    timestamp: Date.now(),
    x: pos.x,
    y: pos.y,
    ...extra,
  };
}

/** one or more taps in a zone, with humanized gaps and real rapid-tap windowing */
export function tapRun(
  zone: ZoneId,
  count: number,
  opts: { intensity?: number; gapMs?: [number, number] } = {}
): PhraseFn {
  const [gapMin, gapMax] = opts.gapMs ?? [110, 240];
  return async (ctx) => {
    const times: number[] = [];
    for (let i = 0; i < count; i++) {
      if (ctx.signal.aborted) return;
      const now = Date.now();
      times.push(now);
      while (times.length && now - times[0] > 1600) times.shift();
      const rapid = times.length >= 3;
      ctx.emit(
        baseEvent(ctx, zone, rapid ? 'rapid_tap' : 'tap', {
          intensity: opts.intensity ?? 0.4 + Math.random() * 0.35,
          tapRate: times.length / 1.6,
          contactContinuity: Math.min(1, times.length * 0.15),
          brightness: 0.4 + Math.random() * 0.4,
        })
      );
      if (i < count - 1) await sleep(gapMin + Math.random() * (gapMax - gapMin), ctx.signal);
    }
  };
}

/** a press that grows into a hug if held long enough, exactly like real contact */
export function hold(zone: ZoneId, seconds: number, opts: { intensity?: number } = {}): PhraseFn {
  const intensity = opts.intensity ?? 0.55;
  return async (ctx) => {
    ctx.emit(baseEvent(ctx, zone, 'press_start', { intensity, contactContinuity: 0.3 }));
    const start = Date.now();
    let hugging = false;
    try {
      while (true) {
        await sleep(250, ctx.signal);
        const dur = (Date.now() - start) / 1000;
        if (!hugging && dur * 1000 >= HUG_MS) {
          hugging = true;
          ctx.emit(baseEvent(ctx, zone, 'hug_start', { duration: dur, intensity: 0.8, contactContinuity: 0.8 }));
        } else if (!hugging) {
          ctx.emit(
            baseEvent(ctx, zone, 'press_update', {
              duration: dur,
              intensity,
              contactContinuity: Math.min(1, dur / 4),
            })
          );
        }
        if (dur >= seconds) break;
      }
    } finally {
      const dur = (Date.now() - start) / 1000;
      ctx.emit(baseEvent(ctx, zone, hugging ? 'hug_end' : 'press_end', { duration: dur }));
    }
  };
}

/** a slow drag between zones, sampled the way a moving cursor would be */
export function caress(path: ZoneId[], seconds: number, opts: { speed?: number } = {}): PhraseFn {
  const speed = opts.speed ?? 0.2 + Math.random() * 0.3;
  const stepMs = 80;
  return async (ctx) => {
    const start = Date.now();
    const totalSteps = Math.max(2, Math.round((seconds * 1000) / stepMs));
    for (let i = 0; i <= totalSteps; i++) {
      if (ctx.signal.aborted) return;
      const t = i / totalSteps;
      const segF = t * (path.length - 1);
      const segIdx = Math.min(path.length - 2, Math.floor(segF));
      const localT = segF - segIdx;
      const zoneA = path[segIdx];
      const zoneB = path[segIdx + 1] ?? zoneA;
      const posA = ctx.zonePos(zoneA);
      const posB = ctx.zonePos(zoneB) ?? posA;
      if (!posA) return;
      const x = posA.x + ((posB?.x ?? posA.x) - posA.x) * localT;
      const y = posA.y + ((posB?.y ?? posA.y) - posA.y) * localT;
      const dur = (Date.now() - start) / 1000;
      ctx.emit({
        sculptureId: ctx.sculptureId,
        zoneId: localT < 0.5 ? zoneA : zoneB,
        gestureType: 'caress',
        intensity: 0.3 + speed * 0.4,
        speed,
        duration: dur,
        tapRate: 0,
        contactContinuity: Math.min(1, dur / 3),
        brightness: 0.4 + Math.random() * 0.3,
        roughness: 0.05 + Math.random() * 0.05,
        timestamp: Date.now(),
        x,
        y,
      });
      await sleep(stepMs, ctx.signal);
    }
  };
}

/** a generic reply to something the real visitor just did nearby */
export function echoPhrase(gestureType: GestureType, zones: ZoneId[]): PhraseFn {
  const zone = zones.includes('body') ? 'body' : zones[0];
  if (gestureType === 'hug_start') return hold(zone, 3 + Math.random() * 2, { intensity: 0.6 });
  if (gestureType === 'rapid_tap') return tapRun(zone, 3, { intensity: 0.5, gapMs: [90, 170] });
  return tapRun(zone, 1, { intensity: 0.5 });
}

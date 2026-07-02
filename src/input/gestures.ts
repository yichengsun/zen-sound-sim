import type { GestureEvent, GestureListener, GestureType, SculptureId, ZoneId } from '../events';
import type { SceneHandle } from '../visuals/scene';
import { PRESS_MS, HUG_MS, MOVE_THRESHOLD, TAP_WINDOW_MS, RAPID_COUNT } from '../gestureTiming';

/**
 * Translates mouse/trackpad input into the contact-mic-shaped event model.
 * In the installation this whole file is replaced by contact-mic analysis;
 * everything downstream stays identical.
 */

interface Contact {
  sculpture: SculptureId;
  zone: ZoneId;
  x0: number;
  y0: number;
  t0: number;
  lastX: number;
  lastY: number;
  lastT: number;
  lastAngle: number | null;
  jitter: number;
  travelled: number;
  mode: 'pending' | 'press' | 'hug' | 'caress';
  groupRect: DOMRect;
  pressTimer?: number;
  pressInterval?: number;
  hugTimer?: number;
  lastCaressEmit: number;
}

export class GestureEngine {
  private contact: Contact | null = null;
  private tapTimes = new Map<SculptureId, number[]>();
  private hoverStart = new Map<SculptureId, number>();
  private lastInvite = new Map<SculptureId, number>();
  private enabled = false;

  constructor(
    private svg: SVGSVGElement,
    private scene: SceneHandle,
    private emit: GestureListener
  ) {
    svg.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', (e) => this.move(e));
    window.addEventListener('pointerup', (e) => this.up(e));
    window.addEventListener('blur', () => this.cancel());
  }

  start() {
    this.enabled = true;
  }

  private zoneAt(el: Element | null): { sculpture: SculptureId; zone: ZoneId; group: Element } | null {
    const zoneEl = el?.closest('[data-zone]');
    if (!zoneEl) return null;
    const group = zoneEl.closest('[data-sculpture]');
    if (!group) return null;
    return {
      sculpture: group.getAttribute('data-sculpture') as SculptureId,
      zone: zoneEl.getAttribute('data-zone') as ZoneId,
      group,
    };
  }

  private makeEvent(
    type: GestureType,
    c: Pick<Contact, 'sculpture' | 'zone'>,
    x: number,
    y: number,
    extra: Partial<GestureEvent> = {}
  ): GestureEvent {
    return {
      sculptureId: c.sculpture,
      zoneId: c.zone,
      gestureType: type,
      intensity: 0.5,
      speed: 0,
      duration: 0,
      tapRate: 0,
      contactContinuity: 0,
      brightness: 0.5,
      roughness: 0,
      timestamp: Date.now(),
      x,
      y,
      ...extra,
    };
  }

  private brightnessAt(y: number, rect: DOMRect): number {
    if (rect.height <= 0) return 0.5;
    return Math.min(1, Math.max(0, 1 - (y - rect.top) / rect.height));
  }

  private down(e: PointerEvent) {
    if (!this.enabled) return;
    const hit = this.zoneAt(e.target as Element);
    if (!hit) return;
    const now = performance.now();
    const c: Contact = {
      sculpture: hit.sculpture,
      zone: hit.zone,
      x0: e.clientX,
      y0: e.clientY,
      t0: now,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: now,
      lastAngle: null,
      jitter: 0,
      travelled: 0,
      mode: 'pending',
      groupRect: hit.group.getBoundingClientRect(),
      lastCaressEmit: 0,
    };
    this.contact = c;

    if (c.sculpture === 'garden') return; // sand only taps/brushes

    c.pressTimer = window.setTimeout(() => {
      if (this.contact !== c || c.mode !== 'pending') return;
      c.mode = 'press';
      this.emit(
        this.makeEvent('press_start', c, c.lastX, c.lastY, {
          intensity: 0.6,
          brightness: this.brightnessAt(c.lastY, c.groupRect),
          contactContinuity: 0.3,
        })
      );
      c.pressInterval = window.setInterval(() => {
        if (this.contact !== c) return;
        const duration = (performance.now() - c.t0) / 1000;
        this.emit(
          this.makeEvent('press_update', c, c.lastX, c.lastY, {
            duration,
            intensity: 0.6,
            contactContinuity: Math.min(1, duration / 4),
            brightness: this.brightnessAt(c.lastY, c.groupRect),
          })
        );
      }, 250);
      c.hugTimer = window.setTimeout(() => {
        if (this.contact !== c || c.mode !== 'press') return;
        c.mode = 'hug';
        this.emit(
          this.makeEvent('hug_start', c, c.lastX, c.lastY, {
            duration: HUG_MS / 1000,
            intensity: 0.8,
            contactContinuity: 0.8,
          })
        );
      }, HUG_MS - PRESS_MS);
    }, PRESS_MS);
  }

  private move(e: PointerEvent) {
    if (!this.enabled) return;
    const c = this.contact;
    const now = performance.now();

    if (!c) {
      this.trackProximity(e, now);
      return;
    }

    const dx = e.clientX - c.lastX;
    const dy = e.clientY - c.lastY;
    const step = Math.hypot(dx, dy);
    c.travelled += step;

    // direction jitter → roughness
    if (step > 2) {
      const angle = Math.atan2(dy, dx);
      if (c.lastAngle !== null) {
        let d = Math.abs(angle - c.lastAngle);
        if (d > Math.PI) d = 2 * Math.PI - d;
        c.jitter = c.jitter * 0.85 + (d / Math.PI) * 0.15;
      }
      c.lastAngle = angle;
    }

    if (c.mode !== 'caress' && c.travelled > MOVE_THRESHOLD) {
      if (c.mode === 'press' || c.mode === 'hug') {
        this.emit(this.makeEvent(c.mode === 'hug' ? 'hug_end' : 'press_end', c, e.clientX, e.clientY));
      }
      this.clearTimers(c);
      c.mode = 'caress';
    }

    if (c.mode === 'caress' && c.sculpture !== 'garden' && now - c.lastCaressEmit > 40) {
      c.lastCaressEmit = now;
      const dt = Math.max(8, now - c.lastT);
      const speed = Math.min(1, (step / dt) * 1.6); // ~px/ms → 0-1
      // zone under the moving pointer (it may cross ears, face, body)
      const under = this.zoneAt(document.elementFromPoint(e.clientX, e.clientY));
      this.emit(
        this.makeEvent('caress', c, e.clientX, e.clientY, {
          zoneId: under && under.sculpture === c.sculpture ? under.zone : c.zone,
          speed,
          duration: (now - c.t0) / 1000,
          intensity: 0.3 + speed * 0.4,
          brightness: this.brightnessAt(e.clientY, c.groupRect),
          roughness: Math.min(1, c.jitter * 2),
          contactContinuity: Math.min(1, (now - c.t0) / 3000),
        })
      );
    }

    c.lastX = e.clientX;
    c.lastY = e.clientY;
    c.lastT = now;
  }

  private up(e: PointerEvent) {
    if (!this.enabled) return;
    const c = this.contact;
    if (!c) return;
    this.contact = null;
    this.clearTimers(c);
    const now = performance.now();
    const duration = (now - c.t0) / 1000;

    if (c.mode === 'pending') {
      // it's a tap — sharper (shorter) presses read as stronger
      const times = this.tapTimes.get(c.sculpture) ?? [];
      times.push(now);
      while (times.length && now - times[0] > TAP_WINDOW_MS) times.shift();
      this.tapTimes.set(c.sculpture, times);
      const tapRate = times.length / (TAP_WINDOW_MS / 1000);
      const rapid = times.length >= RAPID_COUNT;
      this.emit(
        this.makeEvent(rapid ? 'rapid_tap' : 'tap', c, e.clientX, e.clientY, {
          intensity: Math.min(1, Math.max(0.35, 1 - duration / 0.3)),
          duration,
          tapRate,
          contactContinuity: Math.min(1, times.length * 0.15),
          brightness: this.brightnessAt(c.y0, c.groupRect),
        })
      );
    } else if (c.mode === 'press') {
      this.emit(this.makeEvent('press_end', c, e.clientX, e.clientY, { duration }));
    } else if (c.mode === 'hug') {
      this.emit(this.makeEvent('hug_end', c, e.clientX, e.clientY, { duration }));
    }
  }

  private cancel() {
    if (this.contact) {
      const c = this.contact;
      this.contact = null;
      this.clearTimers(c);
      if (c.mode === 'press') this.emit(this.makeEvent('press_end', c, c.lastX, c.lastY));
      if (c.mode === 'hug') this.emit(this.makeEvent('hug_end', c, c.lastX, c.lastY));
    }
  }

  private clearTimers(c: Contact) {
    window.clearTimeout(c.pressTimer);
    window.clearTimeout(c.hugTimer);
    window.clearInterval(c.pressInterval);
  }

  /** lingering near a spirit without touching → a small invitation */
  private trackProximity(e: PointerEvent, now: number) {
    for (const id of ['vessel', 'guardian', 'trickster'] as const) {
      const a = this.scene.anchor(id);
      const d = Math.hypot(e.clientX - a.x, e.clientY - a.y);
      if (d < 150) {
        if (!this.hoverStart.has(id)) this.hoverStart.set(id, now);
        const hovered = now - (this.hoverStart.get(id) ?? now);
        const last = this.lastInvite.get(id) ?? -Infinity;
        if (hovered > 1400 && now - last > 12000) {
          this.lastInvite.set(id, now);
          this.emit(
            this.makeEvent('proximity', { sculpture: id, zone: 'body' }, a.x, a.y, {
              intensity: 0.2,
            })
          );
        }
      } else {
        this.hoverStart.delete(id);
      }
    }
  }
}

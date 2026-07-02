import type { GestureEvent, GestureType, SculptureId } from '../events';
import type { SceneHandle } from '../visuals/scene';
import { PERSONALITY_IDS, Visitor, type SculptureAssignment, type VisitorPersonality } from './visitor';

const SCULPTURES: SculptureId[] = ['vessel', 'guardian', 'trickster'];
/** two visitors can share a sculpture (opposite sides), so the cap is 3 sculptures × 2 */
const SLOTS_PER_SCULPTURE = 2;
export const MAX_VISITORS = SCULPTURES.length * SLOTS_PER_SCULPTURE;
const NOTABLE_WINDOW_MS = 6000;
/** ambient auto-populate pacing: mean seconds between arrival checks, and odds of an arrival per check */
const AUTO_CHECK_MS: [number, number] = [9000, 18000];
const AUTO_INVITE_CHANCE = 0.55;

export interface EnsembleDeps {
  scene: SceneHandle;
  /** the same routing function real cursor events go through, tagged by source */
  emitGesture: (ev: GestureEvent, source: 'user' | 'visitor') => void;
  /** fires when the number of simultaneously-held sculptures rises (2, then 3) */
  onCommunion: (activeHolds: number) => void;
}

/**
 * The conductor. Individually, visitors only know how to attend one
 * sculpture; the ensemble is what makes several of them feel like they're
 * sharing a garden rather than colliding in it:
 *  - politeness: visitors hang back while the real visitor is active
 *  - call-and-response: they sometimes echo a real gesture on their own sculpture
 *  - occupancy: up to two visitors per sculpture (opposite sides), and they
 *    prefer sculptures you aren't currently touching
 *  - communion: multiple sculptures held at once is detected and rewarded upstream
 *  - auto-populate: an optional passive mode where the garden invites and
 *    releases visitors on its own, continuously, until toggled off
 */
export class Ensemble {
  visitors: Visitor[] = [];
  autoPopulateActive = false;

  private occupied = new Map<SculptureId, string[]>();
  private activeHolds = new Set<SculptureId>();
  private holdTier = 0;
  private lastRealTouchAny = -Infinity;
  private lastNotable: { sculptureId: SculptureId; gestureType: GestureType; at: number } | null = null;
  private autoTimer: number | undefined;

  constructor(private deps: EnsembleDeps) {}

  /** call for every gesture event, from both the cursor and virtual visitors */
  observe(ev: GestureEvent, source: 'user' | 'visitor') {
    if (source === 'user' && ev.gestureType !== 'proximity') {
      this.lastRealTouchAny = performance.now();
    }
    if (source === 'user' && (ev.gestureType === 'tap' || ev.gestureType === 'rapid_tap' || ev.gestureType === 'hug_start')) {
      this.lastNotable = { sculptureId: ev.sculptureId, gestureType: ev.gestureType, at: performance.now() };
    }

    if (ev.gestureType === 'press_start' || ev.gestureType === 'hug_start') {
      this.activeHolds.add(ev.sculptureId);
    } else if (ev.gestureType === 'press_end' || ev.gestureType === 'hug_end') {
      this.activeHolds.delete(ev.sculptureId);
    }

    const n = this.activeHolds.size;
    if (n >= 2 && n > this.holdTier) this.deps.onCommunion(n);
    this.holdTier = n;
  }

  /** 0 (user very recently active — hold back) .. 1 (garden quiet — feel free) */
  politenessFactor(): number {
    const dt = performance.now() - this.lastRealTouchAny;
    if (dt > 6000) return 1;
    if (dt < 500) return 0.15;
    return 0.15 + 0.85 * (dt / 6000);
  }

  private peekEcho() {
    if (!this.lastNotable) return null;
    if (performance.now() - this.lastNotable.at > NOTABLE_WINDOW_MS) return null;
    return { sculptureId: this.lastNotable.sculptureId, gestureType: this.lastNotable.gestureType };
  }

  private consumeEcho() {
    this.lastNotable = null;
  }

  private requestSculpture(visitor: Visitor): SculptureAssignment | null {
    const free = SCULPTURES.filter((id) => (this.occupied.get(id)?.length ?? 0) < SLOTS_PER_SCULPTURE);
    if (!free.length) return null;

    let pick: SculptureId;
    if (visitor.personality === 'ritual') {
      // the ritual visitor is drawn to whatever is already being held —
      // that's what produces the rare "several sculptures held at once" state
      const heldFree = free.filter((id) => this.activeHolds.has(id));
      pick = heldFree.length ? heldFree[Math.floor(Math.random() * heldFree.length)] : free[Math.floor(Math.random() * free.length)];
    } else {
      // courtesy: prefer a sculpture the real visitor isn't touching right now
      const notHeld = free.filter((id) => !this.activeHolds.has(id));
      const pool = notHeld.length ? notHeld : free;
      pick = pool[Math.floor(Math.random() * pool.length)];
    }
    const occupants = this.occupied.get(pick) ?? [];
    const slot = occupants.length as 0 | 1;
    occupants.push(visitor.id);
    this.occupied.set(pick, occupants);
    return { sculptureId: pick, slot };
  }

  private releaseSculpture(visitor: Visitor) {
    for (const [sculptureId, occupants] of this.occupied) {
      const idx = occupants.indexOf(visitor.id);
      if (idx === -1) continue;
      occupants.splice(idx, 1);
      if (!occupants.length) this.occupied.delete(sculptureId);
      break;
    }
  }

  invite(personality: VisitorPersonality): Visitor | null {
    if (this.visitors.length >= MAX_VISITORS) return null;
    const visitor = new Visitor(personality, {
      scene: this.deps.scene,
      emit: (ev) => this.deps.emitGesture(ev, 'visitor'),
      requestSculpture: (v) => this.requestSculpture(v),
      releaseSculpture: (v) => this.releaseSculpture(v),
      politenessFactor: () => this.politenessFactor(),
      peekEcho: () => this.peekEcho(),
      consumeEcho: () => this.consumeEcho(),
      onRemove: (v) => {
        this.visitors = this.visitors.filter((x) => x !== v);
      },
    });
    this.visitors.push(visitor);
    return visitor;
  }

  dismiss(id: string) {
    this.visitors.find((v) => v.id === id)?.dismiss();
  }

  /**
   * Passive mode: the garden invites and releases visitors on its own,
   * continuously, until this is toggled off. Existing visitors are left
   * alone when turned off — they just finish out their own visit.
   */
  setAutoPopulate(active: boolean) {
    if (active === this.autoPopulateActive) return;
    this.autoPopulateActive = active;
    window.clearTimeout(this.autoTimer);
    this.autoTimer = undefined;
    if (active) this.scheduleAutoTick();
  }

  private scheduleAutoTick() {
    const [min, max] = AUTO_CHECK_MS;
    // politely slower while the real visitor is actively touching something
    const delay = (min + Math.random() * (max - min)) / Math.max(0.35, this.politenessFactor());
    this.autoTimer = window.setTimeout(() => {
      if (!this.autoPopulateActive) return;
      if (this.visitors.length < MAX_VISITORS && Math.random() < AUTO_INVITE_CHANCE) {
        this.invite(PERSONALITY_IDS[Math.floor(Math.random() * PERSONALITY_IDS.length)]);
      }
      this.scheduleAutoTick();
    }, delay);
  }

  tick(dt: number) {
    for (const v of this.visitors) v.tick(dt);
  }
}

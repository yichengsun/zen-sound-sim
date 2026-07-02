import type { SceneHandle } from './scene';
import type { Visitor } from '../virtual/visitor';

interface Rec {
  x: number;
  y: number;
  alpha: number;
  bobPhase: number;
  /** random per-visitor offset so wandering visitors don't move in lockstep */
  wanderSeed: number;
  wanderPhase: number;
}

const TINT: Record<Visitor['personality'], [number, number, number]> = {
  cautious: [200, 210, 205],
  playful: [255, 176, 140],
  meditative: [198, 178, 226],
  childlike: [255, 214, 120],
  ritual: [214, 150, 90],
};

/** which side of its own sculpture each visitor kneels on, so it never drifts toward a neighbor */
const REST_SIDE: Record<'vessel' | 'guardian' | 'trickster', 1 | -1> = {
  trickster: -1,
  guardian: 1,
  vessel: 1,
};

/** how much each personality wanders around its rest spot — speed and reach */
const WANDER: Record<Visitor['personality'], { speed: number; reach: number }> = {
  cautious: { speed: 0.16, reach: 0.6 },
  playful: { speed: 0.42, reach: 1.25 },
  meditative: { speed: 0.2, reach: 0.85 },
  childlike: { speed: 0.58, reach: 1.4 },
  ritual: { speed: 0.14, reach: 0.55 },
};

/**
 * Renders virtual visitors as soft, unshaped presences — no bodies, no
 * faces, just a warm glow that settles near the sculpture it's attending
 * and brightens while it acts. Deliberately abstract: a visible visitor
 * with a body reads as a character, which is exactly the cartoonish
 * territory the brief asks to avoid.
 */
export class Presence {
  private ctx: CanvasRenderingContext2D;
  private recs = new Map<string, Rec>();
  private lastT = 0;

  constructor(canvas: HTMLCanvasElement, private scene: SceneHandle) {
    this.ctx = canvas.getContext('2d')!;
  }

  private spawnPoint(): { x: number; y: number } {
    return { x: innerWidth * (0.42 + Math.random() * 0.16), y: -30 };
  }

  private targetFor(v: Visitor): { x: number; y: number } {
    if (!v.sculptureId || v.sculptureId === 'garden') return this.spawnPoint();
    const a = this.scene.anchor(v.sculptureId);
    const b = this.scene.bounds(v.sculptureId);
    if (!b) return a;
    // proportional to the sculpture's own rendered size, so the visitor sits
    // visibly close beside it at any window size instead of a fixed pixel
    // offset that can land far away (or get clamped to the screen edge).
    // A second visitor at the same sculpture takes the opposite side, at a
    // slightly different height, so two presences never sit on top of each other.
    const preferredSide = REST_SIDE[v.sculptureId];
    const side = v.slot === 0 ? preferredSide : ((-preferredSide) as 1 | -1);
    const x = a.x + side * (b.width * 0.62 + 22);
    const y = a.y + b.height * (v.slot === 0 ? 0.5 : 0.64);
    return {
      x: Math.min(innerWidth - 30, Math.max(30, x)),
      y: Math.min(innerHeight - 30, y),
    };
  }

  frame(t: number, visitors: Visitor[]) {
    const dt = Math.min(0.1, (t - this.lastT) / 1000 || 0.016);
    this.lastT = t;
    const ctx = this.ctx;
    const seen = new Set<string>();

    for (const v of visitors) {
      seen.add(v.id);
      let rec = this.recs.get(v.id);
      if (!rec) {
        const p = this.spawnPoint();
        rec = {
          x: p.x,
          y: p.y,
          alpha: 0,
          bobPhase: Math.random() * Math.PI * 2,
          wanderSeed: Math.random() * Math.PI * 2,
          wanderPhase: 0,
        };
        this.recs.set(v.id, rec);
      }

      const leaving = v.state === 'leaving' || v.state === 'gone';
      const target = leaving ? this.spawnPoint() : this.targetFor(v);
      const ease = v.state === 'arriving' ? 0.5 : leaving ? 0.35 : 1.1;
      rec.x += (target.x - rec.x) * dt * ease;
      rec.y += (target.y - rec.y) * dt * ease;
      rec.bobPhase += dt * 0.85;

      const wantAlpha = leaving ? 0 : 1;
      rec.alpha += (wantAlpha - rec.alpha) * dt * (wantAlpha > rec.alpha ? 0.7 : 0.35);
      if (rec.alpha < 0.008) continue;

      // organic wandering around the rest spot — a lazy Lissajous drift, not
      // a clean circle, so it reads as alive rather than mechanical. Settles
      // out during arrival/departure and eases back while mid-gesture.
      const wandering = v.state === 'attending' || v.state === 'performing' || v.state === 'resting';
      const w = WANDER[v.personality];
      const bSize = v.sculptureId && v.sculptureId !== 'garden' ? this.scene.bounds(v.sculptureId) : null;
      const reachPx = Math.min(46, Math.max(16, (bSize ? Math.min(bSize.width, bSize.height) : 200) * 0.16)) * w.reach;
      const focusDamp = v.state === 'performing' ? 0.45 : 1;
      if (wandering) rec.wanderPhase += dt * w.speed;
      const wx = wandering
        ? (Math.sin(rec.wanderPhase * 0.8 + rec.wanderSeed) * 0.65 +
            Math.sin(rec.wanderPhase * 1.7 + rec.wanderSeed * 2.1) * 0.35) *
          reachPx *
          focusDamp
        : 0;
      const wy = wandering
        ? (Math.sin(rec.wanderPhase * 0.55 + rec.wanderSeed * 1.6) * 0.65 +
            Math.cos(rec.wanderPhase * 1.15 + rec.wanderSeed * 0.7) * 0.35) *
          reachPx *
          0.6 *
          focusDamp
        : 0;

      const bob = Math.sin(rec.bobPhase) * 3.5;
      const [r0, g0, b0] = TINT[v.personality];
      const glow = 0.14 + v.activity * 0.55;
      const radius = 24 + v.activity * 16;
      const cx = rec.x + wx;
      const cy = rec.y + wy + bob;

      if (v.sculptureId && (v.state === 'attending' || v.state === 'performing')) {
        const a = this.scene.anchor(v.sculptureId);
        ctx.strokeStyle = `rgba(${r0}, ${g0}, ${b0}, ${0.09 * rec.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(a.x, a.y);
        ctx.stroke();
      }

      const grad = ctx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius);
      grad.addColorStop(0, `rgba(${r0}, ${g0}, ${b0}, ${(0.5 + glow * 0.35) * rec.alpha})`);
      grad.addColorStop(0.55, `rgba(${r0}, ${g0}, ${b0}, ${0.2 * rec.alpha})`);
      grad.addColorStop(1, `rgba(${r0}, ${g0}, ${b0}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const id of [...this.recs.keys()]) {
      if (!seen.has(id)) this.recs.delete(id);
    }
  }
}

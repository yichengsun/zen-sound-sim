import type { GestureEvent, SculptureId } from '../events';
import type { GardenParams } from '../state/garden';
import type { SceneHandle } from './scene';

interface Ripple {
  x: number;
  y: number;
  r: number;
  max: number;
  alpha: number;
  color: string;
  width: number;
}

interface Mote {
  x: number;
  y: number;
  vy: number;
  sway: number;
  phase: number;
  size: number;
}

/** soft luminous dots left along a caress path */
interface TrailDot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
}

/** breathing glow that grows at the touch point while holding */
interface Aura {
  x: number;
  y: number;
  r: number;
  targetR: number;
  alpha: number;
  active: boolean;
  phase: number;
}

/**
 * Restrained visual feedback on a canvas above the SVG:
 * expanding sand-ripple rings, drifting dust motes, and it drives
 * the SVG glows + breathing. No bounce, no cartoon.
 */
export class Feedback {
  private ctx: CanvasRenderingContext2D;
  private ripples: Ripple[] = [];
  private motes: Mote[] = [];
  private trail: TrailDot[] = [];
  private auras = new Map<SculptureId, Aura>();
  private lastTrailPos: { x: number; y: number } | null = null;
  private glow: Record<SculptureId, number> = { vessel: 0, guardian: 0, trickster: 0, garden: 0 };
  private lightWarm: SVGElement | null;
  private lastT = 0;

  constructor(private canvas: HTMLCanvasElement, private scene: SceneHandle) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    for (let i = 0; i < 42; i++) {
      this.motes.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        vy: 4 + Math.random() * 9,
        sway: 6 + Math.random() * 14,
        phase: Math.random() * Math.PI * 2,
        size: 0.6 + Math.random() * 1.5,
      });
    }
    this.lightWarm = document.getElementById('light-warm') as SVGElement | null;
  }

  private resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = innerWidth * dpr;
    this.canvas.height = innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  onGesture(ev: GestureEvent) {
    const sand = ev.sculptureId === 'garden';
    switch (ev.gestureType) {
      case 'tap':
      case 'rapid_tap':
        this.ripples.push({
          x: ev.x,
          y: ev.y,
          r: 4,
          max: sand ? 90 : 55,
          alpha: sand ? 0.4 : 0.38,
          color: sand ? '225, 205, 160' : '255, 222, 150',
          width: sand ? 2.5 : 1.8,
        });
        if (!sand) this.bump(ev.sculptureId, 0.4);
        break;
      case 'press_start':
        this.bump(ev.sculptureId, 0.35);
        this.auras.set(ev.sculptureId, {
          x: ev.x,
          y: ev.y,
          r: 14,
          targetR: 34,
          alpha: 0,
          active: true,
          phase: Math.random() * Math.PI * 2,
        });
        break;
      case 'press_update': {
        this.bump(ev.sculptureId, 0.12);
        const a = this.auras.get(ev.sculptureId);
        if (a) {
          a.active = true;
          a.targetR = 34 + Math.min(90, ev.duration * 16);
        }
        break;
      }
      case 'hug_start': {
        this.bump(ev.sculptureId, 0.85);
        const a = this.auras.get(ev.sculptureId);
        if (a) a.targetR = 150;
        break;
      }
      case 'press_end':
      case 'hug_end': {
        const a = this.auras.get(ev.sculptureId);
        if (a) a.active = false;
        break;
      }
      case 'caress': {
        this.bump(ev.sculptureId, 0.08);
        // luminous dots along the stroke — a visibly different mark than tap rings
        const prevRaw = this.lastTrailPos;
        const prev =
          prevRaw && Math.hypot(prevRaw.x - ev.x, prevRaw.y - ev.y) < 80 ? prevRaw : { x: ev.x, y: ev.y };
        const steps = 2;
        for (let i = 0; i < steps; i++) {
          const t = (i + 1) / steps;
          this.trail.push({
            x: prev.x + (ev.x - prev.x) * t + (Math.random() - 0.5) * 6,
            y: prev.y + (ev.y - prev.y) * t + (Math.random() - 0.5) * 6,
            vx: (ev.x - prev.x) * 0.4,
            vy: (ev.y - prev.y) * 0.4 - 3,
            r: 2.5 + Math.random() * 3.5 + ev.speed * 4,
            alpha: 0.5 + ev.speed * 0.3,
          });
        }
        this.lastTrailPos = { x: ev.x, y: ev.y };
        break;
      }
      case 'proximity':
        this.bump(ev.sculptureId, 0.12);
        break;
      default:
        break;
    }
  }

  private bump(id: SculptureId, amount: number) {
    if (id === 'garden') return;
    this.glow[id] = Math.min(1, this.glow[id] + amount);
  }

  frame(t: number, params: GardenParams) {
    const dt = Math.min(0.1, (t - this.lastT) / 1000 || 0.016);
    this.lastT = t;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // sculpture glows ease down; breathing follows wakefulness
    for (const id of ['vessel', 'guardian', 'trickster'] as const) {
      this.glow[id] *= Math.exp(-dt / 1.6);
      this.scene.setGlow(id, this.glow[id] * 0.9);
    }
    this.scene.breathe(t, params.wakefulness);
    if (this.lightWarm) {
      this.lightWarm.setAttribute('opacity', String(0.28 * params.warmth));
    }

    // hold auras — a warm breathing glow that grows the longer you stay
    for (const [id, a] of this.auras) {
      a.phase += dt * 1.8;
      a.r += (a.targetR - a.r) * dt * 1.4;
      if (a.active) {
        a.alpha = Math.min(0.5, a.alpha + dt * 0.5);
      } else {
        a.alpha -= dt * 0.35;
        if (a.alpha <= 0.01) {
          this.auras.delete(id);
          continue;
        }
      }
      const pulse = 1 + 0.06 * Math.sin(a.phase);
      const r = a.r * pulse;
      const grad = ctx.createRadialGradient(a.x, a.y, r * 0.1, a.x, a.y, r);
      grad.addColorStop(0, `rgba(255, 226, 160, ${a.alpha * 0.55})`);
      grad.addColorStop(0.6, `rgba(255, 200, 120, ${a.alpha * 0.22})`);
      grad.addColorStop(1, 'rgba(255, 200, 120, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // caress trail — luminous dust left by the moving hand
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const d = this.trail[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.alpha *= Math.exp(-dt / 0.85);
      if (d.alpha < 0.015) {
        this.trail.splice(i, 1);
        continue;
      }
      const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 2.4);
      grad.addColorStop(0, `rgba(255, 244, 214, ${d.alpha})`);
      grad.addColorStop(1, 'rgba(255, 244, 214, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.r += (r.max - r.r) * dt * 2.2;
      r.alpha *= Math.exp(-dt / 0.9);
      if (r.alpha < 0.01) {
        this.ripples.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.45, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r.color}, ${r.alpha})`;
      ctx.lineWidth = r.width;
      ctx.stroke();
    }

    // dust motes — more visible as the garden brightens
    const moteAlpha = 0.05 + params.brightness * 0.12;
    ctx.fillStyle = `rgba(235, 218, 180, ${moteAlpha})`;
    for (const m of this.motes) {
      m.y -= m.vy * dt;
      m.phase += dt * 0.4;
      if (m.y < -6) {
        m.y = innerHeight + 6;
        m.x = Math.random() * innerWidth;
      }
      const x = m.x + Math.sin(m.phase) * m.sway;
      ctx.beginPath();
      ctx.arc(x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

import type { GestureEvent, GestureType, SculptureId, ZoneId } from '../events';
import type { SceneHandle } from '../visuals/scene';
import { caress, echoPhrase, hold, sleep, tapRun, type PhraseFn } from './phrases';

export type VisitorPersonality = 'cautious' | 'playful' | 'meditative' | 'childlike' | 'ritual';

export type VisitorState = 'arriving' | 'attending' | 'performing' | 'resting' | 'leaving' | 'gone';

export interface SculptureAssignment {
  sculptureId: SculptureId;
  /** which of the (up to two) spots at this sculpture — lets presence place them on opposite sides */
  slot: 0 | 1;
}

export interface VisitorDeps {
  scene: SceneHandle;
  /** emit a gesture event; the ensemble tags it with source: 'visitor' */
  emit: (ev: GestureEvent) => void;
  requestSculpture: (visitor: Visitor) => SculptureAssignment | null;
  releaseSculpture: (visitor: Visitor) => void;
  politenessFactor: () => number;
  peekEcho: () => { sculptureId: SculptureId; gestureType: GestureType } | null;
  consumeEcho: () => void;
  onRemove: (visitor: Visitor) => void;
}

interface PersonalityConfig {
  label: string;
  /** ms between actions while attending (before politeness scaling) */
  actInterval: [number, number];
  /** ms of quiet rest after a phrase completes */
  restAfter: [number, number];
  /** total ms before the visitor drifts off on its own */
  lifespan: [number, number];
  /** chance to reply to a recent real-visitor gesture instead of its own pick */
  echoChance: number;
  choosePhrase(zones: ZoneId[]): PhraseFn;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickZone(zones: ZoneId[], prefer: ZoneId[]): ZoneId {
  const preferred = prefer.filter((z) => zones.includes(z));
  return preferred.length ? pick(preferred) : pick(zones);
}

function rand([min, max]: [number, number]): number {
  return min + Math.random() * (max - min);
}

export const PERSONALITIES: Record<VisitorPersonality, PersonalityConfig> = {
  cautious: {
    label: 'cautious visitor',
    actInterval: [20000, 40000],
    restAfter: [4000, 9000],
    lifespan: [90000, 150000],
    echoChance: 0.05,
    choosePhrase(zones) {
      const zone = pickZone(zones, ['body', 'belly']);
      return Math.random() < 0.75
        ? tapRun(zone, 1, { intensity: 0.28 + Math.random() * 0.2 })
        : hold(zone, 1.5 + Math.random(), { intensity: 0.32 });
    },
  },
  playful: {
    label: 'playful visitor',
    actInterval: [4000, 10000],
    restAfter: [2000, 5000],
    lifespan: [70000, 120000],
    echoChance: 0.3,
    choosePhrase(zones) {
      const zone = pickZone(zones, ['head', 'face', 'body']);
      const n = 2 + Math.floor(Math.random() * 3);
      return tapRun(zone, n, { intensity: 0.5 + Math.random() * 0.3, gapMs: [90, 180] });
    },
  },
  meditative: {
    label: 'meditative visitor',
    actInterval: [15000, 30000],
    restAfter: [5000, 12000],
    lifespan: [100000, 160000],
    echoChance: 0.1,
    choosePhrase(zones) {
      if (Math.random() < 0.5) {
        const zone = pickZone(zones, ['ear', 'face', 'belly']);
        return hold(zone, 4 + Math.random() * 5, { intensity: 0.5 });
      }
      const from = pickZone(zones, ['ear', 'head']);
      const to = pickZone(zones, ['belly', 'body']);
      return caress([from, to], 3 + Math.random() * 3, { speed: 0.14 + Math.random() * 0.14 });
    },
  },
  childlike: {
    label: 'childlike visitor',
    actInterval: [3000, 8000],
    restAfter: [1500, 4000],
    lifespan: [60000, 100000],
    echoChance: 0.35,
    choosePhrase(zones) {
      if (Math.random() < 0.2) {
        return hold(pickZone(zones, ['belly', 'body']), 0.8 + Math.random() * 0.6, { intensity: 0.4 });
      }
      const zone = pickZone(zones, ['head', 'face', 'ear', 'belly']);
      const n = 1 + Math.floor(Math.random() * 3);
      return tapRun(zone, n, { intensity: 0.45 + Math.random() * 0.35, gapMs: [70, 150] });
    },
  },
  ritual: {
    label: 'ritual visitor',
    actInterval: [12000, 22000],
    restAfter: [6000, 12000],
    lifespan: [90000, 150000],
    echoChance: 0.15,
    choosePhrase(zones) {
      const zone = pickZone(zones, ['belly', 'body']);
      return Math.random() < 0.8
        ? hold(zone, 5 + Math.random() * 6, { intensity: 0.6 })
        : caress([pickZone(zones, ['body']), pickZone(zones, ['belly'])], 3, { speed: 0.2 });
    },
  },
};

export const PERSONALITY_IDS = Object.keys(PERSONALITIES) as VisitorPersonality[];

let idSeq = 0;

/**
 * A virtual visitor: a small lifecycle (arrive → attend/perform/rest,
 * repeating → leave) that emits real GestureEvents, indistinguishable
 * downstream from the mouse. Its only "body" is the soft presence glow
 * rendered by visuals/presence.ts.
 */
export class Visitor {
  readonly id = `visitor-${++idSeq}`;
  readonly personality: VisitorPersonality;
  sculptureId: SculptureId | null = null;
  slot: 0 | 1 = 0;
  state: VisitorState = 'arriving';
  activity = 0;

  private cfg: PersonalityConfig;
  private deps: VisitorDeps;
  private abort = new AbortController();
  private dismissed = false;

  constructor(personality: VisitorPersonality, deps: VisitorDeps) {
    this.personality = personality;
    this.cfg = PERSONALITIES[personality];
    this.deps = deps;
    void this.run();
  }

  get label(): string {
    return this.cfg.label;
  }

  dismiss() {
    this.dismissed = true;
    this.abort.abort();
  }

  /** per-frame decay of the activity glow (drives presence brightness) */
  tick(dt: number) {
    this.activity *= Math.exp(-dt / 0.7);
  }

  private async run() {
    const assignment = this.deps.requestSculpture(this);
    if (!assignment) {
      this.state = 'gone';
      this.deps.onRemove(this);
      return;
    }
    const { sculptureId, slot } = assignment;
    this.sculptureId = sculptureId;
    this.slot = slot;
    this.state = 'arriving';

    try {
      await sleep(1200 + Math.random() * 800, this.abort.signal);
    } catch {
      return this.leave();
    }

    const lifespan = rand(this.cfg.lifespan);
    const born = Date.now();

    while (!this.dismissed && Date.now() - born < lifespan) {
      this.state = 'attending';
      const wait = rand(this.cfg.actInterval) / Math.max(0.15, this.deps.politenessFactor());
      try {
        await sleep(wait, this.abort.signal);
      } catch {
        break;
      }
      if (this.dismissed) break;

      const echo = Math.random() < this.cfg.echoChance ? this.deps.peekEcho() : null;
      const zones = this.deps.scene.zonesOf(sculptureId);
      if (!zones.length) break;

      let phrase: PhraseFn;
      if (echo) {
        this.deps.consumeEcho();
        phrase = echoPhrase(echo.gestureType, zones);
      } else {
        phrase = this.cfg.choosePhrase(zones);
      }

      this.state = 'performing';
      try {
        await phrase({
          sculptureId,
          emit: (ev) => {
            this.activity = Math.min(1, this.activity + (ev.gestureType.includes('hug') ? 0.7 : ev.gestureType === 'caress' ? 0.25 : 0.5));
            this.deps.emit(ev);
          },
          zonePos: (zone) => this.deps.scene.zoneCenter(sculptureId, zone),
          signal: this.abort.signal,
        });
      } catch {
        /* dismissed mid-phrase — the phrase's own cleanup already closed out any open hold */
      }
      if (this.dismissed) break;

      this.state = 'resting';
      try {
        await sleep(rand(this.cfg.restAfter), this.abort.signal);
      } catch {
        break;
      }
    }

    await this.leave();
  }

  private async leave() {
    this.state = 'leaving';
    this.deps.releaseSculpture(this);
    await new Promise((r) => setTimeout(r, 3200));
    this.state = 'gone';
    this.deps.onRemove(this);
  }
}

import type { SculptureId } from './events';
import type { GardenParams } from './state/garden';

interface IdleVoice {
  idleMurmur(intensity: number): void;
}

/**
 * The garden never feels dead: untouched spirits occasionally make
 * tiny sounds — more often the more awake the garden is, never when
 * someone is already touching them.
 */
export class IdleLife {
  private lastMurmur = new Map<SculptureId, number>();
  private timer: number | undefined;

  constructor(
    private voices: Partial<Record<SculptureId, IdleVoice>>,
    private getParams: () => GardenParams,
    private lastTouched: (id: SculptureId) => number
  ) {}

  start() {
    this.timer = window.setInterval(() => this.tick(), 900);
  }

  stop() {
    window.clearInterval(this.timer);
  }

  private tick() {
    const now = performance.now();
    const p = this.getParams();
    for (const id of Object.keys(this.voices) as SculptureId[]) {
      const voice = this.voices[id];
      if (!voice) continue;
      if (now - this.lastTouched(id) < 6000) continue;
      if (now - (this.lastMurmur.get(id) ?? -Infinity) < 5000) continue;
      const chance = 0.025 + p.wakefulness * 0.055;
      if (Math.random() < chance) {
        this.lastMurmur.set(id, now);
        voice.idleMurmur(0.4 + p.wakefulness * 0.5);
      }
    }
  }
}

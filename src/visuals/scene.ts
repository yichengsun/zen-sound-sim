import type { SculptureId, ZoneId } from '../events';
import { VARIANT_DEFS, type SculptureVariant } from './sculptureVariants';

/**
 * The diorama — a soft illustrated dusk interior, drawn as layered SVG.
 * Sculpture groups carry data-sculpture; invisible shapes inside them
 * carry data-zone (ear / face / head / belly / body) for hit-testing.
 */

export interface SceneHandle {
  svg: SVGSVGElement;
  setGlow(id: SculptureId, value: number): void;
  breathe(t: number, wakefulness: number): void;
  /** sculpture anchor point in client coordinates (for canvas feedback) */
  anchor(id: SculptureId): { x: number; y: number };
  /** which zones exist on this sculpture (varies — e.g. the Trickster has no ears) */
  zonesOf(id: SculptureId): ZoneId[];
  /** client-coordinate center of one zone, for virtual visitors to "touch" */
  zoneCenter(id: SculptureId, zone: ZoneId): { x: number; y: number } | null;
  /** the sculpture's own rendered bounding box, for sizing things proportionally to it */
  bounds(id: SculptureId): DOMRect | null;
  /** available sculpture designs for a plinth position (debug-only feature) */
  variantsFor(id: SculptureId): SculptureVariant[];
  /** currently displayed design id for a plinth position */
  currentVariant(id: SculptureId): string;
  /** swap which sculpture design a plinth position shows, live */
  setVariant(id: SculptureId, variantId: string): void;
}

const BREATH = [
  { id: 'trickster', cx: 490, base: 567, speed: 0.00062, phase: 0.8 },
  { id: 'guardian', cx: 805, base: 470, speed: 0.00042, phase: 0 },
  { id: 'vessel', cx: 1105, base: 548, speed: 0.00052, phase: 2.1 },
] as const;

export function buildScene(container: HTMLElement): SceneHandle {
  container.innerHTML = svgMarkup();
  const svg = container.querySelector('svg') as SVGSVGElement;

  const groups: Partial<Record<string, SVGGElement>> = {};
  const glows: Partial<Record<string, SVGElement>> = {};
  for (const s of ['vessel', 'guardian', 'trickster']) {
    groups[s] = svg.querySelector(`#sculpture-${s}`) as SVGGElement;
    glows[s] = svg.querySelector(`#glow-${s}`) as SVGElement;
  }

  const glowLevel: Record<string, number> = { vessel: 0, guardian: 0, trickster: 0 };
  const activeVariant: Partial<Record<SculptureId, string>> = { vessel: 'classic', guardian: 'classic', trickster: 'classic' };

  return {
    svg,
    setGlow(id, value) {
      if (!glows[id]) return;
      glowLevel[id] = value;
      glows[id]!.setAttribute('opacity', String(Math.min(0.85, value)));
    },
    breathe(t, wakefulness) {
      const amp = 0.0025 + wakefulness * 0.0055;
      for (const b of BREATH) {
        const g = groups[b.id];
        if (!g) continue;
        const s = 1 + amp * (0.5 + 0.5 * Math.sin(t * b.speed + b.phase));
        g.setAttribute(
          'transform',
          `translate(${b.cx} ${b.base}) scale(${1 + (s - 1) * 0.4} ${s}) translate(${-b.cx} ${-b.base})`
        );
      }
    },
    anchor(id) {
      const g = groups[id];
      if (!g) return { x: innerWidth / 2, y: innerHeight / 2 };
      const r = g.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height * 0.45 };
    },
    zonesOf(id) {
      const seen = new Set<ZoneId>();
      svg.querySelectorAll(`[data-sculpture="${id}"] [data-zone]`).forEach((el) => {
        seen.add(el.getAttribute('data-zone') as ZoneId);
      });
      return [...seen];
    },
    zoneCenter(id, zone) {
      const els = svg.querySelectorAll(`[data-sculpture="${id}"] [data-zone="${zone}"]`);
      if (!els.length) return null;
      const el = els[Math.floor(Math.random() * els.length)];
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
    bounds(id) {
      const g = groups[id];
      return g ? g.getBoundingClientRect() : null;
    },
    variantsFor(id) {
      return VARIANT_DEFS[id] ?? [];
    },
    currentVariant(id) {
      return activeVariant[id] ?? 'classic';
    },
    setVariant(id, variantId) {
      const g = groups[id];
      const variant = VARIANT_DEFS[id]?.find((v) => v.id === variantId);
      if (!g || !variant) return;
      g.innerHTML = variant.markup;
      activeVariant[id] = variantId;
    },
  };
}

function svgMarkup(): string {
  return /* html */ `
<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b332a"/>
      <stop offset="1" stop-color="#27211a"/>
    </linearGradient>
    <linearGradient id="windowGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#efd0a0"/>
      <stop offset="0.55" stop-color="#dfab72"/>
      <stop offset="1" stop-color="#b87f52"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a3c2e"/>
      <stop offset="1" stop-color="#2e251b"/>
    </linearGradient>
    <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#cbb894"/>
      <stop offset="1" stop-color="#a08c68"/>
    </linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a755b"/>
      <stop offset="1" stop-color="#63523f"/>
    </linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0d2a0" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#f0d2a0" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="guardianSkin" cx="0.5" cy="0.32" r="0.85">
      <stop offset="0" stop-color="#8d6849"/>
      <stop offset="1" stop-color="#573f2d"/>
    </radialGradient>
    <linearGradient id="vesselNeck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7e8d7b"/>
      <stop offset="1" stop-color="#5a6a5d"/>
    </linearGradient>
    <radialGradient id="vesselBelly" cx="0.42" cy="0.34" r="0.9">
      <stop offset="0" stop-color="#e0d7bf"/>
      <stop offset="1" stop-color="#ac9f81"/>
    </radialGradient>
    <linearGradient id="charcoal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a443d"/>
      <stop offset="1" stop-color="#332e29"/>
    </linearGradient>
    <linearGradient id="rust" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b06148"/>
      <stop offset="1" stop-color="#8a4834"/>
    </linearGradient>
    <radialGradient id="glowWarm" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffdf9e" stop-opacity="0.5"/>
      <stop offset="0.6" stop-color="#f8c87e" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#f8c87e" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.46" r="0.72">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#0b0805" stop-opacity="0.55"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.6 0.6 0.6 0 0"/>
    </filter>
    <filter id="softBlur"><feGaussianBlur stdDeviation="6"/></filter>

    <!-- alternate sculpture variant palettes -->
    <radialGradient id="kinTeal" cx="0.4" cy="0.3" r="0.9">
      <stop offset="0" stop-color="#5c7a72"/>
      <stop offset="1" stop-color="#35473f"/>
    </radialGradient>
    <radialGradient id="kinOrangeMid" cx="0.4" cy="0.3" r="0.9">
      <stop offset="0" stop-color="#c96b3f"/>
      <stop offset="1" stop-color="#9c4726"/>
    </radialGradient>
    <radialGradient id="kinOrangeTop" cx="0.4" cy="0.3" r="0.9">
      <stop offset="0" stop-color="#e08a52"/>
      <stop offset="1" stop-color="#b8562f"/>
    </radialGradient>
    <linearGradient id="hornBase" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7a8288"/>
      <stop offset="1" stop-color="#5c646b"/>
    </linearGradient>
    <linearGradient id="hornSkin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a9297"/>
      <stop offset="1" stop-color="#6b7378"/>
    </linearGradient>
    <linearGradient id="wovenBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a3d2e"/>
      <stop offset="1" stop-color="#2e2419"/>
    </linearGradient>
    <linearGradient id="wovenNeck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a4a38"/>
      <stop offset="1" stop-color="#3a2e22"/>
    </linearGradient>
    <radialGradient id="bellDome" cx="0.45" cy="0.3" r="0.9">
      <stop offset="0" stop-color="#6b4f34"/>
      <stop offset="1" stop-color="#3a2618"/>
    </radialGradient>
    <linearGradient id="bellBase" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a85a3a"/>
      <stop offset="1" stop-color="#7a3d24"/>
    </linearGradient>
    <linearGradient id="twineBelly" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d9c7a0"/>
      <stop offset="1" stop-color="#5f6d7a"/>
    </linearGradient>
    <linearGradient id="twineNeck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e0d0a8"/>
      <stop offset="1" stop-color="#c2a67e"/>
    </linearGradient>
    <linearGradient id="bottleDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3f4d47"/>
      <stop offset="1" stop-color="#232d29"/>
    </linearGradient>
    <radialGradient id="bottlePale" cx="0.4" cy="0.3" r="0.9">
      <stop offset="0" stop-color="#e6dfcd"/>
      <stop offset="1" stop-color="#c4bca8"/>
    </radialGradient>
  </defs>

  <!-- ROOM -->
  <rect width="1600" height="640" fill="url(#wall)"/>

  <!-- windows -->
  <g>
    <rect x="120" y="70" width="450" height="460" fill="url(#windowGlow)" opacity="0.92"/>
    <rect x="1030" y="70" width="450" height="460" fill="url(#windowGlow)" opacity="0.88"/>
    <g stroke="#241e16" stroke-width="10">
      <line x1="270" y1="70" x2="270" y2="530"/><line x1="420" y1="70" x2="420" y2="530"/>
      <line x1="120" y1="223" x2="570" y2="223"/><line x1="120" y1="376" x2="570" y2="376"/>
      <line x1="1180" y1="70" x2="1180" y2="530"/><line x1="1330" y1="70" x2="1330" y2="530"/>
      <line x1="1030" y1="223" x2="1480" y2="223"/><line x1="1030" y1="376" x2="1480" y2="376"/>
    </g>
    <rect x="112" y="62" width="466" height="476" fill="none" stroke="#1d1812" stroke-width="14"/>
    <rect x="1022" y="62" width="466" height="476" fill="none" stroke="#1d1812" stroke-width="14"/>
  </g>

  <!-- light beams -->
  <polygon points="140,530 550,530 760,1000 -40,1000" fill="url(#beam)"/>
  <polygon points="1050,530 1460,530 1660,1000 860,1000" fill="url(#beam)"/>

  <!-- pendant lamps -->
  <g>
    <line x1="700" y1="0" x2="700" y2="120" stroke="#191510" stroke-width="3"/>
    <path d="M 684 120 h 32 l -6 26 h -20 Z" fill="#211b14"/>
    <ellipse cx="700" cy="150" rx="9" ry="6" fill="#f2d49e" opacity="0.9" filter="url(#softBlur)"/>
    <line x1="920" y1="0" x2="920" y2="86" stroke="#191510" stroke-width="3"/>
    <path d="M 904 86 h 32 l -6 26 h -20 Z" fill="#211b14"/>
    <ellipse cx="920" cy="116" rx="9" ry="6" fill="#f2d49e" opacity="0.85" filter="url(#softBlur)"/>
  </g>

  <!-- FLOOR -->
  <rect y="620" width="1600" height="380" fill="url(#floor)"/>
  <g stroke="#241c13" stroke-width="2" opacity="0.5">
    <line x1="0" y1="660" x2="1600" y2="660"/>
    <line x1="0" y1="716" x2="1600" y2="716"/>
    <line x1="0" y1="790" x2="1600" y2="790"/>
    <line x1="0" y1="884" x2="1600" y2="884"/>
  </g>

  <!-- SAND BED (touchable) -->
  <g data-sculpture="garden">
    <ellipse cx="800" cy="800" rx="660" ry="168" fill="url(#sand)" data-zone="sand"/>
    <g fill="none" stroke="#93805e" stroke-width="3" opacity="0.55" pointer-events="none">
      <ellipse cx="800" cy="800" rx="612" ry="150"/>
      <ellipse cx="800" cy="800" rx="548" ry="131"/>
      <ellipse cx="800" cy="800" rx="484" ry="112"/>
      <ellipse cx="800" cy="802" rx="420" ry="94"/>
      <ellipse cx="800" cy="804" rx="356" ry="76"/>
    </g>
    <g fill="none" stroke="#b5a27c" stroke-width="2" opacity="0.5" pointer-events="none">
      <ellipse cx="800" cy="797" rx="611" ry="149"/>
      <ellipse cx="800" cy="797" rx="547" ry="130"/>
      <ellipse cx="800" cy="797" rx="483" ry="111"/>
    </g>
  </g>

  <!-- stones -->
  <g pointer-events="none">
    <path d="M 250 830 q 18 -34 58 -30 q 42 4 46 34 q 2 22 -30 26 q -62 8 -74 -30 Z" fill="#7b756a"/>
    <path d="M 300 852 q 30 -18 56 -6 q 22 10 12 26 q -14 18 -48 10 q -30 -8 -20 -30 Z" fill="#8b857a" opacity="0.9"/>
    <path d="M 1290 840 q 12 -30 48 -28 q 40 2 44 30 q 2 24 -34 28 q -56 4 -58 -30 Z" fill="#6f695e"/>
    <path d="M 950 892 q 16 -22 44 -16 q 28 6 22 26 q -8 20 -40 14 q -32 -6 -26 -24 Z" fill="#7b756a" opacity="0.85"/>
  </g>

  <!-- moss -->
  <g pointer-events="none">
    <ellipse cx="452" cy="774" rx="88" ry="26" fill="#4c5a3a"/>
    <ellipse cx="540" cy="782" rx="60" ry="20" fill="#5b6b44"/>
    <ellipse cx="398" cy="786" rx="46" ry="16" fill="#3f4c33"/>
    <ellipse cx="790" cy="756" rx="96" ry="26" fill="#4c5a3a"/>
    <ellipse cx="872" cy="764" rx="56" ry="18" fill="#5b6b44"/>
    <ellipse cx="726" cy="768" rx="48" ry="16" fill="#3f4c33"/>
    <ellipse cx="1096" cy="770" rx="86" ry="24" fill="#4c5a3a"/>
    <ellipse cx="1176" cy="778" rx="52" ry="16" fill="#5b6b44"/>
    <ellipse cx="1032" cy="780" rx="44" ry="14" fill="#3f4c33"/>
    <ellipse cx="640" cy="880" rx="70" ry="18" fill="#46543a" opacity="0.8"/>
    <ellipse cx="1210" cy="866" rx="58" ry="14" fill="#46543a" opacity="0.7"/>
  </g>

  <!-- framing foliage -->
  <g pointer-events="none">
    <ellipse cx="60" cy="900" rx="220" ry="150" fill="#2c3623"/>
    <ellipse cx="150" cy="960" rx="180" ry="110" fill="#37432b"/>
    <ellipse cx="30" cy="760" rx="130" ry="90" fill="#242d1d"/>
    <ellipse cx="1560" cy="920" rx="230" ry="150" fill="#2c3623"/>
    <ellipse cx="1470" cy="980" rx="170" ry="100" fill="#37432b"/>
    <ellipse cx="1580" cy="780" rx="120" ry="86" fill="#242d1d"/>
    <path d="M 1450 700 q 40 -60 120 -70" stroke="#3a3226" stroke-width="7" fill="none"/>
    <ellipse cx="1500" cy="668" rx="46" ry="24" fill="#41502f" opacity="0.9"/>
    <ellipse cx="1556" cy="640" rx="40" ry="20" fill="#37432b" opacity="0.9"/>
  </g>

  <!-- plinth shadows -->
  <g pointer-events="none" fill="#000000" opacity="0.22">
    <ellipse cx="490" cy="774" rx="108" ry="17"/>
    <ellipse cx="805" cy="750" rx="120" ry="18"/>
    <ellipse cx="1105" cy="764" rx="106" ry="16"/>
  </g>

  <!-- warm glows behind sculptures (driven by touch) -->
  <g pointer-events="none">
    <ellipse id="glow-trickster" cx="490" cy="480" rx="150" ry="170" fill="url(#glowWarm)" opacity="0"/>
    <ellipse id="glow-guardian" cx="805" cy="360" rx="180" ry="200" fill="url(#glowWarm)" opacity="0"/>
    <ellipse id="glow-vessel" cx="1105" cy="440" rx="150" ry="180" fill="url(#glowWarm)" opacity="0"/>
  </g>

  <!-- PLINTHS -->
  <g pointer-events="none">
    <!-- trickster plinth: circle-hole speaker -->
    <rect x="415" y="565" width="150" height="205" fill="url(#wood)"/>
    <rect x="415" y="565" width="150" height="6" fill="#9c866a"/>
    <path d="M 438 585 q 6 60 0 175 M 468 575 q -4 80 2 190 M 540 580 q 5 70 -2 185" stroke="#57493a" stroke-width="2" fill="none" opacity="0.6"/>
    <g fill="#2a2119">
      <circle cx="460" cy="640" r="9"/><circle cx="490" cy="640" r="9"/><circle cx="520" cy="640" r="9"/>
      <circle cx="475" cy="664" r="9"/><circle cx="505" cy="664" r="9"/>
      <circle cx="460" cy="688" r="9"/><circle cx="490" cy="688" r="9"/><circle cx="520" cy="688" r="9"/>
      <circle cx="475" cy="712" r="9"/><circle cx="505" cy="712" r="9"/>
    </g>
    <!-- guardian plinth: slot speaker -->
    <rect x="720" y="470" width="170" height="275" fill="url(#wood)"/>
    <rect x="720" y="470" width="170" height="6" fill="#9c866a"/>
    <path d="M 745 490 q 5 100 -2 245 M 785 480 q -4 120 3 258 M 862 486 q 6 110 -3 252" stroke="#57493a" stroke-width="2" fill="none" opacity="0.6"/>
    <g fill="#2a2119">
      <rect x="762" y="560" width="9" height="110" rx="4"/>
      <rect x="780" y="560" width="9" height="110" rx="4"/>
      <rect x="798" y="560" width="9" height="110" rx="4"/>
      <rect x="816" y="560" width="9" height="110" rx="4"/>
      <rect x="834" y="560" width="9" height="110" rx="4"/>
    </g>
    <!-- vessel plinth: dot-grid speaker -->
    <rect x="1030" y="545" width="150" height="215" fill="url(#wood)"/>
    <rect x="1030" y="545" width="150" height="6" fill="#9c866a"/>
    <path d="M 1052 565 q 5 80 -2 190 M 1122 560 q -4 90 3 196" stroke="#57493a" stroke-width="2" fill="none" opacity="0.6"/>
    <g fill="#2a2119">
      ${dotGrid(1054, 618, 8, 6, 15, 3.4)}
    </g>
  </g>

  <!-- SCULPTURES (initial content = the "classic" variant; swappable at runtime via setVariant) -->

  <g id="sculpture-trickster" class="sculpture" data-sculpture="trickster">${classicMarkup('trickster')}</g>
  <g id="sculpture-guardian" class="sculpture" data-sculpture="guardian">${classicMarkup('guardian')}</g>
  <g id="sculpture-vessel" class="sculpture" data-sculpture="vessel">${classicMarkup('vessel')}</g>

  <!-- atmosphere -->
  <rect id="light-warm" width="1600" height="1000" fill="url(#glowWarm)" opacity="0" pointer-events="none"/>
  <rect width="1600" height="1000" fill="url(#vignette)" pointer-events="none"/>
  <rect width="1600" height="1000" filter="url(#grain)" opacity="0.055" pointer-events="none"/>
</svg>`;
}

function classicMarkup(id: SculptureId): string {
  return VARIANT_DEFS[id].find((v) => v.id === 'classic')!.markup;
}

function dotGrid(x0: number, y0: number, cols: number, rows: number, gap: number, r: number): string {
  let out = '';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      out += `<circle cx="${x0 + col * gap}" cy="${y0 + row * gap}" r="${r}"/>`;
    }
  }
  return out;
}

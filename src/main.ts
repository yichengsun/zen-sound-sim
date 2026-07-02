import * as Tone from 'tone';
import { AudioEngine } from './audio/engine';
import { SOUNDSCAPES } from './audio/soundscapes';
import { VesselVoice } from './audio/voices/vessel';
import { GuardianVoice } from './audio/voices/guardian';
import { TricksterVoice } from './audio/voices/trickster';
import { GestureEngine } from './input/gestures';
import { IdleLife } from './idle';
import { GardenState } from './state/garden';
import { buildScene } from './visuals/scene';
import { Feedback } from './visuals/feedback';
import { buildUI } from './ui';
import type { GestureEvent, SculptureId } from './events';

const sceneEl = document.getElementById('scene')!;
const canvas = document.getElementById('feedback') as HTMLCanvasElement;
const uiEl = document.getElementById('ui')!;
const debugEl = document.getElementById('debug')!;
const overlay = document.getElementById('overlay')!;
const enterBtn = document.getElementById('enter') as HTMLButtonElement;

const scene = buildScene(sceneEl);
const state = new GardenState();
const feedback = new Feedback(canvas, scene);
const engine = new AudioEngine();

let voices: Partial<Record<SculptureId, VesselVoice | GuardianVoice | TricksterVoice>> = {};
let sandBrush: Tone.NoiseSynth | null = null;
let lastEvent: GestureEvent | null = null;
const lastTouched = new Map<SculptureId, number>();

// ---------- gesture routing ----------

function onGesture(ev: GestureEvent) {
  lastEvent = ev;
  state.onGesture(ev);
  feedback.onGesture(ev);

  if (ev.gestureType !== 'proximity') {
    lastTouched.set(ev.sculptureId, performance.now());
  }

  if (ev.sculptureId === 'garden') {
    // brushing the raked sand
    if ((ev.gestureType === 'tap' || ev.gestureType === 'rapid_tap') && sandBrush) {
      sandBrush.triggerAttackRelease(0.09, undefined, 0.15 + ev.intensity * 0.2);
    }
    return;
  }

  const voice = voices[ev.sculptureId];
  if (!voice) return;
  if (ev.gestureType === 'proximity') {
    voice.invite();
  } else {
    voice.handle(ev);
  }
}

const gestures = new GestureEngine(scene.svg, scene, onGesture);

// ---------- soundscape UI ----------

let activeScape = SOUNDSCAPES[0];
const ui = buildUI(uiEl, SOUNDSCAPES, (s) => {
  activeScape = s;
  engine.setSoundscape(s);
});
ui.setActive(activeScape.id);

// ---------- entry ----------

enterBtn.addEventListener('click', async () => {
  enterBtn.disabled = true;
  await engine.start(activeScape);

  voices = {
    vessel: new VesselVoice(engine),
    guardian: new GuardianVoice(engine),
    trickster: new TricksterVoice(engine),
  };

  sandBrush = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.015, decay: 0.09, sustain: 0, release: 0.05 },
    volume: -22,
  });
  const sandFilter = new Tone.Filter(3200, 'bandpass');
  sandBrush.connect(sandFilter);
  sandFilter.connect(engine.master);

  const idle = new IdleLife(
    voices,
    () => state.params,
    (id) => lastTouched.get(id) ?? -Infinity
  );
  idle.start();
  gestures.start();

  overlay.classList.add('leaving');
  window.setTimeout(() => overlay.remove(), 2600);
});

// ---------- frame + slow loops ----------

function frame(t: number) {
  state.update();
  feedback.frame(t, state.params);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.setInterval(() => {
  if (engine.preset) engine.applyState(state.params);
  renderDebug();
}, 100);

// ---------- help ----------

const helpEl = document.getElementById('help')!;
document.getElementById('help-btn')!.addEventListener('click', () => helpEl.classList.remove('hidden'));
document.getElementById('help-close')!.addEventListener('click', () => helpEl.classList.add('hidden'));
helpEl.addEventListener('click', (e) => {
  if (e.target === helpEl) helpEl.classList.add('hidden');
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') helpEl.classList.add('hidden');
});

// verification/inspection hook (also handy for the artist's console tinkering)
(window as any).__zen = {
  engine,
  state,
  Tone,
  get voices() {
    return voices;
  },
  get lastEvent() {
    return lastEvent;
  },
};

// ---------- debug view ----------

let debugVisible = false;
window.addEventListener('keydown', (e) => {
  if (e.key === 'd') {
    debugVisible = !debugVisible;
    debugEl.classList.toggle('hidden', !debugVisible);
  }
});

function renderDebug() {
  if (!debugVisible) return;
  const p = state.params;
  const bars = (Object.keys(p) as (keyof typeof p)[])
    .map(
      (k) =>
        `${k.padEnd(12)} <span class="bar" style="width:${Math.round(p[k] * 110)}px"></span> ${p[k].toFixed(2)}`
    )
    .join('\n');
  const ev = lastEvent
    ? [
        `sculpture   ${lastEvent.sculptureId}`,
        `zone        ${lastEvent.zoneId}`,
        `gesture     ${lastEvent.gestureType}`,
        `intensity   ${lastEvent.intensity.toFixed(2)}`,
        `speed       ${lastEvent.speed.toFixed(2)}`,
        `duration    ${lastEvent.duration.toFixed(2)}s`,
        `tap_rate    ${lastEvent.tapRate.toFixed(2)}/s`,
        `continuity  ${lastEvent.contactContinuity.toFixed(2)}`,
        `brightness  ${lastEvent.brightness.toFixed(2)}`,
        `roughness   ${lastEvent.roughness.toFixed(2)}`,
      ].join('\n')
    : '— touch a spirit —';
  debugEl.innerHTML = `<h3>garden state</h3>${bars}\n<h3>last gesture event</h3>${ev}`;
}

# Ceramic Spirits — a tactile zen garden sound sketch

An interactive audio-visual prototype for a tactile ceramic zen garden
installation: three ceramic spirits on speaker-plinths respond to touch with
generative sound. Built as a creative sketching tool to explore interaction
logic, sound personalities, and emotional tone before physical fabrication.

## Run it

```
bun install
bun run dev
```

Open http://localhost:5173, click **enter the garden** (browsers require a
gesture before audio), and put on headphones.

## Touching the spirits

| Gesture | Input |
|---|---|
| Fingertip tap | click |
| Repeated tapping | rapid clicks (seeds the Trickster's quiet rhythm) |
| Palm press | click + hold — drones swell the longer you stay |
| Hug | hold ~2.5s+ — a rare warm bloom |
| Caress | slow drag — breath, texture, filter movement |
| Face / ear touches | click or drag those zones — voice-like tones, stereo opens |

The sand can be tapped too. Lingering near a spirit without touching it may
earn a small invitation. Left alone, the garden murmurs on its own.

Press **`d`** for the debug view: live garden state and the last gesture event.

## The three spirits

- **Listening Vessel** (right) — shy, attentive. Breath, soft bells; ears open
  the stereo field, the face answers with small voice-like tones.
- **Sleepy Guardian** (center) — slow, heavy, affectionate. Deep drones under a
  resting palm; gentle head-pats wake a slow pulse; hugs deepen the whole garden.
- **Stacked Trickster** (left) — bright, mischievous. Wood clicks and plucked
  fragments; repeated taps seed an 8-step pattern that slowly forgets itself.

## Five soundscapes

Selectable bottom-left, each a parameter set (scale, reverb, ambient mix,
tempo, timbre) over the same engine: **moss temple**, **ceramic spirits**,
**raked sand**, **ancestral garden**, **tea house at dusk**.

## Architecture notes

```
input/gestures.ts   mouse → GestureEvent (contact-mic-shaped data model)
events.ts           sculpture_id · zone_id · gesture_type · intensity · speed ·
                    duration · tap_rate · contact_continuity · brightness · roughness
state/garden.ts     wakefulness/calm/density/brightness/warmth/playfulness,
                    eased toward baseline; soft ceilings keep taps tasteful
audio/engine.ts     master chain, shared reverb (normalized), ambient bed
audio/voices/*      one personality per sculpture
idle.ts             probabilistic murmurs + proximity invitations
visuals/scene.ts    illustrated SVG diorama with per-zone hit shapes
visuals/feedback.ts glows, breathing, sand ripples, dust motes
```

The gesture layer emits the same event schema that contact-mic analysis would
produce in the installation (amplitude → intensity, onsets → taps, sustained
envelope → press/hug, HF noise → roughness), so replacing the mouse with
hardware sensing means swapping `input/gestures.ts` only.

Future layers sketched by the brief and left open here: virtual visitors
(they would just emit `GestureEvent`s into the same bus) and session recording.

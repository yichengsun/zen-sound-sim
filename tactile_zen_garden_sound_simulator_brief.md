# Tactile Zen Garden Sound Simulator Brief

## Project overview

Create a proposal-quality interactive audio-visual prototype for a tactile ceramic zen garden installation.

The installation contains raised plinths, small ceramic spirit sculptures, moss, stones, raked sand, plants, and soft ambient sound. Visitors touch, tap, caress, press, pat, knock, or hug the sculptures. In the final installation, contact microphones will read vibration as control data, while speakers hidden in the plinths make the sound feel like it is emerging from the ceramic spirits themselves.

The prototype should help the artist explore how a single visitor can interact with the sculptures and hear touch-responsive generative sound. The experience should feel calm, meditative, intimate, emotionally grounded, and exploratory. The sculptures should feel alive without becoming cartoonish or toy-like.

The prototype is a creative and technical sketching tool. It should help test interaction logic, sound personalities, visual language, and the emotional tone of the installation before committing to physical fabrication or hardware decisions.

## Core experience

When one person encounters the garden alone, the piece should feel quiet, meditative, and inviting. The visitor should feel welcome to sit down, slow their body, listen, and begin tending to the spirits through touch.

The sculptures are small ceramic spirits: ancestral, guardian-like, and integrated into the landscape. They are beings with personality, but they are also ritual objects and garden inhabitants. The experience should feel like interacting with nature, memory, and built environment rather than operating a literal musical instrument.

A strong emotional target:

> I touched a quiet ceramic spirit, and the garden slowly answered.

## Primary prototype goal

The first version should focus on one-person interaction.

The prototype should prove that:

- One ceramic object can feel alive through touch-responsive sound.
- Three sculptures can feel like distinct beings within one shared garden composition.
- The digital mockup helps the artist make decisions about interaction, sound, sculpture personality, and visual direction.
- The piece feels contemplative rather than gimmicky.
- The sculptures feel alive without becoming cartoonish.

## Stretch goal: multi-person simulation

Multi-person interaction is a stretch goal, not part of the first required build.

Later, the prototype should support a mode where one real user can activate virtual visitors. These virtual visitors can play, touch, tend to, or interact with the other sculptures, creating the feeling of multiple people shaping the garden together.

The stretch goal should explore:

- How two or three people might build a shared composition.
- How one person could trigger virtual collaborators.
- How virtual visitors can play other sculptures in different styles.
- How simultaneous interactions create harmony rather than noise.
- How rare group states can emerge, such as multiple sculptures being hugged or held at once.

Virtual visitor behavior presets could include:

- Cautious visitor: slow, rare touches.
- Playful visitor: light tapping and short rhythms.
- Meditative visitor: long holds, caresses, and quiet presence.
- Childlike visitor: frequent pats and curious touch.
- Ritual visitor: slow simultaneous holding of multiple sculptures.

This feature should be treated as a future layer that builds on the single-person interaction model.

## Interaction principles

The system should use an organic interaction model.

The visitor should feel agency, but not full control. Gestures should matter, but outcomes should remain slightly alive, emergent, and natural. The piece should reward attention, gentleness, slowness, and listening.

Tapping and knocking should produce more direct sound responses. These can feel like ceramic clicks, bells, soft percussion, plucks, or small rhythmic events.

Caressing, pressing, holding, and hugging should build sound over time. These gestures should swell, warm, deepen, or awaken the sculpture rather than triggering only one-off effects.

Touching the face, ears, head, belly, and body should have different effects. Face and ears can be more intimate, characterful, and emotionally responsive. They may produce soft laughter-like jingles, voice-like tones, echo, or call-and-response behaviors, but the result should stay restrained and meditative.

## Gestures to support in the first version

The prototype should simulate these gestures with mouse, trackpad, or cursor input.

| Visitor gesture | Prototype input | Sound behavior |
|---|---|---|
| Fingertip tap | Click | Direct ceramic tone, bell, pluck, or knock |
| Repeated tapping | Rapid clicks | Subtle rhythm, beat fragments, crescendo buildup |
| Palm pressing | Click and hold | Drone swell, resonance, warmth |
| Slow caressing | Slow drag | Filter movement, granular shimmer, breath, texture |
| Face touch | Click or drag on face zone | Intimate tone, small vocal quality, emotional response |
| Ear touch | Click or drag on ear zone | Stereo echo, listening effect, playful jingle |
| Patting head | Click top zone | Soft percussive response, waking gesture |
| Knocking body | Strong click or body-zone click | Deeper resonant knock |
| Hugging | Long hold or large body-zone contact | Slow bloom, rare warmth state, collective resonance later |

## Idle behavior

The garden should never feel dead.

When no one is touching the sculptures, there should be a soft ambient bed. The sculptures may occasionally make small sounds without prompt: trickles, hums, tiny ceramic ticks, distant breath, soft resonance, or moss-like environmental sound.

Idle sound should suggest that the spirits are asleep, breathing, or quietly present.

Possible idle layers:

- Low room tone
- Soft wind or air
- Distant water or trickling
- Ceramic micro-clicks
- Barely audible bells
- Gentle sub-drone
- Occasional spirit murmur without literal speech

If visitors are nearby but not touching, the sound can become slightly more inviting: a small chime, a warmer drone, a faint shimmer, or a tiny attention-seeking sound.

## Sound direction

Prepare multiple soundscape directions so the artist can test different emotional territories.

The prototype does not need to finalize the sound world. It should support exploration.

### Soundscape 1: Moss Temple

Quiet, sacred, meditative.

Sound palette:

- Warm drones
- Ceramic bells
- Soft bowls
- Distant air
- Low hum
- Small trickles
- Long reverb

Useful for testing whether the piece feels contemplative.

### Soundscape 2: Ceramic Spirits

Gentle, creature-like, intimate.

Sound palette:

- Small vocal-like tones
- Breath
- Tiny laughter-like jingles
- Ceramic knocks
- Soft call-and-response
- Playful but restrained motifs

Useful for testing personality without cartoonishness.

### Soundscape 3: Raked Sand Sequencer

Tactile, rhythmic, subtle.

Sound palette:

- Sand friction
- Wooden ticks
- Quiet offbeats
- Granular scrapes
- Low pulse
- Soft evolving tempo

Useful for testing repeated tapping and later collective interaction.

### Soundscape 4: Ancestral Garden

Emotional, memory-like, slightly mysterious.

Sound palette:

- Degraded tones
- Distant choir-like pads
- Low radio texture
- Ceramic resonance
- Wind
- Warm harmonic swells

Useful for testing the ancestral-spirit feeling.

### Soundscape 5: Tea House at Dusk

Warm, human, quiet, inviting.

Sound palette:

- Porcelain
- Water
- Wood
- Insects
- Soft room tone
- Gentle melodic fragments

Useful for testing approachability.

## Sculpture personalities

Use the supplied reference images as inspiration for the sculpture family, composition, and emotional tone. The prototype should include three primary sculptures on plinths. The forms can be simplified and stylized.

### 1. Listening Vessel

Inspired by the rounded green-gray vessel with small ears and a pale belly.

Role: listener, receiver, emotional anchor  
Temperament: shy, tender, attentive, ancient  
Best gestures: ear touch, face touch, slow caress, holding  
Sound personality: breath, echo, soft bells, stereo shimmer, low ceramic hum  
Special behavior: touching the ears opens the stereo field; touching the face creates small voice-like tones; holding creates a warm sustained bloom.

### 2. Sleepy Guardian

Inspired by the brown rounded figure with drooping face and small side ears.

Role: guardian, grounded ancestor, protective presence  
Temperament: slow, heavy, calm, affectionate  
Best gestures: palm press, hugging, patting head, slow body touch  
Sound personality: deep drone, warm knock, low bowl resonance, soft subharmonics  
Special behavior: long contact makes the garden calmer and deeper; repeated gentle pats awaken a slow pulse.

### 3. Stacked Trickster

Inspired by the stacked colorful totem-like figure.

Role: social catalyst, playful spirit, rhythm keeper  
Temperament: bright, mischievous, curious, social  
Best gestures: tapping, knocking, repeated touch  
Sound personality: tiny percussion, offbeat jingles, wooden clicks, melodic fragments  
Special behavior: repeated taps add small rhythmic events; later, in multi-person mode, this sculpture can help organize collective rhythm.

### Optional fourth sculpture: Stone Elder

Inspired by the dark rounded figure with a protruding nose and heavy lower body.

Role: memory keeper, quiet witness  
Temperament: stoic, dry, old, minimal  
Best gestures: knocking, slow caress, body touch  
Sound personality: stone thuds, dry ceramic texture, low resonance, distant bell  
Special behavior: responds rarely, but when activated it adds a grounding tone to the whole garden.

## Visual exploration

The visual direction should be explored by the agent rather than strictly predetermined.

The prototype should be non-photorealistic. It does not need to look like a realistic architectural render. It should communicate the feeling of a quiet indoor zen garden with small ceramic spirits on plinths.

Possible visual territories to explore:

- Soft illustrated 2D scene
- Isometric garden map
- Hand-drawn ink and watercolor style
- Clay-like digital diorama
- Minimal abstract garden interface
- Paper cutout or risograph-inspired look
- Low-poly 3D scene with soft lighting
- Dreamy gallery mockup with subtle animation

The agent should test visual treatments and choose one that best supports the emotional tone: calm, intimate, meditative, lightly magical, and proposal-ready.

Avoid:

- Overly cute character animation
- Bouncy cartoon reactions
- Game-like UI clutter
- Hyperrealistic rendering that slows down exploration
- Loud visual effects
- Literal fantasy-spirit tropes

Preferred visual feedback:

- Subtle glow
- Slow pulse
- Breathing scale shift
- Soft vibration lines
- Sand ripples
- Moss shimmer
- Small particles
- Light shifts
- Plinth resonance

## System behavior

The prototype should maintain a simple global garden state that changes over time.

Suggested global parameters:

| Parameter | Meaning |
|---|---|
| Wakefulness | How alive the spirits currently are |
| Calm | How meditative and slow the garden feels |
| Density | How many sound layers are active |
| Brightness | How high, shimmering, or lively the sound is |
| Warmth | How intimate and harmonic the sound feels |
| Playfulness | How creature-like or rhythmic the system becomes |

The system should use these parameters to prevent chaos. Many rapid taps should not simply make everything louder. Tapping can increase density and rhythm up to a tasteful limit. Gentle sustained contact should produce the richest harmonic response.

## Contact mic model

The final installation likely uses contact microphones as controllers rather than pure sound sources.

The simulator should be designed so cursor gestures map to the same data structure that contact mic analysis would eventually produce.

Suggested internal event model:

```text
sculpture_id
zone_id
gesture_type
gesture_intensity
gesture_speed
gesture_duration
tap_rate
contact_continuity
brightness
roughness
timestamp
```

Later, real contact mic data can be translated into the same fields.

Potential contact mic analysis:

| Contact mic feature | Interpreted meaning |
|---|---|
| Amplitude | Touch strength |
| Onset | Tap or knock |
| Repeated onsets | Rhythm or tapping |
| Sustained envelope | Hold, press, or hug |
| High-frequency noise | Scratch or friction |
| Spectral brightness | Nail, scrape, sharpness |
| Low resonance | Body knock or deep contact |
| Duration | Care, attention, holding |

The final installation can use one contact mic per sculpture for a simpler version, or multiple contact mics per sculpture if zone detection becomes important. The simulator should allow thinking through both possibilities, but the first prototype does not need to solve physical sensing.

## Technology approach

Do not over-prescribe the technical stack.

The agent should choose a stack that supports fast exploration of interactive visuals and generative audio on a laptop. The first build should prioritize emotional clarity, sound behavior, gesture mapping, and iteration speed over technical sophistication.

Possible directions include:

- Browser-based prototype
- Creative coding sketch
- Game engine prototype
- Audio-first prototype with simple visuals
- Visual-first mockup with embedded sound behaviors
- Hybrid workflow using existing sound tools and a lightweight visual front end

The agent should justify its chosen approach based on:

- Speed of prototyping
- Ease of running locally
- Quality of generative audio
- Ease of visual iteration
- Ability to simulate gestures
- Ability to later connect to sensor or contact mic data
- Suitability for a proposal demo

## Nice-to-have: session recording

Session recording is a nice-to-have, not a core requirement for the first build.

If feasible, the prototype can allow the artist to record and export a session.

Possible export options:

- Audio recording
- Short screen capture
- Interaction log
- Active soundscape preset
- Sculpture personality settings
- Global state over time
- Notes field

This would be useful for comparing sound worlds, sharing progress, and documenting the design process.

## First build milestone

Create a simple interactive scene with three sculptures.

Minimum viable demo:

- One ambient backing layer
- Three sculpture personalities
- Click = tap
- Rapid click = rhythmic tapping or crescendo
- Click and hold = press or bloom
- Drag = caress or texture
- Face and ear zones behave differently
- Idle sculptures make occasional tiny sounds
- Multiple soundscape directions can be tested
- Visual style is explored and selected by the agent

The first prototype should prove the emotional logic of the work before investing in complex 3D, hardware, recording, or multi-person simulation.

## Success criteria

The prototype succeeds when:

- A single visitor can touch a ceramic spirit and feel that it is alive.
- The sound response feels meditative, organic, and emotionally grounded.
- The sculptures have distinct personalities without becoming cartoon characters.
- The ambient backing makes the garden feel alive even when no one is touching it.
- The prototype helps the artist compare soundscapes and interaction models.
- The visual treatment supports the mood without becoming the main technical burden.
- The demo is compelling enough to explain the installation concept to collaborators, funders, technologists, or fabricators.

## AI agent task

Design and prototype a non-photorealistic (but can be 3D or 2D) interactive audio-visual simulator for a tactile ceramic zen garden installation. Use the supplied reference images as mood and composition inspiration. Prioritize sound behavior, gesture mapping, sculpture personality, and the feeling of aliveness through touch. 

Start with a one-person interaction model. Treat multi-person simulation, virtual visitors, and session recording as future or optional layers. Explore visual directions rather than locking into a single prescribed style or technical stack too early.

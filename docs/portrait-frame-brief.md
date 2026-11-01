# Portrait frame brief — living portrait (not in use)

> **Not currently used.** The 2026-11-01 redesign dropped the portrait from the homepage.
> This brief is kept so the engine can be revived without rediscovering the format.

The hero portrait is not animated in code. It is **59 separately generated pictures of the
same face**, swapped on a WebGL sheet that also stretches the skin. The code only chooses
which picture to show and deforms it.

Until `assets/portrait/rest.webp` exists, `assets/portrait/placeholder.svg` is shown and the
engine stays asleep. Nothing breaks; the page simply has a static hero.

## Hard requirements

Every frame must satisfy all of these. Each one was a real bug in the reference build.

| Requirement | Value | Why |
|---|---|---|
| Dimensions | 1024 × 1280 (4:5) | The engine maps the frame to a fixed uv space |
| Format | WebP, **alpha channel** | The face is composited over the page; the background must be transparent |
| Framing | Identical in every frame | Gaze frames are swapped whole; a 2 px shift reads as a twitch |
| Lighting | Identical | Same light means the crossfade is invisible |
| Pose | Identical | Only the named feature changes per frame |
| Seed | Same seed for the whole set | Keeps identity stable across 59 generations |
| Background | Transparent or perfectly flat and removable | Alpha is sampled at 128×128 to test whether the cursor is on the face |
| Size | ≤ 250 KB each, ≤ 15 MB total | The engine streams all frames in the background after `rest` |

Do not retouch between frames. Do not change head angle, camera distance, crop, or colour
grade. One face, 59 states.

## Required geometry

Normalised to the frame (0,0 top-left → 1,1 bottom-right). The engine's hit zones are
hardcoded to this geometry, so a different crop breaks the interaction silently.

```
hairline      y = 0.23
eyes          y = 0.455      left eye x ≈ 0.36, right eye x ≈ 0.65
nose tip      y = 0.54       x = 0.50
mouth         y = 0.645      x = 0.505
chin          y = 0.78
head width    x = 0.27 … 0.74
```

Head centred horizontally, facing camera, shoulders out of frame or fading before y = 0.95.

## The 59 frames

### Gaze — 16 directions, whole pictures (18 files with lids)

Files are named exactly as the direction. The engine maps them one-to-one.

```
e  ene  ne  nne  n  nnw  nw  wnw  w  wsw  sw  ssw  s  sse  se  ese
```

Plus:

```
half     — lids half closed, eyes neutral
closed   — eyes fully closed, face relaxed
```

### Expressions (27)

```
rest       neutral, soft expression, eyes open and forward — the base frame
shock      mouth slightly open, eyes wide
tongue     tongue out
cross      cross-eyed
angry      brows down hard
scrunch    face scrunched, eyes squeezed
winkr      right eye winking, left open
winkl      left eye winking, right open
raised     one brow raised
puff       one cheek puffed
laugh      open laugh
yawn       mid-yawn, mouth wide
grin       wide closed-lip grin
kiss       lips pursed
cry        crying, tears visible
smug       half-lidded, smirk
scared     eyes wide, mouth open in fear
fish       lips pulled into a fish face
dizzy      eyes unfocused, slight head tilt
wind       hair blown sideways by wind
ouch       wincing, one eye shut
deadpan    flat, unimpressed stare
hearts     heart-shaped pupils
stars      star-shaped pupils
snore      asleep, mouth slightly open
shy        looking down, cheeks flushed
sick       greenish pallor, uneasy
```

### Hair colour (3)

These face **forward** — no gaze variants exist in colour. While coloured, her eyes rest.

```
pink    blue    blonde
```

### Act frames (11)

```
yawn1  yawn2  yawn4          yawn progression, eyes closing then wide
whistle1  whistle2           lips pursed, two mouth shapes
sneeze1  sneeze2             pre-sneeze, then the burst
gum1  gum2  gum3  gumpop     bubble grows, then pops
```

## Installing the set

1. Generate the frames, export at 1024 × 1280 WebP with alpha, name each `<slug>.webp`.
2. Drop them into `assets/portrait/`.
3. `npm run build` — no template change needed.
4. Confirm `rest.webp` loads and the placeholder disappears; then check that gaze follows the
   cursor and that hovering the Contact pill gives heart eyes.

## Validation before installing

- **Alignment:** stack `rest.webp` and `n.webp` at 50 % and flip between them. The chin, ears
  and hairline must not move.
- **Alpha:** open one frame on a bright background. No white fringe, no black halo. A fringe
  means the alpha was premultiplied twice.
- **Identity:** `rest`, `kiss` and `cry` side by side must read as the same person.
- **Budget:** `du -ch assets/portrait/*.webp | tail -1` under 15 MB.

## Known limits

- Coloured hair cannot express (no gaze or expression frames exist in colour). Tapping the
  hair cycles colour and temporarily parks the face forward, by design.
- The sheet deforms ~17 % beyond the frame edge; the canvas is sized for that overflow, so do
  not crop tight to the face.

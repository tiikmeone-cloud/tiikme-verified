# Rive animation handoff — tiikme · Twin

## 0. Setup ✅ done

- `@rive-app/react-canvas` is installed
- `<TwinOrbRive />` and `<TwinLoader />` wrappers are wired
- Files go in `public/anim/`
- The app already imports the Rive versions — your `.riv` files hot-swap the CSS
  fallbacks the moment they're saved to `public/anim/`. **No code changes required
  on our side after handoff.**

---

## 1. The Twin orb · `twin-orb.riv`

This is the most-used animation in the product. It's the avatar above the
chat composer, the author of every Twin message, the icon on the Today
card, and the live indicator on cards across the app.

### Artboard

- **Name:** `TwinOrb`
- **Canvas:** square — recommended `200 × 200` (renders at 22–140px, vector)
- **Background:** transparent

### Design direction

- A glowing 3D-feel sphere — orange core, purple/red rim, soft outer halo
- Specular highlight (top-left) for depth
- The sphere always feels *alive* (slow breathe / shimmer) even in idle
- One accent palette: `#FF5C28` (orange), `#FF7A4A` (orange-2), `#6D4BD8` (purple)
- Background page color: `#FAF7F3` (off-white) — make sure rim contrast works
- Reference: Apple Intelligence orb, Pi orb, Hume EVI orb. **Not** a logo, a presence.

### State machine

- **Name:** `Orb State` (this exact string)

#### Inputs

| Name (case-sensitive) | Type | What it means | When the app sets it |
|---|---|---|---|
| `isListening` | Boolean | Composer is focused | User taps the chat input |
| `isThinking`  | Boolean | Computing a reply | Between send and stream |
| `isSpeaking`  | Boolean | Reply is streaming in | While text is being written |
| `isSuccess`   | Boolean | One-shot ✓ | Apply, connect, consent — 900ms then off |
| `personaTone` | Number  | 0 / 1 / 2 | 0 = professional · 1 = student · 2 = org |

#### States to design

1. **Idle** — slow breathe (~4s cycle), slow swirl, occasional shimmer.
   Persona-tone shifts the rim color subtly:
   - `0` professional → orange/purple
   - `1` student → orange/teal
   - `2` org → orange/deep-purple
2. **Listening** (`isListening = true`) — swirl speeds up ~3×, core brighter,
   small teal listening dot pulses bottom-right.
3. **Thinking** (`isThinking = true`) — swirl becomes orbiting particles, faster,
   tiny bright dots circle the rim.
4. **Speaking** (`isSpeaking = true`) — concentric ripples emanating outward,
   gentle and rhythmic (one ripple per ~600ms).
5. **Success** (`isSuccess = true`) — bright orange-white flash + slight scale
   bump + settles back. ~900ms total.

All states blend smoothly — no hard cuts. Use Rive's **blend states** with a
0.25s mix to avoid pops.

---

## 2. Loaders — five files

Each `.riv` is a small (~20–40KB) self-contained loop. **No inputs needed** — just
autoplay. Renders at 24–48px in the UI.

| File path | Used in | Vibe |
|---|---|---|
| `public/anim/loader-thinking.riv` | Reasoning pill in chat | Three orbiting sparkles + flowing ellipsis |
| `public/anim/loader-matching.riv` | Search results loading, Twin matching candidates | Small tiles flipping over revealing scores |
| `public/anim/loader-applying.riv` | Sending application | Paper plane unfolds → flies → lands as ✓ |
| `public/anim/loader-auditing.riv` | /audit page while Twin scans | Magnifier orbits a Flex card, highlights a line |
| `public/anim/loader-building.riv` | /create build step | Flex card sections sliding in, each with a soft burst |

### Design constants for all loaders

- Square canvas, 100 × 100 baseline (renders 24–48px in UI)
- Transparent background
- Loop seamlessly (last frame matches first)
- Accent: `#FF5C28` orange
- Secondary: `#6D4BD8` purple (sparing)
- Stroke weight: ~2.5 at 100×100 baseline
- 24fps export

---

## 3. Export from Rive

For each artboard:

1. **File → Export → Runtime**
2. **Choose:** "For runtime (.riv)"
3. **Settings:**
   - ✅ Skip unused symbols
   - ✅ Skip unused artboards
4. **Save filename exactly** (lowercase, hyphenated — see paths above)
5. **Drop into** `tiikme-verified/public/anim/`

That's it. Save the file in the right path, refresh the browser, the new
animation appears. The CSS fallback disappears automatically.

---

## 4. Quick workflow loop

```
1. Open Rive desktop app
2. Open the artboard you're working on
3. Hit save in Rive
4. File → Export → Runtime (.riv)
5. Save into  tiikme-verified/public/anim/twin-orb.riv
6. Refresh  http://localhost:3002/
7. See it live
```

No build step needed in dev — Next.js serves `public/` straight through. Production
build copies it to the CDN automatically.

---

## 5. Files the dev side owns (do not touch)

- `src/components/agent/TwinOrb.tsx`    — CSS fallback for the orb
- `src/components/agent/TwinOrbRive.tsx` — Rive wrapper (probes for file, drives state)
- `src/components/agent/TwinLoader.tsx`  — Loader wrapper (probes for file, falls back to spinner)

All three are state-machine-aware. The wrapper drives the inputs from React
props every time the props change.

---

## 6. Performance budget

| Animation | Target file size | Why |
|---|---|---|
| `twin-orb.riv` | ≤ 80 KB | Renders on every chat screen + Today card |
| Each loader | ≤ 40 KB | Several loaders may render on the same page |
| All loaders combined | ≤ 200 KB | Whole motion system stays under 300 KB total |

If a file exceeds the budget, the most likely cause is too many vector layers
or too high a frame count — reduce keyframes, simplify shapes.

---

## 7. Questions for the designer

If anything is unclear, the answers we'll need from you:

- Hex codes for any color outside the listed palette
- Frame rate (24fps default — bump only if motion needs it)
- Idle-loop length (4s suggested — too short feels twitchy)
- Whether to bake a "first-paint" still pose (recommended for SSR — `isListening = false` baseline)

---

## 8. The contract

You ship `.riv` files. We ship the React. **Nothing in the code needs to change**
when you save a new animation — the moment a file lands in `public/anim/`, the
UI hot-swaps to it. The day you replace the orb design, every orb in the app
updates at once.

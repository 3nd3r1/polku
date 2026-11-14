# Polku design

Locked visual language for everything Polku ships: the app, slides, the video, the submission cover, diagrams and generated images. If a material disagrees with this doc, the material is wrong.

Reference: Palantir's dark product and brand look (near-black surfaces, hairlines, square geometry, monochrome with color only for status). We copy the language, never the branding: no Palantir name, logo or product screenshots in anything we make.

Status: colors, shape, type, layout and imagery are **locked**. Logo is **open** (see the end).

## Principles

1. **Black first.** Near-black background, off-white text. No light mode, anywhere.
2. **Monochrome.** Greys carry the design. Color means status and nothing else.
3. **Square and hairline.** No rounded corners, no shadows, no gradients. Structure comes from 1px lines.
4. **Dense but calm.** Small type, tight rows, lots of black space around the one thing that matters.
5. **Every number has a source.** A figure without its source line and its synthetic/real label does not go on screen or on a slide.

## Color

Source of truth in code: `src/app/globals.css` (`@theme`). The names below are the Tailwind tokens (`bg-base`, `text-muted`, `border-line`).

### Surfaces and lines

| Token | Hex | Use |
|---|---|---|
| `base` | `#0a0b0b` | Page background, slide background, video background |
| `panel` | `#121414` | Nav, side panels, cards on slides |
| `raised` | `#1b1e1f` | Selected row, hover, inputs |
| `line` | `#262a2b` | Default 1px border and divider |
| `line-strong` | `#3a3f41` | Border that must be seen: focused input, table header rule, empty clock track |

### Text

| Token | Hex | Use |
|---|---|---|
| `fg` | `#e6e6e3` | Primary text, headings, primary button fill |
| `muted` | `#8d9294` | Secondary text, labels, inactive tabs |
| `dim` | `#5b6062` | Tertiary only: timestamps, disabled, placeholders. Never body text |

Pure white `#ffffff` is allowed only for the hover state of a primary button. Pure black `#000000` only as text on an `fg` fill.

### Status

| Token | Hex | Meaning | Never |
|---|---|---|---|
| `alert` | `#e5484d` | Clock breached, red flag, "call 112" | decoration, headings, logos |
| `warn` | `#d9a43b` | Clock at risk | highlights, emphasis |
| `ok` | `#3fb37f` | Within time limit, step done | "success" marketing accents |
| `info` | `#5b9bd5` | Links and source citations | large fills |

Rules:

- There is **no brand accent color**. Emphasis is done with `fg` against `muted`, weight and size.
- Status color is used on text, a 1px border, or a small fill (dot, clock bar). Never a full panel or slide background.
- On a slide or video frame, at most one status color carries the point. If everything is red, nothing is.
- Charts: series in `fg`, `muted`, `dim`. Status colors only when the series is a status.
- Synthetic vs real: synthetic data is marked with the text label `SYNTHETIC` in `muted`, real public numbers with their source in `info`. The distinction is never color alone.

## Shape

| Property | Value |
|---|---|
| Corner radius | `0` everywhere: buttons, inputs, cards, tags, images, video frames |
| Border | `1px solid line`. `line-strong` when it must be seen. Active tab: 2px bottom border in `fg` |
| Shadow | none |
| Gradient, glow, blur | none |
| Elevation | by surface step (`base` to `panel` to `raised`), never by shadow |
| Icons | avoid. If needed: 1.5px stroke, square caps, `muted`, 16px. No filled or two-tone icons, no emoji |
| Status marker | small square (10px) or a horizontal clock bar (10px tall, track in `line-strong`). Not a circle, not a pill |
| Primary button | `fg` fill, black text, square, 44px tall |
| Secondary button | transparent, 1px `line-strong` border, `fg` text |

Motifs for slides, diagrams and video, in order of preference:

- hairline grid and rules
- a single thin line that moves through steps (the pathway)
- small solid squares as nodes
- clock bars that fill left to right
- large light-weight numerals

Not used: blobs, 3D, glassmorphism, isometric illustration, stock photos of doctors, medical crosses, hearts, DNA helices, robot or brain imagery.

## Typography

| Role | Font | Notes |
|---|---|---|
| Everything | **Geist** (sans) | Fallback: Inter, then system sans |
| Labels, numbers on a clock, ids, timestamps, code | **Geist Mono** | Fallback: JetBrains Mono, then system mono |

Both are open fonts (SIL OFL), loaded in `src/app/layout.tsx`. No third typeface.

| Style | Size | Weight | Other |
|---|---|---|---|
| Display (slide title, hero number) | 30px app, 64 to 96px slide | 300 light | tight leading |
| Heading | 18 to 20px | 400 | |
| Body | 14px | 400 | default in the app |
| Small | 12px | 400 | `muted` |
| System label | 11px mono | 400 | uppercase, tracking `0.08em`, `muted` (class `.label`) |
| Wordmark text | 14px | 600 | uppercase `POLKU`, tracking `0.2em` |

Rules:

- Big things are **light**, not bold. Bold (600) is for the wordmark only.
- Sentence case everywhere. Uppercase only for system labels and the wordmark.
- Numbers that update or line up use mono with tabular figures.
- 24h time. `14:05`, never `2:05 PM`. Dates `13.11.2026`.
- No em dashes, no exclamation marks.

## Layout

- 4px base unit. Common steps: 8, 12, 16, 20, 24, 32, 40.
- App: nav 48px tall, rows 44px tall, panel padding 20px horizontal.
- Left aligned. Centered text only for a single hero number or a single slide statement.
- Panels sit edge to edge, separated by one hairline. No gaps with floating cards.
- One screen per role, showing only what that role acts on.

## Slides and video

- 16:9, `base` background, 1920x1080.
- Margin 96px. Content on a 12 column grid, hairline rules allowed as visible structure.
- One idea per slide. Title in display light, at most one supporting line in `muted`.
- Top left: wordmark. Bottom left: mono system label with the section. Bottom right: source line in `muted`, links in `info`.
- App screenshots are shown raw, square, with a 1px `line` border. No device frames, no tilt, no drop shadow.
- Motion: cuts and linear or ease-out moves of 150 to 250ms. Lines draw, bars fill, numbers count. No bounce, no spin, no zoom-punch.
- Captions and lower thirds: mono system label over `panel` with a 1px `line` border.

## Voice

Short, factual, in plain language. State the number and the source. No hype words, no internal codes on staff screens, at most one source line per item.

## Prompt block for generated material

Paste this when asking a model or a tool to make Polku images, slides or diagrams:

```
Style: stark dark enterprise software aesthetic. Near-black background #0a0b0b,
panels #121414, 1px hairline borders #262a2b, off-white text #e6e6e3, grey
secondary text #8d9294. Strictly monochrome. Color only for status: red #e5484d
(breached), amber #d9a43b (at risk), green #3fb37f (on time), blue #5b9bd5
(links). Square corners everywhere, no rounded shapes, no shadows, no gradients,
no glow, no 3D. Geist sans in light weight for large text, Geist Mono uppercase
with wide tracking for small labels. Thin lines, small solid squares as nodes,
horizontal bars as clocks, generous black space. No stock photos, no medical
icons, no people, no logos of other companies.
```

## Logo

**Open, not locked.** Decided so far:

- The name stays **Polku**.
- Wordmark text: `POLKU`, Geist 600, uppercase, tracking `0.2em`, `fg` on `base`.
- Placeholder mark in the app: a 12px solid `fg` square left of the wordmark (`src/components/nav.tsx`).
- Direction: a simple geometric mark in the same family as Palantir's, single color, works at 16px, drawn with the shape rules above. It must be our own shape, not a copy of theirs.

Until the mark is locked, use the wordmark with the placeholder square everywhere.

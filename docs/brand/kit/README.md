# Polku brand kit

The logo and the Cover 2 background. Rules: `docs/design.md`.

## Logo

A solid square split by a stepped path. The path is the gap.

| File | Use |
|---|---|
| `logo/svg/polku-lockup.svg` | Default. Mark + POLKU, light, on dark backgrounds |
| `logo/svg/polku-lockup-black.svg` | On light backgrounds (print, partner pages) |
| `logo/svg/polku-lockup-on-dark.svg` | Lockup with its own `#0a0b0b` background, for placing on anything |
| `logo/svg/polku-mark.svg` / `-black.svg` | Mark alone, when the name is already on screen |
| `logo/svg/polku-icon.svg` | Square app icon: mark on `#0a0b0b` |
| `logo/png/*` | Same, as transparent PNG, for Slides, Figma, DaVinci Resolve |
| `logo/icons/*` | favicon.svg, favicon-16/32/48, apple-touch-icon (180), icon-192, icon-512 |

The wordmark is outlined (Geist 600, tracking 0.2em), so the SVGs need no font installed.

Rules: light `#e6e6e3` or black only. No other colors, no outline, no shadow, no rotation. Keep clear space of at least the mark's width around the lockup.

## Background

`backgrounds/polku-bg-path-dimmed-1920x1080.png`: 1920x1080, the path image at 70% over `#0a0b0b`. Put text in the top two thirds. Decorative only, no data meaning.

## Web app

Copy `logo/icons/favicon.svg` to `src/app/icon.svg` and `logo/icons/apple-touch-icon.png` to `src/app/apple-icon.png`. Next.js picks them up.

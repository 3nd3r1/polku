# Docs

| Path | What |
|---|---|
| [`architecture.md`](architecture.md) | How Polku works technically: the call, the access gate, rules engine, booking, record, deployments, Polku's own rules |
| [`product.md`](product.md) | The product: the problem, Matti, the surfaces, phone first and identification, safety, business |
| [`lung-pathway-sources.md`](lung-pathway-sources.md) | Lung criteria and step time limits from Sweden, Denmark, Norway and Finland, with URLs. `src/pathways/lung.ts` is encoded from it |
| [`strategy.md`](strategy.md) | What Finland's national cancer strategy 2026-2035 asks for, and which roadmap measures Polku implements |
| [`design.md`](design.md) | Visual language: colors, shape, type, layout, slides and video |
| [`deploy.md`](deploy.md) | How production and the demo site ran on Coolify, and the phone line |
| [`Polku-white-paper.pdf`](Polku-white-paper.pdf) | White paper ([print version](Polku-white-paper-print.pdf)) |
| [`pitch/`](pitch/) | Pitch deck PDF and its HTML source, pilot one-pager |
| [`video/`](video/) | The submission video (`PolkuV3.mp4`, final, also [on YouTube](https://www.youtube.com/watch?v=DM7m4YDkjc0), and `PolkuV2.mp4`) and its Remotion source |
| [`brand/`](brand/) | Logo kit and slide templates |
| [`screenshots/`](screenshots/) | Screens from the demo site, used in the main README |
| [`hackathon/`](hackathon/) | Working notes from the event: build plan, story and demo script, submission text, tech challenges, the event brief |

The video project has its own `package.json`: `cd docs/video && npm install && npm run studio`. Voice, music and mastering scripts are in `docs/video/scripts/`.

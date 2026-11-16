# Deploy and operations

On 16.11, after the event, we deleted production and its Coolify environment, and shut down the phone line and the Verda model. Only the public demo site is left: the `polku-demo` app and its database `polku-demo-db` (Postgres 16, moved from Aiven the same day) in the `demo` environment. It doesn't deploy on push. Run `npm run deploy:demo` to rebuild it from `main`. The rest of this page is how both sites ran during the event.

Pushing to main deployed production through Coolify (Dockerfile build, Aiven Postgres). The container creates the schema and seeds on first boot.

```sh
npm run deploy:demo       # the demo site does not deploy on push
npm run demo:reset        # wipe and reseed local and production (or: demo:reset local, demo:reset prod)
npm run agent:push        # push prompt and tools to ElevenLabs
npm run agent:phone       # create or update "Polku Phone" and point the number at it
```

## Two sites

Both are Coolify apps in the `polku` project, built from `main` with the same Dockerfile.

| | Production | Public demo |
|---|---|---|
| Coolify environment | `production` | `demo` |
| URL | https://prod-polku.eros.ender.fi | https://polku.ender.fi |
| Database (Aiven) | `defaultdb` | `polku_demo` |
| For | us: voice calls, the pitch, the video | anyone: the link we hand out, start at `/demo` |
| `NEXT_PUBLIC_DEMO_SITE` (build time) | unset | `1` |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | set | unset |
| `SITE_PASSWORD` | set: the browser asks for it once, any user name | unset |

The demo site has no voice calls: scripted callers on `/demo` stand in for the phone, a scripted patient answers the callback, and the reset needs no token.

## Phone line

The real phone line is a Twilio number on ElevenLabs answered by "Polku Phone", a copy of the agent whose tools are webhooks to `/api/phone/[tool]` on production. `npm run agent:phone` (after `agent:push`) sets it up. When the nurse accepts times, production rings `DEMO_CALLBACK_NUMBER`.

The Twilio account is a trial: it only calls verified numbers and plays a trial notice first (press any key). Agent setup and demo identity codes: `agent/README.md`. Calling the real number: `docs/hackathon/phone-demo.md`.

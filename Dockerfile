# Production image for Coolify. One stage: the start script needs drizzle-kit
# and tsx to apply the schema and seed the synthetic register on first boot.
FROM node:22-alpine
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Clocks, slots and the seed use local time: make it Finnish whatever the host is.
ENV TZ=Europe/Helsinki

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
# Inlined into the client bundle at build time.
ARG NEXT_PUBLIC_ELEVENLABS_AGENT_ID
ENV NEXT_PUBLIC_ELEVENLABS_AGENT_ID=$NEXT_PUBLIC_ELEVENLABS_AGENT_ID
# 1 on the public demo deployment: scripted calls only, no voice, open reset.
ARG NEXT_PUBLIC_DEMO_SITE
ENV NEXT_PUBLIC_DEMO_SITE=$NEXT_PUBLIC_DEMO_SITE
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start:prod"]

# Boxer AI analysis worker — Phase 2a
FROM node:24-slim

# ffmpeg: frame extraction. ca-certificates: TFHub model download over HTTPS.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# The MoveNet model (~15MB) downloads from TFHub on first startup and is
# cached in the container's TFHub cache dir. Bake it in at build time if
# you want cold starts without egress:
#   RUN node -e "…"   (see README "pre-warming the pose model")

ENV NODE_ENV=production \
    WORK_DIR=/tmp/boxer-worker \
    TF_CPP_MIN_LOG_LEVEL=2

CMD ["node", "dist/index.js"]

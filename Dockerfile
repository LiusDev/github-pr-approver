# NOTE: This Docker setup is superseded by Cloudflare Workers deployment.
# Use `pnpm deploy` (wrangler deploy) instead.
# This file is kept for reference only.

FROM node:22-alpine AS builder

RUN npm install -g pnpm@10.33.2
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm run build


FROM node:22-alpine

RUN npm install -g pnpm@10.33.2
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
COPY public/ ./public/

ENV PORT=8070
EXPOSE 8070

CMD ["node", "dist/server.js"]

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/client/package.json ./packages/client/
COPY packages/server/package.json ./packages/server/
RUN pnpm install --frozen-lockfile || pnpm install
COPY packages/ ./packages/
RUN pnpm run build:server
RUN pnpm run build:client

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/client/dist ./public
EXPOSE 3001
CMD ["node", "dist/app.js"]
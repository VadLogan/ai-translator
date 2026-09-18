# Build from the repo root: docker compose up --build  (or docker build -f api/Dockerfile .)
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json ./api/
RUN npm ci --omit=dev --workspace api
COPY shared ./shared
COPY api/src ./api/src
COPY api/migrations ./api/migrations
ENV PORT=8787
EXPOSE 8787
CMD ["node", "api/src/server.ts"]

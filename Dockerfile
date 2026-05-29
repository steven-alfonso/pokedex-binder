FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN apk add --no-cache build-base && npm ci --omit=dev && apk del build-base && rm -rf ~/.npm
COPY . .

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./
COPY --from=builder /app/public ./public
EXPOSE 5001
ENV PORT=5001
ENV BINDER_DB_PATH=/data/binder.db
USER node
CMD ["node", "server.js"]

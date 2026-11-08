# WearWise backend — production image
FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Uploads live on a volume mounted here; it must be writable by the non-root user.
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node

ENV PORT=3000 \
    UPLOAD_DIR=/app/uploads
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/ping').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Apply pending migrations, then start the API.
CMD ["sh", "-c", "node drizzle/migrate.js && node server.js"]

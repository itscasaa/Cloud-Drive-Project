FROM node:20-alpine AS base

WORKDIR /app

# wget is used by docker-compose healthcheck
RUN apk add --no-cache wget

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build && npx prisma generate

EXPOSE 4000

CMD ["sh", "-c", "npm run db:migrate:deploy && npm run seed:google-config:docker && node dist/server.js"]

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY web/package.json web/package.json
RUN npm ci --ignore-scripts

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app /app
COPY web web
COPY staffordos staffordos
COPY checkout_benchmark_intelligence checkout_benchmark_intelligence
COPY operator_brain operator_brain
COPY signals signals
RUN cd web && npx prisma generate --schema=prisma/schema.prisma

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 8081
CMD ["node", "web/src/index.js"]

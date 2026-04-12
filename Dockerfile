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
COPY signal_interpreter signal_interpreter
COPY merchant_discovery merchant_discovery
COPY merchant_outreach merchant_outreach
COPY opportunity_scoring opportunity_scoring
COPY execution_gate execution_gate
COPY execution_packets execution_packets
COPY packet_executor packet_executor
COPY packet_validator packet_validator
COPY feedback_registry feedback_registry
COPY slices slices
COPY build_queue build_queue
RUN cd web && npx prisma generate --schema=prisma/schema.prisma

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 8081
CMD ["node", "web/src/index.js"]

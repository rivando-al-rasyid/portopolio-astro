FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG PUBLIC_SITE_URL=http://localhost:4321
ARG PUBLIC_PAYLOAD_URL=http://localhost:3000
ARG PAYLOAD_API_URL=http://localhost:3000
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL} \
    PUBLIC_PAYLOAD_URL=${PUBLIC_PAYLOAD_URL} \
    PAYLOAD_API_URL=${PAYLOAD_API_URL}
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache nginx
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/start.sh /usr/local/bin/start-frontend
RUN chmod +x /usr/local/bin/start-frontend \
    && mkdir -p /usr/share/nginx/html \
    && if [ -d ./dist/client ]; then cp -r ./dist/client/. /usr/share/nginx/html/; fi
EXPOSE 80
CMD ["start-frontend"]

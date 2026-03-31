FROM node:24.14.0-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build --configuration=production

FROM nginx:1.29.6-alpine

COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist/untitled4/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- development: Vite dev server with HMR ----
FROM node:22-alpine AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ---- build: production static bundle ----
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- production: serve static files with nginx ----
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM node:22-alpine

# pnpm via corepack (incluido en Node.js 22)
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copiar manifiestos primero para aprovechar el cache de capas
COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --prod=false --frozen-lockfile || pnpm install --prod=false --no-frozen-lockfile

# Copiar el resto del código
COPY . .

ENV SUPABASE_URL=""
ENV SUPABASE_SERVICE_ROLE_KEY=""

CMD ["pnpm", "scrape"]

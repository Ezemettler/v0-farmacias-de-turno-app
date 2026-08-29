FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --prod=false --frozen-lockfile || pnpm install --prod=false --no-frozen-lockfile

COPY . .

ENV SUPABASE_URL=""
ENV SUPABASE_SERVICE_ROLE_KEY=""
ENV TELEGRAM_BOT_TOKEN=""
ENV TELEGRAM_WEBHOOK_SECRET=""
ENV ANTHROPIC_API_KEY=""
ENV PORT=8080

EXPOSE 8080

CMD ["pnpm", "start"]

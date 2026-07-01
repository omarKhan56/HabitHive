FROM node:20-alpine AS base
WORKDIR /repo

COPY package.json ./
COPY apps/worker ./apps/worker
COPY apps/web/prisma ./apps/web/prisma

WORKDIR /repo/apps/worker
RUN npm install
RUN npx prisma generate --schema=../web/prisma/schema.prisma
RUN npm run build

CMD ["npm", "start"]

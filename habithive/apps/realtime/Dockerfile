FROM node:20-alpine AS base
WORKDIR /repo

COPY package.json ./
COPY packages/shared ./packages/shared
COPY apps/realtime ./apps/realtime

WORKDIR /repo/apps/realtime
RUN npm install
RUN npx prisma generate --schema=../web/prisma/schema.prisma
RUN npm run build

EXPOSE 4000
CMD ["npm", "start"]

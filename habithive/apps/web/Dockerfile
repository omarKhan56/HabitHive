FROM node:20-alpine AS base
WORKDIR /repo

COPY package.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

WORKDIR /repo/apps/web
RUN npm install
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

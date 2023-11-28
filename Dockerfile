FROM node:20-alpine
RUN corepack enable

COPY package.json pnpm-lock.yaml /code
WORKDIR /code
RUN pnpm install

COPY . .

CMD pnpm build:pkg

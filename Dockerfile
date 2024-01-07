FROM node:20-alpine
RUN corepack enable

COPY package.json pnpm-lock.yaml /code
WORKDIR /code
RUN pnpm fetch

ADD . ./
RUN pnpm install --offline

CMD pnpm build:pkg

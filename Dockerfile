FROM node:23-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && \
  pnpm i -g pnpm@latest

COPY package.json pnpm-lock.yaml /code/
WORKDIR /code
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --ignore-scripts --frozen-lockfile

COPY . ./

RUN pnpm postinstall
CMD [ "pnpm", "build:pkg" ]

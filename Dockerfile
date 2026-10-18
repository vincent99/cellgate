FROM node:20-alpine
WORKDIR /src

COPY package.json yarn.lock ./
RUN yarn --pure-lockfile

COPY . .

CMD ["node", "index.mjs"]

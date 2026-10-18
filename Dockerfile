FROM node:26-alpine
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm install

COPY . .

CMD ["node", "index.mjs"]

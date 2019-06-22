FROM node:lts

ENV NODE_ENV production

WORKDIR /opt/clickroad

COPY src src
COPY package.json package.json

RUN npm install

ENTRYPOINT [ "node", "src/start-server.js" ]

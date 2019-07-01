FROM node:lts

ENV NODE_ENV production

WORKDIR /opt/clickroad

COPY lib lib
COPY proto proto
COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

ENTRYPOINT [ "node", "lib/start.js" ]

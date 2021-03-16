FROM node:12-alpine

WORKDIR /app
COPY . /app

RUN npm i ; npm run build ; npm prune --production

ENTRYPOINT [ "node", "dist/TrivaDataPublishAgent.js" ]
FROM node:18-alpine3.17 as development

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

FROM development as build

ENV NODE_PATH=./build

RUN npm run build
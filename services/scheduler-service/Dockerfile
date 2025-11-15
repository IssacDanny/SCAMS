FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# This service doesn't need an exposed port, as it doesn't have an API.
CMD [ "npm", "start" ]
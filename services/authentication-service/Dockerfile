FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# For bcrypt, some native compilation might be needed, so we install build tools
RUN npm install

COPY . .

EXPOSE 3002

CMD [ "npm", "start" ]
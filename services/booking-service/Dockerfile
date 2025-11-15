FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Expose the port for the Booking Service
EXPOSE 3003

CMD [ "npm", "start" ]
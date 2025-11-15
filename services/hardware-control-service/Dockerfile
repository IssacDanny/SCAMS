# Use the standard, lightweight Node.js base image.
FROM node:18-alpine

# Set the working directory for all subsequent commands.
WORKDIR /usr/src/app

# Copy package files and install dependencies first to leverage Docker's build cache.
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code.
COPY . .

# No EXPOSE instruction is needed because this service is a background worker
# and does not listen for incoming HTTP traffic.

# Define the default command to run when the container starts.
CMD [ "npm", "start" ]
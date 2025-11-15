# Stage 1: Use a specific, secure, and small Node.js version as the base image.
# Using '-alpine' results in a much smaller final image.
FROM node:18-alpine

# Set the working directory inside the container. All subsequent commands run here.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first.
# This leverages Docker's layer caching. The 'npm install' step will only be
# re-run if these files change, dramatically speeding up subsequent builds.
COPY package*.json ./

# Install application dependencies inside the container.
RUN npm install

# Copy the rest of the application's source code into the container.
COPY . .

# Expose the port that the application will run on.
# This port is specified inside index.js and configured via environment variables.
EXPOSE 3001

# Define the default command to run when the container starts.
# This executes the "start" script defined in our package.json.
CMD [ "npm", "start" ]
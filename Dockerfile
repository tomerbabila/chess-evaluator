# Use Node official image with Debian base (compatible with Ubuntu)
FROM node:20-slim

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package files and install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy all project files into container
COPY . .

# Make sure Stockfish binary is executable
RUN chmod +x ./stockfish/stockfish

# Install nodemon globally for hot reload in dev
RUN npm install -g nodemon

# Expose the port your Express app listens on
EXPOSE 3000

# Run nodemon to watch for changes in the 'src' folder and restart server automatically
CMD ["npm", "start"]

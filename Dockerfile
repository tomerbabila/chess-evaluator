# Base image with Node.js
FROM node:20-alpine

# Install dependencies needed to run Stockfish
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Download Stockfish binary into engine folder
RUN mkdir -p ./engine && \
    curl -L https://stockfishchess.org/files/stockfish-ubuntu-x86-64-avx2.zip -o /tmp/sf.zip && \
    unzip /tmp/sf.zip -d /tmp/sf && \
    mv /tmp/sf/stockfish* ./engine/stockfish && \
    chmod +x ./engine/stockfish

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]

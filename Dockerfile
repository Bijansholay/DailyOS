# Step 1: Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package metadata and install dependencies
COPY package*.json ./
RUN npm ci

# Copy full application source code
COPY . .

# Build Vite frontend bundle
RUN npm run build

# Expose server port (default 3001)
EXPOSE 3001

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Start server
CMD ["node", "server/index.js"]

FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set build-time DATABASE_URL for Prisma generate
ARG DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
ENV DATABASE_URL=$DATABASE_URL

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript (this creates dist folder)
RUN npm run build

# Expose port
EXPOSE 4000

# Start the server - use the compiled JS from dist
CMD ["node", "dist/server.js"]
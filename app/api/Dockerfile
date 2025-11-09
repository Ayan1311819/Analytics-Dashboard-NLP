FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema
COPY prisma ./prisma/

# Install ALL dependencies (including Prisma)
RUN npm install

# Copy all source code
COPY . .

# Set DATABASE_URL for Prisma generate
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 4000

# Start server directly - NO BUILD NEEDED
CMD ["node", "src/server.js"]
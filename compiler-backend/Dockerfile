# Use Node.js 24 Alpine image
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk update && apk add --no-cache g++ python3 openjdk17-jdk bash

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Create directories for outputs and codes
RUN mkdir -p outputs codes

# Expose compiler-backend port
EXPOSE 8000

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Start the compiler-backend service
CMD ["npm", "start"] 
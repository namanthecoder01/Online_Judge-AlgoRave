# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Expose port (default 5000)
EXPOSE 5000

# Set environment variable for compiler-backend URL (can be overridden)
ENV COMPILER_BACKEND_URL=http://13.53.112.15:8000

# Start the backend server
CMD ["node", "index.js"]

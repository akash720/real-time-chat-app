FROM node:18-slim as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build || (echo "Build failed!" && exit 1)

# Production stage
FROM node:18-slim

WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy build files from builder stage
COPY --from=builder /app/build ./build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD serve -s build -l tcp://0.0.0.0:3000 
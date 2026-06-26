# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package configuration files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Set default build arguments (can be overridden during build)
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=956878170808-u4jtjivp4nqob35910ef173jr0k2ea6n.apps.googleusercontent.com

# Map build arguments to environment variables so Next.js embeds them during build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Build the Next.js application
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy build artifacts and dependencies from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose port 3000 for the Next.js app
EXPOSE 3000

# Start the Next.js server in production mode
CMD ["npm", "run", "start"]

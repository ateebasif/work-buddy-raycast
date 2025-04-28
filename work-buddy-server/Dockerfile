FROM node:22.12.0-alpine3.21

# Set working directory
WORKDIR /app

# Install pnpm globally (avoid corepack)
RUN npm install -g pnpm@9.0.5

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including ts-node for runtime)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose the app port
EXPOSE 4000

# Start the app
CMD ["pnpm", "run", "dev"]



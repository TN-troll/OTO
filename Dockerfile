FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
COPY .npmrc ./

# Install dependencies with npm install (not ci)
RUN npm install --workspaces --include-workspace-root

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Start with tsx
CMD ["npx", "tsx", "backend/src/index.ts"]

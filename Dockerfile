FROM node:22-slim

WORKDIR /app

# Copy all package files for workspace install
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
COPY .npmrc ./

# Install all dependencies
RUN npm install --workspaces --include-workspace-root

# Copy all source code
COPY . .

# Build the frontend (Vite produces dist/ folder)
RUN cd frontend && npx vite build

# Expose port
EXPOSE 4000

# Start the backend (which also serves the frontend static files)
CMD ["npx", "tsx", "backend/src/index.ts"]

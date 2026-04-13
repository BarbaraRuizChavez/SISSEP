# 7.2 Docker y Contenedores

## Resumen

Este documento especifica la configuración de Docker para contenerizar y desplegar SISSEP en cualquier ambiente.

## Arquitectura de Contenedores

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE STACK                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐                                               │
│   │   NGINX     │  ← Reverse Proxy + Load Balancer             │
│   │  (Port 80)  │                                               │
│   └──────┬──────┘                                               │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  Frontend   │    │  Frontend   │    │  Frontend   │        │
│   │  (Next.js)  │    │  (Next.js)  │    │  (Next.js)  │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │               │
│          └──────────────────┼──────────────────┘               │
│                             │                                   │
│                             ▼                                   │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   Backend   │    │   Backend   │    │   Backend   │        │
│   │  (Node.js)  │◄───│  (Node.js)  │◄───│  (Node.js)  │        │
│   │   :3000     │    │   :3000     │    │   :3000     │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │               │
│          └──────────────────┼──────────────────┘               │
│                             │                                   │
│                             ▼                                   │
│   ┌──────────────────────────────────────────────────────┐    │
│   │                 PostgreSQL                           │    │
│   │               (Database)                             │    │
│   │                   :5432                              │    │
│   └──────────────────────────────────────────────────────┘    │
│                             │                                   │
│                             ▼                                   │
│   ┌──────────────────────────────────────────────────────┐    │
│   │                 Redis                                │    │
│   │               (Cache + Sessions)                     │    │
│   │                   :6379                              │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Dockerfile - Backend

```dockerfile
# backend/Dockerfile

# ─────────────────────────────────────────────
# Stage 1: Dependencies
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# ─────────────────────────────────────────────
# Stage 2: Builder (para compilar si es necesario)
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm ci

# ─────────────────────────────────────────────
# Stage 3: Production
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copiar dependencias desde stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Cambiar a usuario no-root
USER nodejs

# Comando de inicio
CMD ["node", "src/server.js"]
```

## Dockerfile - Frontend

```dockerfile
# frontend/Dockerfile

# ─────────────────────────────────────────────
# Stage 1: Dependencies
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ─────────────────────────────────────────────
# Stage 2: Builder
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de producción
RUN npm run build

# ─────────────────────────────────────────────
# Stage 3: Runner
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instalar serve
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

## Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  # ───────────────────────────────────────────
  # PostgreSQL Database
  # ───────────────────────────────────────────
  postgres:
    image: postgres:15-alpine
    container_name: sissep_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${PG_DATABASE:-sissep}
      POSTGRES_USER: ${PG_USER:-postgres}
      POSTGRES_PASSWORD: ${PG_PASSWORD:-changeme}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - sissep_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${PG_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ───────────────────────────────────────────
  # Redis Cache
  # ───────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: sissep_redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - sissep_network
    command: redis-server --appendonly yes

  # ───────────────────────────────────────────
  # Backend API
  # ───────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sissep_backend
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3000
      PG_HOST: postgres
      PG_PORT: 5432
      PG_DATABASE: ${PG_DATABASE:-sissep}
      PG_USER: ${PG_USER:-postgres}
      PG_PASSWORD: ${PG_PASSWORD:-changeme}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:5173}
    volumes:
      - uploads_data:/app/uploads
    ports:
      - "3000:3000"
    networks:
      - sissep_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ───────────────────────────────────────────
  # Frontend
  # ───────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sissep_frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: ${VITE_API_URL:-http://localhost:3000/api}
    ports:
      - "5173:3000"
    networks:
      - sissep_network
    depends_on:
      - backend

  # ───────────────────────────────────────────
  # Nginx Reverse Proxy
  # ───────────────────────────────────────────
  nginx:
    image: nginx:alpine
    container_name: sissep_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - sissep_network
    depends_on:
      - frontend
      - backend

# ─────────────────────────────────────────────
# Volumes
# ─────────────────────────────────────────────
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  uploads_data:
    driver: local

# ─────────────────────────────────────────────
# Networks
# ─────────────────────────────────────────────
networks:
  sissep_network:
    driver: bridge
```

## Docker Compose Override (Desarrollo)

```yaml
# docker-compose.override.yml (usar en dev)

version: '3.8'

services:
  backend:
    volumes:
      - ./backend/src:/app/src
      - ./backend/package.json:/app/package.json
    environment:
      NODE_ENV: development
    command: npm run dev
    
  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
    command: npm run dev
    
  postgres:
    ports:
      - "5432:5432"  # Exponer en desarrollo
```

## Nginx Configuration

```nginx
# nginx/nginx.conf

events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # API
        location /api {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        }

        # Login endpoint con rate limit estricto
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Archivos estáticos
        location /uploads {
            alias /app/uploads;
            expires 1M;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Health Checks

```javascript
// backend/src/healthcheck.js

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

## Scripts de Utilidad

```bash
#!/bin/bash
# scripts/docker.sh

case "$1" in
  start)
    echo "Starting SISSEP..."
    docker-compose up -d
    ;;
  stop)
    echo "Stopping SISSEP..."
    docker-compose down
    ;;
  restart)
    echo "Restarting SISSEP..."
    docker-compose restart
    ;;
  logs)
    docker-compose logs -f
    ;;
  migrate)
    docker-compose exec backend npm run migrate
    ;;
  seed)
    docker-compose exec backend npm run seed
    ;;
  backup)
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec postgres pg_dump -U postgres sissep > "backups/$BACKUP_FILE"
    echo "Backup created: $BACKUP_FILE"
    ;;
  restore)
    if [ -z "$2" ]; then
      echo "Usage: $0 restore <backup_file>"
      exit 1
    fi
    docker-compose exec -T postgres psql -U postgres sissep < "$2"
    ;;
  update)
    echo "Updating SISSEP..."
    docker-compose pull
    docker-compose up -d --build
    ;;
  clean)
    echo "Cleaning up..."
    docker-compose down -v
    docker system prune -f
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs|migrate|seed|backup|restore|update|clean}"
    exit 1
    ;;
esac
```

## Dockerignore

```
# backend/.dockerignore

# Dependencies
node_modules
npm-debug.log

# Environment
.env
.env.local
.env.*.local

# Development
.git
.gitignore
README.md
.eslintrc
.prettierrc
.vscode
.idea

# Tests
__tests__
*.test.js
*.spec.js
jest.config.js

# Logs
logs
*.log

# Misc
.DS_Store
coverage
.nyc_output
```

## Comandos Docker Útiles

```bash
# Despliegue completo
docker-compose up -d

# Escalar backend a 3 instancias
docker-compose up -d --scale backend=3

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Ejecutar comando en contenedor
docker-compose exec backend npm run migrate

# Acceder a shell del contenedor
docker-compose exec backend sh

# Base de datos
docker-compose exec postgres psql -U postgres -d sissep

# Reiniciar servicio
docker-compose restart backend

# Reconstruir imagen
docker-compose up -d --build backend

# Limpiar todo
docker-compose down -v
docker system prune -a
```

## Monitoreo de Contenedores

```bash
# Ver uso de recursos
docker stats

# Ver procesos
docker-compose top

# Inspeccionar red
docker network inspect sissep_sissep_network

# Ver volúmenes
docker volume ls
```

---

**Ver también:**
- [01. Ambientes](./01-environments.md) - Configuración por ambiente
- [06. Seguridad](../06-quality/03-security.md) - Seguridad en contenedores

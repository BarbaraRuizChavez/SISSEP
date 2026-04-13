# 6.2 Estrategias de Escalabilidad

## Resumen

Este documento detalla las estrategias implementadas y planificadas para asegurar que SISSEP pueda escalar según crece la demanda.

## Arquitectura para Escalabilidad

```
┌─────────────────────────────────────────────────────────────────┐
│                        ESCALABILIDAD HORIZONTAL                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐                                                  │
│   │  NGINX   │  ← Load Balancer                                │
│   └────┬─────┘                                                  │
│        │                                                        │
│   ┌────┴────┬──────────┬──────────┐                            │
│   │         │          │          │                             │
│   ▼         ▼          ▼          ▼                             │
│ ┌────┐  ┌────┐    ┌────┐    ┌────┐                            │
│ │API │  │API │    │API │    │API │    ← Node.js Instances      │
│ │ #1 │  │ #2 │    │ #3 │    │ #N │                            │
│ └────┘  └────┘    └────┘    └────┘                            │
│   │       │        │        │                                  │
│   └───────┴────────┴────────┘                                  │
│              │                                                  │
│              ▼                                                  │
│   ┌──────────────────┐                                          │
│   │    PostgreSQL    │  ← Database (con read replicas)        │
│   │    (Primary)     │                                          │
│   └──────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Estado Actual vs Futuro

| Componente | Estado Actual | Estrategia Futura |
|------------|---------------|-------------------|
| **Servidor** | Single Node.js instance | Horizontal scaling con Docker Swarm/K8s |
| **Base de Datos** | Single PostgreSQL | Primary + Read replicas |
| **Archivos** | Filesystem local | Object Storage (S3/MinIO) |
| **Cache** | None | Redis para sesiones y datos frecuentes |
| **CDN** | None | CloudFront/Cloudflare para assets |

## Estrategias Implementadas

### 1. Stateless Backend

El backend es **stateless** - no mantiene estado en memoria entre requests.

```javascript
// ✅ CORRECTO - Stateless
app.get('/api/users', async (req, res) => {
  // Cada request es independiente
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});

// ❌ INCORRECTO - Stateful (evitar)
const cache = {}; // Estado en memoria
app.get('/api/users', (req, res) => {
  if (cache.users) {
    res.json(cache.users); // No escala
  }
});
```

**Beneficios:**
- Cualquier instancia puede manejar cualquier request
- Fácil agregar/eliminar instancias
- No hay "sticky sessions" requeridas

### 2. Connection Pooling

```javascript
// config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  // Configuración de pool
  max: 20,                    // Máximo de conexiones
  idleTimeoutMillis: 30000, // Cerrar conexiones idle
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

### 3. Índices de Base de Datos

```sql
-- Índices críticos para rendimiento
CREATE INDEX CONCURRENTLY idx_users_control_number ON users(control_number);
CREATE INDEX CONCURRENTLY idx_users_role ON users(role) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_documents_student_program ON documents(student_id, program_type);
CREATE INDEX CONCURRENTLY idx_documents_status ON documents(status) WHERE status IN ('pending', 'under_review');
```

### 4. Paginación

```javascript
// Controller con paginación
async getUsers(req, res) {
  const page = parseInt(req.query.page) || 1;
  const perPage = Math.min(parseInt(req.query.perPage) || 20, 100); // Max 100
  
  const users = await userService.getUsers({
    skip: (page - 1) * perPage,
    take: perPage
  });
  
  res.json({
    data: users,
    meta: {
      page,
      perPage,
      total: await userService.count(),
      totalPages: Math.ceil(total / perPage)
    }
  });
}
```

## Estrategias Futuras

### 1. Redis Cache

```javascript
// services/cache.service.js
const Redis = require('redis');

const client = Redis.createClient({
  url: process.env.REDIS_URL
});

class CacheService {
  async get(key) {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set(key, value, ttl = 3600) {
    await client.setEx(key, ttl, JSON.stringify(value));
  }
  
  async delete(key) {
    await client.del(key);
  }
  
  // Cache de sesiones
  async getSession(token) {
    return this.get(`session:${token}`);
  }
  
  async setSession(token, userData, ttl = 3600) {
    return this.set(`session:${token}`, userData, ttl);
  }
}

// Uso en servicios
const cache = new CacheService();

async getUserById(id) {
  // Intentar cache primero
  const cached = await cache.get(`user:${id}`);
  if (cached) return cached;
  
  // Si no está en cache, buscar en BD
  const user = await userModel.findById(id);
  if (user) {
    await cache.set(`user:${id}`, user, 300); // 5 minutos
  }
  
  return user;
}
```

### 2. Read Replicas

```javascript
// config/database.js - Con replicas
const { Pool } = require('pg');

// Primary para escrituras
const primaryPool = new Pool({
  host: process.env.PG_PRIMARY_HOST,
  // ...
});

// Replica para lecturas
const replicaPool = new Pool({
  host: process.env.PG_REPLICA_HOST,
  // ...
});

// Routing inteligente
const db = {
  query: (sql, params) => {
    // SELECTs van a replica, INSERT/UPDATE/DELETE a primary
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return replicaPool.query(sql, params);
    }
    return primaryPool.query(sql, params);
  }
};
```

### 3. Object Storage para Archivos

```javascript
// services/fileStorage.service.js - Con S3
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION
});

class S3StorageService {
  async uploadFile(buffer, key, contentType) {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'private'
    };
    
    await s3.upload(params).promise();
    return `s3://${process.env.S3_BUCKET}/${key}`;
  }
  
  async getSignedUrl(key, expiresIn = 3600) {
    return s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Expires: expiresIn
    });
  }
}
```

### 4. CDN para Assets

```html
<!-- Frontend con CDN -->
<!-- Antes -->
<script src="/static/js/app.js"></script>

<!-- Después -->
<script src="https://cdn.sissep.edu.mx/static/js/app.js"></script>
```

```javascript
// next.config.js - CDN en Next.js
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.sissep.edu.mx' 
    : ''
};
```

## Docker Compose para Escalado

```yaml
# docker-compose.yml - Escalado horizontal
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api

  api:
    build: ./backend
    deploy:
      replicas: 3  # Escalar a 3 instancias
    environment:
      - NODE_ENV=production
      - PG_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=sissep
      - POSTGRES_USER=sissep
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

```nginx
# nginx.conf - Load balancer
upstream api {
    least_conn;
    server api:3000;
    server api:3000;
    server api:3000;
}

server {
    listen 80;
    
    location /api {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoreo de Escalabilidad

### Métricas a Monitorear

```
┌──────────────────────────────────────────────────────────────┐
│                    Métricas de Escalabilidad                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  🖥️  CPU Usage per Container                                  │
│     api-1: 45% ████████████░░░░░░░░░                        │
│     api-2: 52% ██████████████░░░░░░░                        │
│     api-3: 38% ██████████░░░░░░░░░░░                        │
│                                                               │
│  💾 Memory Usage                                              │
│     api-1: 128MB / 512MB █████░░░░░░░                        │
│     api-2: 145MB / 512MB ██████░░░░░░                        │
│     api-3: 112MB / 512MB ████░░░░░░░░                        │
│                                                               │
│  🔄 Request Rate                                              │
│     Current: 450 req/min                                    │
│     Peak: 1,200 req/min (14:00-15:00)                       │
│                                                               │
│  ⏱️ Response Time (p95)                                       │
│     API: 245ms                                               │
│     DB: 15ms                                                 │
│     Cache: 5ms                                               │
│                                                               │
│  🗄️ DB Connections                                           │
│     Active: 8 / 20                                          │
│     Waiting: 0                                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Alertas

```javascript
// monitoring/alerts.js
const alerts = {
  // Escalar si CPU > 70% por 5 minutos
  highCpu: {
    metric: 'cpu_usage_percent',
    threshold: 70,
    duration: '5m',
    action: 'scale_up'
  },
  
  // Escalar si latency > 500ms
  highLatency: {
    metric: 'response_time_p95',
    threshold: 500,
    duration: '2m',
    action: 'scale_up'
  },
  
  // Reducir si CPU < 20% por 10 minutos
  lowCpu: {
    metric: 'cpu_usage_percent',
    threshold: 20,
    duration: '10m',
    action: 'scale_down'
  }
};
```

## Plan de Escalado Progresivo

### Fase 1: Optimización (0-500 usuarios)
- ✅ Índices de BD
- ✅ Connection pooling
- ✅ Stateless architecture
- ◯ Cache con Redis (opcional)

### Fase 2: Vertical (500-2000 usuarios)
- ◯ Aumentar recursos (CPU/RAM)
- ◯ Optimizar queries lentas
- ◯ Read replicas de PostgreSQL

### Fase 3: Horizontal (2000-10000 usuarios)
- ◯ Múltiples instancias Node.js
- ◯ Load balancer (Nginx)
- ◯ Object Storage (S3)
- ◯ CDN para assets

### Fase 4: Microservicios (10000+ usuarios)
- ◯ Separar auth service
- ◯ Separar document service
- ◯ Message queue para procesamiento
- ◯ Kubernetes para orquestación

---

**Ver también:**
- [01. Matriz de Calidad](./01-quality-matrix.md) - Atributos generales
- [07. Deployment](../07-deployment/02-docker.md) - Docker Compose

# 7.1 Ambientes de Despliegue

## Resumen

Este documento define la configuración y gestión de los diferentes ambientes de despliegue para SISSEP: desarrollo, staging y producción.

## Ambientes

```
┌─────────────────────────────────────────────────────────────────┐
│                      PIPELINE DE DESPLIEGUE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   DESARROLLO          STAGING              PRODUCCIÓN          │
│   ───────────         ───────              ──────────          │
│                                                                 │
│   Local/VPS          VPS/Cloud            Cloud/VPS             │
│   localhost          staging.sissep       sissep.edu.mx        │
│                                                                 │
│   ┌─────┐            ┌─────┐              ┌─────┐              │
│   │Dev  │ ────────▶  │ QA  │ ───────────▶ │Prod │              │
│   └─────┘   PR       └─────┘   Release   └─────┘              │
│                                                                 │
│   • Hot reload       • Pre-producción      • Live               │
│   • Debug            • Tests integrados   • Monitoreo          │
│   • Logs verbose     • Datos de prueba    • Backups             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Configuración por Ambiente

### Desarrollo (Development)

```bash
# .env.development
NODE_ENV=development
PORT=3000

# Database
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=sissep_dev
PG_USER=postgres
PG_PASSWORD=dev_password

# Auth
JWT_SECRET=dev-secret-not-for-production
JWT_REFRESH_SECRET=dev-refresh-secret

# Frontend
FRONTEND_URL=http://localhost:5173

# Features
LOG_LEVEL=debug
ENABLE_SWAGGER=true
ENABLE_CORS=true
```

**Características:**
- Hot reload activado
- Logs detallados (debug)
- CORS permitido desde cualquier origen
- Base de datos local con datos de prueba
- Swagger UI disponible
- Sin rate limiting estricto

### Staging (Pre-producción)

```bash
# .env.staging
NODE_ENV=staging
PORT=3000

# Database
PG_HOST=staging-db.internal
PG_DATABASE=sissep_staging

# Auth
JWT_SECRET=staging_secret_min_32_chars_here
JWT_REFRESH_SECRET=staging_refresh_min_32_chars

# Frontend
FRONTEND_URL=https://staging.sissep.edu.mx

# Features
LOG_LEVEL=info
ENABLE_SWAGGER=true
ENABLE_CORS=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Características:**
- Configuración similar a producción
- Datos de prueba realistas
- Tests de integración
- SSL/TLS habilitado
- Rate limiting activo
- Logs estructurados

### Producción

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
PG_HOST=prod-db.internal
PG_DATABASE=sissep_prod
PG_USER=sissep_prod

# Auth (usar generador de contraseñas seguras)
JWT_SECRET=${JWT_SECRET_PROD}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET_PROD}

# Frontend
FRONTEND_URL=https://sissep.edu.mx

# Features
LOG_LEVEL=warn
ENABLE_SWAGGER=false
ENABLE_CORS=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
FORCE_HTTPS=true
TRUST_PROXY=true
```

**Características:**
- Performance optimizada
- Logs mínimos (warn/error)
- Rate limiting estricto
- Sin Swagger
- CORS restringido
- HTTPS obligatorio

## Checklist de Configuración

### Pre-deployment

```markdown
## Antes de desplegar a Staging
- [ ] Tests unitarios pasan (npm test)
- [ ] Tests de integración pasan
- [ ] Build de frontend exitoso (npm run build)
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] Seed data aplicada (si es primera vez)

## Antes de desplegar a Producción
- [ ] Aprobación en staging
- [ ] Backup de base de datos actual
- [ ] Variables de entorno de producción verificadas
- [ ] SSL/TLS certificados válidos
- [ ] Monitoreo configurado
- [ ] Plan de rollback preparado
- [ ] Documentación de cambios actualizada
```

## Gestión de Variables de Entorno

```bash
# Estructura de archivos
backend/
├── .env                 # No commitear - local
├── .env.example         # Template para desarrolladores
├── .env.development     # Desarrollo (puede commitearse si no tiene secrets)
├── .env.staging         # Staging
├── .env.production      # Producción (encriptado o en secret manager)

# Cargar variables según ambiente
NODE_ENV=production node -r dotenv/config src/server.js dotenv_config_path=.env.production
```

### Secret Management

```bash
# Opción 1: Docker Secrets (Swarm/Kubernetes)
echo "my-secret" | docker secret create db_password -

# Opción 2: AWS Secrets Manager
aws secretsmanager create-secret --name sissep/prod/jwt-secret --secret-string "..."

# Opción 3: HashiCorp Vault
vault kv put secret/sissep/prod JWT_SECRET="..."
```

## Base de Datos por Ambiente

| Ambiente | Host | Base de Datos | Acceso |
|----------|------|---------------|--------|
| Development | localhost | sissep_dev | Público |
| Staging | staging-db | sissep_staging | VPN/Internal |
| Production | prod-db | sissep_prod | Internal only |

### Migraciones

```bash
# Desarrollo
npm run migrate:dev

# Staging
npm run migrate:staging

# Producción (con backup previo)
npm run backup:db
npm run migrate:prod
```

## URLs por Ambiente

| Servicio | Desarrollo | Staging | Producción |
|----------|------------|---------|------------|
| Frontend | http://localhost:5173 | https://staging.sissep.edu.mx | https://sissep.edu.mx |
| API | http://localhost:3000/api | https://staging.sissep.edu.mx/api | https://sissep.edu.mx/api |
| Docs | http://localhost:3000/api-docs | https://staging.sissep.edu.mx/api-docs | N/A |
| Health | http://localhost:3000/health | https://staging.sissep.edu.mx/health | https://sissep.edu.mx/health |

## Pipeline CI/CD

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: |
          ssh user@staging "cd /app && git pull && npm ci && pm2 reload all"

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Backup Database
        run: |
          ssh user@production "pg_dump sissep_prod > backup_$(date +%Y%m%d).sql"
      
      - name: Deploy to Production
        run: |
          ssh user@production "cd /app && git pull origin main && npm ci --production && pm2 reload all"
      
      - name: Health Check
        run: |
          curl -f https://sissep.edu.mx/health || exit 1
      
      - name: Notify on Failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-type: application/json' \
            -d '{"text":"Deploy failed!"}'
```

## Rollback

```bash
#!/bin/bash
# scripts/rollback.sh

ENV=$1
VERSION=$2

echo "Rolling back $ENV to version $VERSION..."

# Backup actual
pg_dump sissep_$ENV > backup_pre_rollback_$(date +%Y%m%d_%H%M%S).sql

# Git rollback
git checkout $VERSION

# Reiniciar servicio
pm2 reload sissep-$ENV

# Verificar salud
sleep 5
curl -f https://$ENV.sissep.edu.mx/health

echo "Rollback completed!"
```

## Monitoreo por Ambiente

| Métrica | Desarrollo | Staging | Producción |
|---------|------------|---------|------------|
| Logs | Console | File + Console | File + External (ELK/Loki) |
| Errores | Console | Email alerts | PagerDuty/Opsgenie |
| Performance | Console | Dashboard | Dashboard + Alerts |
| Uptime | N/A | Monitored | SLA: 99.5% |

## Comandos Útiles

```bash
# Verificar health de todos los ambientes
curl http://localhost:3000/health
curl https://staging.sissep.edu.mx/health
curl https://sissep.edu.mx/health

# Comparar versiones
git log --oneline --decorate --graph --all

# Ver variables de entorno cargadas
node -e "require('dotenv').config(); console.log(process.env)"

# Test de carga (k6)
k6 run --env ENV=staging load-test.js
```

---

**Ver también:**
- [02. Docker](./02-docker.md) - Configuración de contenedores

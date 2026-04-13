# 6.1 Matriz de Atributos de Calidad

## Resumen

Este documento define los atributos de calidad esperados para SISSEP, sus rangos requeridos, motivaciones y estrategias para lograrlos.

## Matriz de Calidad

| Atributo de Calidad | Rango Requerido | Motivo | Estrategias para lograr el objetivo |
|---------------------|-----------------|--------|-------------------------------------|
| **Escalabilidad** | Medio | Crecimiento de estudiantes y trámites | - Node.js con procesamiento async<br>- Arquitectura stateless<br>- PostgreSQL con índices optimizados<br>- Cache con Redis (opcional) |
| **Flexibilidad** | Alto | Nuevos tipos de documentos y procesos | - Schema de categorías configurable<br>- Estados de documentos extensibles<br>- Separación de concerns (MVVM) |
| **Disponibilidad** | Alto | Acceso continuo para usuarios durante periodos escolares | - Docker Compose para alta disponibilidad<br>- Backups automáticos diarios<br>- Monitoreo de salud de servicios<br>- Plan de recuperación ante desastres |
| **Usabilidad** | Alto | Experiencia intuitiva para estudiantes y encargados | - Diseño responsive con Tailwind CSS<br>- Feedback visual inmediato (spinner, toasts)<br>- Validaciones en tiempo real<br>- Accesibilidad WCAG 2.1 AA |
| **Rendimiento** | Medio | Carga rápida de documentos y listas | - Índices optimizados en PostgreSQL<br>- Compresión de archivos PDF<br>- Paginación de listas grandes<br>- Lazy loading de componentes |
| **Multi-Lenguaje** | Medio | Soporte institucional bilingüe (español/inglés) | - i18n en React con next-intl<br>- Middleware de localización en Express<br>- Almacenamiento de traducciones en JSON |
| **Accesibilidad** | Alto | Cumplimiento WCAG para todos los usuarios | - ARIA labels en componentes React<br>- Navegación por teclado<br>- Contraste de colores 4.5:1 mínimo<br>- Soporte para lectores de pantalla |
| **Integridad** | Alto | Garantía de datos y archivos correctos | - Constraints FK en PostgreSQL<br>- Validaciones server-side<br>- Hash SHA-256 de archivos<br>- Transacciones ACID |
| **Confiabilidad de Datos** | Alto | Historial inalterable de cambios | - Transacciones PostgreSQL<br>- Tabla de auditoría para cambios<br>- Soft delete para recuperación<br>- Logs de todas las operaciones |
| **Vista** | Alto | Interfaz clara y organizada para paneles | - Diseño consistente en React<br>- Vistas responsivas (mobile-first)<br>- Dashboards con progreso visual<br>- Colores semánticos para estados |

## Atributos Detallados

### 1. Escalabilidad (Rango: Medio)

**Escenario:** El sistema debe soportar el crecimiento de la institución en número de estudiantes y documentos gestionados.

**Medición:**
- Usuarios concurrentes: 100+
- Tiempo de respuesta de API: < 500ms (P95)
- Throughput: 1000+ requests/minuto

**Estrategias implementadas:**
```
✓ Node.js con event loop para I/O concurrente
✓ PostgreSQL con connection pooling
✓ Índices en campos de búsqueda frecuente
✓ Queries optimizadas con EXPLAIN ANALYZE
◯ Redis para cache de sesiones (futuro)
◯ Load balancer con múltiples instancias (futuro)
```

### 2. Flexibilidad (Rango: Alto)

**Escenario:** Debe poder agregarse nuevos tipos de documentos sin cambiar código.

**Medición:**
- Agregar nueva categoría: < 1 hora
- Agregar nuevo programa: < 1 día
- Cambiar flujo de aprobación: < 1 día

**Estrategias implementadas:**
```
✓ Tabla categories configurable desde admin
✓ Estados de documentos como enum extensible
✓ MVVM permite cambiar lógica sin tocar UI
✓ Servicios desacoplados de controllers
```

### 3. Disponibilidad (Rango: Alto)

**Escenario:** El sistema debe estar disponible durante el periodo escolar, especialmente en fechas de entrega de documentos.

**Medición:**
- Uptime: 99.5% (máximo 3.6 horas de downtime/mes)
- Recovery Time Objective (RTO): 4 horas
- Recovery Point Objective (RPO): 1 hora

**Estrategias implementadas:**
```
✓ Health check endpoint /health
✓ Monitoreo con logs estructurados
◯ Docker Compose con restart: always
◯ Backups automáticos diarios (futuro)
◯ Alertas de downtime (futuro)
```

### 4. Usabilidad (Rango: Alto)

**Escenario:** Estudiantes con diferentes niveles de experiencia tecnológica deben usar el sistema sin capacitación extensa.

**Medición:**
- Time to First Task: < 5 minutos
- Tasa de completitud de tareas: > 90%
- NPS (Net Promoter Score): > 7

**Estrategias implementadas:**
```
✓ Diseño responsive con Tailwind CSS
✓ Componentes consistentes (Button, Input, Spinner)
✓ Estados de carga visibles
✓ Mensajes de error claros
✓ Tooltips y ayuda contextual
◯ Tour guiado para nuevos usuarios (futuro)
```

### 5. Rendimiento (Rango: Medio)

**Escenario:** Carga rápida de documentos y navegación fluida.

**Medición:**
- First Contentful Paint (FCP): < 1.8s
- Time to Interactive (TTI): < 3.8s
- Upload de archivo 10MB: < 30s

**Estrategias implementadas:**
```
✓ Índices en PostgreSQL (control_number, status)
✓ Paginación de listas
✓ Lazy loading de imágenes
✓ Compresión gzip en servidor
◯ CDN para assets estáticos (futuro)
```

### 6. Multi-Lenguaje (Rango: Medio)

**Escenario:** Soporte para español (principal) e inglés (secundario) para posible internacionalización.

**Medición:**
- Cobertura de traducciones: > 90%
- Cambio de idioma: < 2 segundos

**Estrategias implementadas:**
```
◯ i18n con next-intl (pendiente)
◯ Archivos de traducción JSON (pendiente)
◯ Selector de idioma en UI (pendiente)
```

### 7. Accesibilidad (Rango: Alto)

**Escenario:** Usuarios con discapacidades visuales o motoras deben poder usar el sistema.

**Medición:**
- WCAG 2.1 Level AA compliance: 100%
- Navegación 100% por teclado
- Compatibilidad con NVDA/JAWS

**Estrategias implementadas:**
```
✓ ARIA labels en componentes UI
✓ Contraste de colores verificado
✓ Focus visible en elementos interactivos
✓ Alt text para imágenes
◯ Skip links (futuro)
◯ Testing con screen readers (futuro)
```

### 8. Integridad (Rango: Alto)

**Escenario:** Los documentos y datos deben mantenerse consistentes y no corromperse.

**Medición:**
- 0 pérdidas de archivos subidos
- 0 inconsistencias de datos
- Integridad verificable de archivos

**Estrategias implementadas:**
```
✓ Constraints FK en PostgreSQL
✓ Validaciones server-side en services
✓ Hash SHA-256 de archivos almacenados
✓ Transacciones ACID para operaciones críticas
✓ Soft delete en lugar de hard delete
```

### 9. Confiabilidad de Datos (Rango: Alto)

**Escenario:** Historial completo de quién cambió qué y cuándo para auditoría.

**Medición:**
- 100% de operaciones críticas auditadas
- Retención de logs: 1 año
- Recuperación de datos: < 4 horas

**Estrategias implementadas:**
```
✓ Tabla status_history para documentos
✓ Timestamps (createdAt, updatedAt) en todas las tablas
✓ Logs estructurados de operaciones
◯ Tabla de auditoría general (futuro)
◯ Replicación de BD (futuro)
```

### 10. Vista (Rango: Alto)

**Escenario:** Paneles claros que muestren el estado de documentación de forma intuitiva.

**Medición:**
- Comprensión del estado al primer vistazo: > 95%
- Satisfacción visual (encuesta): > 4/5

**Estrategias implementadas:**
```
✓ StatusPill con colores semánticos
✓ Barras de progreso visuales
✓ Dashboard con métricas resumidas
✓ Diseño consistente (colores, tipografía)
✓ Responsive para móvil/tablet
```

## Tácticas de Calidad por Categoría

### Tácticas de Tiempo de Ejecución

| Táctica | Aplicación |
|---------|------------|
| Introducir concurrencia | Node.js async/await, connection pooling |
| Mantener múltiples copias | Backups diarios, soft delete |
| Aumentar recursos | Escalado vertical con Docker |

### Tácticas de Arquitectura

| Táctica | Aplicación |
|---------|------------|
| Modularización | Separación en services, models, controllers |
| Ocultar información | Interfaces de servicios bien definidas |
| División de responsabilidades | MVVM en frontend, capas en backend |

## Métricas de Monitoreo

```
┌─────────────────────────────────────────────────────────────┐
│                      DASHBOARD DE CALIDAD                     │
├─────────────────────────────────────────────────────────────┤
│ Disponibilidad: 99.7% ████████████████████░░░               │
│ Latencia (p95): 245ms ████████░░░░░░░░░░░░░░░                │
│ Error rate: 0.3% ███░░░░░░░░░░░░░░░░░░░░░░░░░                │
│ Throughput: 450 req/min ██████████░░░░░░░░░░░                │
└─────────────────────────────────────────────────────────────┘
```

## Plan de Mejora Continua

### Fase 1 (Actual)
- ✅ Implementación base con validaciones
- ✅ Logs básicos
- ✅ Índices de BD

### Fase 2 (Mes 1-2)
- ◯ Tests automatizados (unit + integration)
- ◯ Monitoreo con logs estructurados
- ◯ Documentación de API con Swagger

### Fase 3 (Mes 3-4)
- ◯ Cache con Redis
- ◯ Load testing con k6
- ◯ Optimización de queries

### Fase 4 (Mes 5-6)
- ◯ CDN para archivos estáticos
- ◯ Multi-instancia con load balancer
- ◯ Replicación de BD

---

**Ver también:**
- [02. Escalabilidad](./02-scalability.md) - Estrategias de escalado
- [03. Seguridad](./03-security.md) - Seguridad del sistema
- [04. Accesibilidad](./04-accessibility.md) - WCAG compliance

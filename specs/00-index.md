# SISSEP - Spec-Driven Development (SDD) Documentation

> **Proyecto:** SISSEP (Sistema de Servicio Social y Estancias Profesionales)  
> **Versión:** 1.0  
> **Fecha:** 2026-04-12  
> **Arquitectura:** MVVM + Capas + REST

---

## Índice de Especificaciones

### 1. Arquitectura y Diseño
| Documento | Descripción |
|-----------|-------------|
| [01. Visión General](./01-architecture/01-overview.md) | Resumen arquitectónico, estilos y patrones |
| [02. Componentes MVVM](./01-architecture/02-mvvm-components.md) | Especificación del patrón MVVM |
| [03. Diagramas de Arquitectura](./01-architecture/03-diagrams.md) | Diagramas HLD y LLD |

### 2. Dominio y Datos
| Documento | Descripción |
|-----------|-------------|
| [01. Modelo de Dominio](./02-domain/01-domain-model.md) | Entidades y relaciones del negocio |
| [02. Esquema PostgreSQL](./02-domain/02-postgres-schema.md) | Especificación de base de datos relacional |
| [03. Almacenamiento de Archivos](./02-domain/03-file-storage.md) | Gestión de documentos digitales |

### 3. API REST
| Documento | Descripción |
|-----------|-------------|
| [01. Especificación General](./03-api/01-api-spec.md) | Convenciones y estándares REST |
| [02. Autenticación](./03-api/02-auth-endpoints.md) | Endpoints de login/logout |
| [03. Gestión de Usuarios](./03-api/03-user-endpoints.md) | CRUD de usuarios |
| [04. Gestión de Documentos](./03-api/04-document-endpoints.md) | Upload, review, status |

### 4. Frontend (React + Next.js)
| Documento | Descripción |
|-----------|-------------|
| [01. Estructura de Carpetas](./04-frontend/01-folder-structure.md) | Organización del proyecto |
| [02. ViewModels](./04-frontend/02-viewmodels.md) | Especificación de ViewModels |
| [03. Componentes de Vista](./04-frontend/03-view-components.md) | Props, eventos y renderizado |
| [04. Servicios](./04-frontend/04-services.md) | Llamadas a API y utilidades |

### 5. Backend (Node.js + Express)
| Documento | Descripción |
|-----------|-------------|
| [01. Estructura de Carpetas](./05-backend/01-folder-structure.md) | Organización del proyecto |
| [02. Controladores](./05-backend/02-controllers.md) | Especificación de controllers |
| [03. Servicios](./05-backend/03-services.md) | Lógica de negocio |
| [04. Modelos](./05-backend/04-models.md) | Entidades y acceso a datos |

### 6. Atributos de Calidad
| Documento | Descripción |
|-----------|-------------|
| [01. Matriz de Calidad](./06-quality/01-quality-matrix.md) | Objetivos y estrategias |
| [02. Escalabilidad](./06-quality/02-scalability.md) | Estrategias de escalado |
| [03. Seguridad](./06-quality/03-security.md) | Autenticación, autorización, datos |
| [04. Accesibilidad](./06-quality/04-accessibility.md) | WCAG, ARIA, navegación |

### 7. Despliegue
| Documento | Descripción |
|-----------|-------------|
| [01. Ambientes](./07-deployment/01-environments.md) | Dev, staging, producción |
| [02. Docker](./07-deployment/02-docker.md) | Contenedores y orquestación |

---

## Convenciones del Proyecto

### Nomenclatura
- **Frontend:** PascalCase para componentes, camelCase para funciones
- **Backend:** camelCase para todo
- **BD:** snake_case para tablas y columnas
- **API:** kebab-case para endpoints REST

### Stack Tecnológico
| Capa | Tecnología |
|------|------------|
| Frontend | React 18.2, Next.js 14, TypeScript 5.4, Tailwind CSS 3.4 |
| Backend | Node.js 20 LTS, Express 4.19 |
| Base de Datos | PostgreSQL 15 |
| Almacenamiento | Sistema de archivos local (producción: cloud) |

---

## Estado de Implementación

```
[==========] 100% Documentación inicial creada
[          ] 0% Implementación según specs
```

Última actualización: 2026-04-12

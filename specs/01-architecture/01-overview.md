# 1.1 Visión General de la Arquitectura

## Resumen

SISSEP es una aplicación web institucional multiusuario que centraliza la gestión documental de los procesos de servicio social y residencias profesionales.

## Tipo de Aplicación

- **Tipo:** Aplicación Web Institucional Multiusuario
- **Arquitectura:** Por Capas + MVVM + REST
- **Modalidad:** Cliente-Servidor con comunicación HTTP

## Estilos Arquitectónicos

### 1. Arquitectura en Capas (Layered Architecture)

```
┌─────────────────────────────────────┐
│           CAPA DE PRESENTACIÓN      │  ← React + Next.js (View)
│  (Frontend - Interfaz de Usuario)   │
├─────────────────────────────────────┤
│           CAPA DE APLICACIÓN        │  ← ViewModels
│  (Lógica de presentación)           │
├─────────────────────────────────────┤
│           CAPA DE SERVICIOS         │  ← API REST
│  (Controllers + Business Logic)     │
├─────────────────────────────────────┤
│           CAPA DE DATOS             │  ← PostgreSQL
│  (Persistencia y almacenamiento)    │
└─────────────────────────────────────┘
```

### 2. Patrón MVVM (Model-View-ViewModel)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    VIEW     │ ←→ │  VIEWMODEL  │ ←→ │    MODEL    │
│   (React)   │     │  (Hooks/    │     │ (Entities/  │
│             │     │  Services)  │     │  Services)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                    Data Binding
```

**Responsabilidades:**

| Componente | Responsabilidad | Tecnología |
|------------|-----------------|------------|
| **Model** | Entidades de dominio, estructura de datos, acceso a BD | PostgreSQL, Mongoose |
| **View** | Interfaz gráfica, mostrar información, capturar eventos | React + Tailwind |
| **ViewModel** | Intermediario, gestión de estado, lógica para la Vista | React Hooks + Services |

### 3. Arquitectura REST

El frontend consume servicios del backend mediante HTTP:

```
Frontend (Next.js)          Backend (Express)
      │                             │
      │  GET /api/users             │
      │────────────────────────────>│
      │                             │
      │  [ { id: 1, name: "..." } ] │
      │<────────────────────────────│
      │                             │
      │  POST /api/documents        │
      │  { file: ..., category: "" } │
      │────────────────────────────>│
```

## Flujo de Datos MVVM

```
Usuario interactúa con View
         ↓
View emite eventos al ViewModel
         ↓
ViewModel procesa lógica y llama al Model/Service
         ↓
Model accede a la API/BD
         ↓
ViewModel actualiza estado observable
         ↓
View se re-renderiza con nuevos datos
```

## Tecnologías por Capa

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| Presentación | React | 18.2 | UI Components |
| Framework UI | Next.js | 14 | SSR, Routing |
| Estilos | Tailwind CSS | 3.4 | Diseño responsive |
| Lenguaje | TypeScript | 5.4 | Tipado estático |
| Backend | Node.js | 20 LTS | Runtime |
| Framework API | Express | 4.19 | API REST |
| Base de Datos | PostgreSQL | 15 | Datos estructurados |
| ORM/Query | pg (node-postgres) | ^8.19 | Acceso a BD |

## Decisiones Arquitectónicas

### DEC-001: Uso de MVVM sobre MVC tradicional
**Estado:** Aceptada  
**Contexto:** Se necesita separar la lógica de UI del procesamiento de datos  
**Decisión:** Usar MVVM con React Hooks como ViewModels  
**Consecuencias:**
- ✅ Reutilización de lógica entre componentes
- ✅ Testing más fácil de la lógica
- ✅ Separación clara de responsabilidades
- ⚠️ Curva de aprendizaje para desarrolladores

### DEC-002: PostgreSQL como base de datos principal
**Estado:** Aceptada  
**Contexto:** Datos estructurados con relaciones complejas (usuarios, documentos, trámites)  
**Decisión:** Usar PostgreSQL con constraints de integridad referencial  
**Consecuencias:**
- ✅ Integridad de datos garantizada
- ✅ Transacciones ACID
- ✅ Soporte para JSON si se necesita flexibilidad
- ⚠️ Menos escalable horizontalmente que NoSQL

### DEC-003: Almacenamiento de archivos en filesystem
**Estado:** Aceptada  
**Contexto:** Archivos PDF, imágenes subidos por estudiantes  
**Decisión:** Guardar archivos en carpeta local, guardar ruta en BD  
**Consecuencias:**
- ✅ Simplicidad inicial
- ✅ Fácil backup
- ⚠️ Requiere migración a cloud storage en producción

## Diagrama de Componentes de Alto Nivel

```
                    ┌─────────────────────┐
                    │      CLIENTE        │
                    │   (Navegador Web)   │
                    └─────────┬───────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Views     │  │ ViewModels  │  │   Services (API)    │  │
│  │  (Pages)    │←→│   (Hooks)   │←→│    (Axios/fetch)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/JSON
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Express)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │ Controllers │  │      Services       │  │
│  │   (API)     │←→│  (Handlers) │←→│  (Business Logic)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Middleware  │  │   Models    │  │      Config         │  │
│  │  (Auth,    │  │ (Entities)  │  │   (DB, Env)         │  │
│  │   CORS)    │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │    POSTGRESQL       │
                    │  (Datos estructurados)
                    └─────────────────────┘
```

## Relación con Requisitos

| Requisito | Estrategia Arquitectónica |
|-----------|---------------------------|
| Gestión documental | MVVM separando lógica de subida/revisión |
| Roles (estudiante/encargado) | ViewModels condicionales por rol |
| Seguimiento de estados | Modelo state machine en backend |
| Multiusuario | Arquitectura stateless REST |
| Seguridad | Middleware de auth, validaciones server-side |

---

**Próximo paso:** Ver [02. Componentes MVVM](./02-mvvm-components.md)

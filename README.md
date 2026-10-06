# CityFixer

Plataforma de reporte y gestión de incidencias urbanas. Los vecinos reportan
problemas en la vía pública (con foto y ubicación) y un panel de administración
los agrupa, prioriza y les da seguimiento. Incluye validación y agrupamiento
automático de reportes mediante IA.

## Stack

| Capa      | Tecnología |
|-----------|------------|
| Backend   | Node.js + Express 5, MongoDB (Mongoose) |
| Frontend  | React 18 + Vite, Tailwind CSS |
| Auth      | Clerk + JWT propio (ver [docs/arquitectura.md](docs/arquitectura.md)) |
| Tiempo real | Socket.IO |
| Imágenes  | Cloudinary |
| IA        | Google Gemini |
| Mapas     | Mapbox |
| Email     | Brevo (API HTTP) |

## Estructura del repositorio

```
Citydent/
├── BackEnd/            # API REST (Express + MongoDB)
│   ├── config/         # Conexión a Mongo y variables de entorno (.env)
│   ├── routes/         # Definición de endpoints por recurso
│   ├── controllers/    # Manejo de request/response (sin lógica de negocio)
│   ├── services/       # Lógica de negocio y acceso a datos
│   ├── models/         # Esquemas Mongoose
│   ├── middlewares/    # Auth, validaciones, uploads, IA
│   ├── utils/          # Seeds, logger, scripts auxiliares
│   └── index.js        # Punto de entrada del servidor
│
├── CityFixer/          # Aplicación web (React + Vite)
│   └── src/
│       ├── pages/      # Vistas
│       ├── components/ # Componentes reutilizables (auth, admin, map, ...)
│       ├── services/   # Llamadas a la API
│       ├── hooks/      # Hooks personalizados
│       └── context/    # Estado global (auth, etc.)
│
└── docs/               # Documentación del proyecto
    ├── arquitectura.md # Diagramas de capas y flujo de una request
    └── templates/      # Plantillas para documentar (ADR, JSDoc, API)
```

Para entender cómo se organiza el backend y el flujo de un reporte, ver
**[docs/arquitectura.md](docs/arquitectura.md)**.

## Requisitos previos

- Node.js 18 o superior
- npm
- Una base de datos MongoDB (local o MongoDB Atlas)
- Cuentas/credenciales de: Clerk, Cloudinary, Google Gemini y un SMTP de email

## Puesta en marcha (local)

El proyecto son **dos aplicaciones** que se levantan por separado. Necesitás dos
terminales.

### 1. Backend

```bash
cd BackEnd
npm install
cp config/.env.example config/.env   # luego completá los valores reales
npm run dev                          # arranca con nodemon en http://localhost:3000
```

> Las variables de entorno están documentadas en
> [BackEnd/config/.env.example](BackEnd/config/.env.example). **Nunca** subas tu
> `.env` real al repo: ya está ignorado en `.gitignore`.

### 2. Frontend

```bash
cd CityFixer
npm install
npm run dev                          # arranca Vite en http://localhost:5173
```

El frontend espera que el backend corra en el puerto configurado en
`FRONTEND_URL` / la URL de la API.

## Scripts disponibles

**Backend** (`BackEnd/`)

| Comando        | Qué hace |
|----------------|----------|
| `npm run dev`  | Servidor con recarga automática (nodemon) |
| `npm start`    | Servidor en modo producción |

**Frontend** (`CityFixer/`)

| Comando         | Qué hace |
|-----------------|----------|
| `npm run dev`   | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualiza el build |
| `npm run lint`  | Linter (ESLint) |

## Documentación

- **API interactiva (Swagger):** con el backend corriendo, abrí
  **http://localhost:3000/api-docs**. Se genera a partir de los bloques
  `@openapi` en `BackEnd/routes/` (config en `BackEnd/config/swagger.js`).
- **[docs/arquitectura.md](docs/arquitectura.md)** — capas, flujo de una request y modelos.
- **[docs/autenticacion.md](docs/autenticacion.md)** — Clerk + JWT, login y onboarding (OTP).
- **[docs/roles-permisos.md](docs/roles-permisos.md)** — qué puede hacer cada rol y reglas de protección.
- **[docs/flujo-estados.md](docs/flujo-estados.md)** — máquina de estados de incidentes y grupos.
- **[docs/acceso-powerbi.md](docs/acceso-powerbi.md)** — cómo conectar Power BI a los datos (OTP).
- **[docs/adr/](docs/adr/)** — decisiones de arquitectura (ADRs).
- **[docs/templates/](docs/templates/)** — plantillas para mantener la doc uniforme entre el equipo.

> Convención: todo `service` o `util` nuevo se documenta con JSDoc
> (ver [docs/templates/jsdoc.template.js](docs/templates/jsdoc.template.js)) y
> toda decisión arquitectural importante se registra como ADR
> (ver [docs/templates/adr.template.md](docs/templates/adr.template.md)).

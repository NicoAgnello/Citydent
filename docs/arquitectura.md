# Arquitectura — CityFixer

> Los diagramas Mermaid de este archivo se renderizan automáticamente en GitHub.

## 1. Visión general por capas

El backend sigue una arquitectura en capas (MVC + servicios). Cada request
atraviesa las capas de afuera hacia adentro; la lógica de negocio vive en los
**services**, no en los controllers.

```mermaid
flowchart TD
    Client["Cliente<br/>(React / scope externo / cron)"]
    Routes["Routes<br/>define endpoints"]
    MW["Middlewares<br/>auth · validaciones · uploads · IA"]
    Ctrl["Controllers<br/>request / response"]
    Svc["Services<br/>lógica de negocio"]
    Models["Models (Mongoose)"]
    DB[("MongoDB")]
    Ext["Servicios externos<br/>Gemini · Cloudinary · Clerk · SMTP"]

    Client --> Routes --> MW --> Ctrl --> Svc
    Svc --> Models --> DB
    Svc --> Ext
```

**Responsabilidad de cada capa**

| Capa | Carpeta | Responsabilidad | No debe |
|------|---------|-----------------|---------|
| Routes | `routes/` | Mapear URL + método a un controller y encadenar middlewares | Tener lógica |
| Middlewares | `middlewares/` | Auth, roles, validación de entrada, subida de fotos, IA | Acceder a la DB directamente |
| Controllers | `controllers/` | Leer el request, llamar al service, responder | Tener lógica de negocio |
| Services | `services/` | Reglas de negocio y acceso a datos vía models | Conocer `req`/`res` |
| Models | `models/` | Esquemas y validaciones de datos | Tener lógica de aplicación |

## 2. Autenticación (doble esquema)

El proyecto convive con **dos mecanismos de autenticación**. Es importante
tenerlo presente al leer las rutas:

- **Clerk** — `clerkMiddleware()` está montado globalmente en `index.js`.
- **JWT propio** — `authMiddleware` / `verifyToken` validan un token firmado con
  `JWT_SECRET` y cargan el usuario de la base en `req.dbUser`.
- **Externo** — `externalAuth` valida un `x-otp-code` (OTP de 24 h, generado por
  un `admin`/`superAdmin` desde la app) para las integraciones por scope externo.
  Ver [acceso-powerbi.md](acceso-powerbi.md).

Los roles se verifican con `verifyRole('user', 'admin', 'superAdmin')` después de
autenticar.

## 3. Flujo de un reporte de incidente

Recorrido de un `POST /api/incidents` desde que el vecino envía el reporte hasta
que queda agrupado. La cadena de middlewares es real (ver
`routes/incident.routes.js`).

```mermaid
sequenceDiagram
    actor User as Vecino
    participant API as Express (middlewares)
    participant AI as Gemini
    participant Svc as incident.service
    participant DB as MongoDB

    User->>API: POST /api/incidents (título, desc, fotos, ubicación)
    API->>API: auth + rol + perfil completo
    API->>API: validar reputación del usuario
    API->>API: subir fotos a Cloudinary
    API->>API: validar ubicación (dentro de barrios)
    API->>AI: validar contenido (aiIncidentValidation)
    AI-->>API: estado (pendiente / dudoso / rechazado) + análisis

    API->>Svc: createIncident(data, userId, aiData, role)
    alt pendiente y confianza >= 0.85 y cercano (20 m)
        Svc->>DB: agregar al IncidentGroup existente
        Note over Svc: priority +1 · re-evaluar representante
    else dudoso / rechazado / confianza baja
        Svc->>DB: crear IncidentGroup propio
        Note over Svc: si dudoso/rechazado: guardar idGrupoCandidato
    end
    Svc->>DB: crear Incident (ref al grupo)
    Svc-->>User: 201 incidente creado
```

> **Regla clave:** el agrupamiento automático solo ocurre para reportes en estado
> `pendiente`, con confianza de la IA `>= 0.85` y proximidad geográfica (~20 m).
> El umbral y este modelo de grupos están documentados como decisiones en los
> [ADRs](adr/README.md) ([ADR-001](adr/001-incidentgroup-fuente-de-verdad.md) y
> [ADR-002](adr/002-umbral-agrupamiento-ia.md)).

## 4. Modelo de datos (núcleo)

El sistema gestiona **grupos de incidentes** (`IncidentGroup`), no incidentes
sueltos. El grupo es la fuente de verdad para `status`, `category` y `priority`;
el `Incident` es el aporte individual e inmutable de cada vecino.

```mermaid
erDiagram
    USER ||--o{ INCIDENT : reporta
    INCIDENT_GROUP ||--|{ INCIDENT : agrupa
    INCIDENT_GROUP ||--|| INCIDENT : "representante"
    STATUS ||--o{ INCIDENT_GROUP : estado
    CATEGORY ||--o{ INCIDENT_GROUP : categoria
    NEIGHBORHOOD ||--o{ INCIDENT_GROUP : ubicacion

    INCIDENT {
        string title
        string description
        string[] photos
        object location
        bool is_dubious
        bool is_cancelled
        bool is_emergency
        ObjectId group
    }
    INCIDENT_GROUP {
        ObjectId status
        ObjectId category
        int priority
        ObjectId representativeId
        ObjectId[] incidents
        object ai_suggestion
        bool is_emergency
        bool isArchived
        date finalizedAt
    }
```

**Conceptos a recordar**

- `Incident.group` es **obligatorio**: todo incidente pertenece siempre a un grupo.
- `is_dubious` es un *flag*, no un estado: el vecino ve "pendiente", el admin ve el flag.
- `is_cancelled` excluye al incidente de la propagación de estado del admin.
- `ai_suggestion.idGrupoCandidato` guarda el grupo destino para un futuro merge de dudosos.

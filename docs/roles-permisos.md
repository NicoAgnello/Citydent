# Roles y permisos

> Qué puede hacer cada tipo de usuario y las reglas que protegen las cuentas
> sensibles.

## Los 4 roles

Definidos en `utils/seed.js`:

| Rol | Descripción |
|-----|-------------|
| `user` | Usuario estándar: reporta y gestiona sus propios incidentes. |
| `admin` | Gestiona incidentes/grupos, categorías y estados. |
| `superAdmin` | Acceso total, incluida la gestión de usuarios y el acceso externo. |
| `ai` | **Usuario de sistema** (`clerkId: 'ai_system'`), no es una persona. Lo usa la IA como autor en el historial de estados. No se loguea. |

El rol por defecto al registrarse es **`user`**.

## Qué puede hacer cada rol

| Acción | user | admin | superAdmin |
|--------|:----:|:-----:|:----------:|
| Reportar incidente | ✅ | ✅ | ✅ |
| Ver / cancelar sus incidentes | ✅ | ✅ | ✅ |
| Ver todos los grupos | — | ✅ | ✅ |
| Cambiar estado / categoría / prioridad de un grupo | — | ✅ | ✅ |
| Ver incidentes e historial de un grupo | — | ✅ | ✅ |
| Crear / editar categorías y estados | — | ✅ | ✅ |
| Reprocesar IA (botón manual) | — | ✅ | ✅ |
| Listar / crear / editar usuarios | — | — | ✅ |
| Cambiar rol / banear usuarios | — | — | ✅ |
| Solicitar OTP de acceso externo (Power BI) | — | ✅ | ✅ |

> Reportar y cancelar requieren además **perfil completo**
> (`requireProfileComplete`, ver [autenticacion.md](autenticacion.md)).

## Reglas de protección de cuentas

Implementadas en `services/user.service.js`. Apuntan a evitar escaladas de
privilegios y bloqueos accidentales:

- **No se puede asignar** los roles `superAdmin` ni `ai` (ni al crear ni al
  cambiar rol). Son intransferibles desde la API.
- **Nadie puede modificar el rol de un `superAdmin`.**
- **No podés cambiar tu propio rol.**
- **No podés banearte a vos mismo** ni **banear a un `superAdmin`**.
- Un usuario **baneado** (`isBanned: true`) recibe 403 en `requireAuth` y
  `verifyRole`: queda sin acceso a la API hasta que lo desbaneen.

## Cómo se aplica en las rutas

Cada ruta protegida usa `verifyRole(...roles)` con la lista de roles permitidos.
Ejemplos (ver `routes/`):

```js
// Solo admin o superAdmin
verifyRole('admin', 'superAdmin')

// Cualquier usuario autenticado
verifyRole('user', 'admin', 'superAdmin')

// Solo superAdmin (gestión de usuarios)
verifyRole('superAdmin')
```

## Reputación: freno anti-spam

Independiente del rol, antes de crear un incidente corre
`validateUserReputation`: si el usuario tiene **5 o más incidentes dudosos**
(`is_dubious`) sin resolver, se le **bloquea** la creación (403) hasta que un
admin resuelva esos dudosos. Ver [flujo-estados.md](flujo-estados.md) y
[ADR-003](adr/003-is-dubious-como-flag.md).

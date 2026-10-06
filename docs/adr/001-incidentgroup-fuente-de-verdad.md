# ADR-001: `IncidentGroup` como fuente de verdad

- **Estado:** Aceptado
- **Fecha:** 2026-06-20
- **Autores:** Equipo CityFixer

## Contexto

Originalmente el sistema gestionaba incidentes individuales y planos. Varios
vecinos podían reportar el mismo problema (ej. el mismo bache) generando
registros duplicados que el admin tenía que gestionar uno por uno: cambiar
estado, prioridad y categoría repetidamente para lo que en realidad era **un
solo problema**.

Esto no escalaba para el panel de administración y hacía imposible tener una
visión única de "cuántos problemas reales hay" vs. "cuántos reportes entraron".

## Decisión

El sistema gestiona **grupos de incidentes** (`IncidentGroup`), no incidentes
sueltos. El grupo es la **fuente de verdad** para `status`, `category` y
`priority`. El `Incident` pasa a ser el aporte individual e inmutable de cada
vecino.

- `Incident.group` es **obligatorio**: todo incidente pertenece siempre a un grupo
  (propio o compartido).
- El admin opera sobre el grupo; los cambios de estado se **propagan** a los
  incidentes del grupo que no estén cancelados.
- Cada grupo tiene un `representativeId`: el incidente más descriptivo, elegido
  por la IA al crear y reevaluado al agregar incidentes.

## Alternativas consideradas

- **Mantener incidentes planos + flag `is_duplicate`** — descartado: obligaba a
  duplicar las operaciones del admin y el modelo `original_incident` se volvía
  frágil. (El modelo `DuplicateIncident` de ese enfoque ya se eliminó del repo).
- **Agrupar solo en la vista (sin modelo)** — descartado: la lógica de
  propagación de estado y prioridad necesita persistencia real.

## Consecuencias

- **Positivas:** una acción del admin afecta a todos los reportes del problema;
  métricas claras (problemas reales vs. reportes); prioridad acumulable.
- **Negativas / costos:** mayor complejidad en la creación (decidir grupo
  existente vs. nuevo, ver [ADR-002](002-umbral-agrupamiento-ia.md)) y en la
  cancelación (reasignar representante, recalcular prioridad).
- **A futuro:** separar las rutas en `/incidents` y `/groups` cuando escale;
  implementar `resolveDubious` (merge de dudosos al grupo candidato).

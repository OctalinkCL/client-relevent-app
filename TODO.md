# TODO — Relevent v2

## Pendiente

### Soft Delete: Eventos y Tareas / Unlink Usuarios

**Decisión tomada:** no eliminar registros, marcar como eliminados.

| Entidad | Estrategia |
|---------|-----------|
| `events` | Soft delete → agregar `deleted_at timestamptz` |
| `tasks` | Soft delete → agregar `deleted_at timestamptz` |
| `company_members` | Hard delete (ya es unlink — no toca `profiles` ni `auth.users`) |
| `member_requests` | Hard delete (sin valor de auditoría) |

**Al eliminar un evento** → también soft-delete en cascada de todas sus tareas.

**Archivos a tocar:**
- Nueva migración: `supabase/migrations/YYYYMMDD_soft_delete_events_tasks.sql`
  - Agregar columnas `deleted_at` a `events` y `tasks`
  - Actualizar SELECT policies para filtrar `deleted_at is null`
  - Agregar UPDATE policy para `events` (admins) — actualmente no existe y hace falta
- `src/features/events/useEventMutations.ts` → agregar `useDeleteEvent()`
- `src/features/tasks/useTaskMutations.ts` → agregar `useDeleteTask()`
- `src/features/events/useEvents.ts` → agregar `.is('deleted_at', null)` (defense-in-depth)
- `src/features/events/EventDetailView.vue` → botón "Eliminar" para admin con confirm
- Vista de detalle de tarea → botón "Eliminar" para admin con confirm

Ver plan completo en: `.claude/plans/que-opinas-de-en-purrfect-lecun.md`

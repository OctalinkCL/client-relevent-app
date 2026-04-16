# Relevent — Nueva Plataforma

## Qué es este proyecto

Nueva versión de Relevent, plataforma de control de acceso a eventos (discotecas, corporativos, hoteles, deportivos, festivales).

Fork paralelo de la versión anterior (Vue 2 + Vuetify 2 + Firebase).
La versión anterior sigue en producción durante el desarrollo — **no tocar ese repo**.

Repo anterior de referencia: `client-relevent-app` (Vue 2 + Firebase)

---

## Stack

| Capa              | Tecnología                                        |
| ----------------- | ------------------------------------------------- |
| Framework         | Vue 3 + Vite + TypeScript                         |
| UI                | shadcn-vue + Tailwind CSS                         |
| Estado (sesión)   | Pinia                                             |
| Estado (servidor) | TanStack Query (`@tanstack/vue-query`)            |
| Router            | Vue Router 4                                      |
| Backend           | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| QR Scan           | `@zxing/browser`                                  |
| Fechas            | `day.js`                                          |

---

## Roles del Sistema

| Rol      | Acceso                                                         |
| -------- | -------------------------------------------------------------- |
| `owner`  | Gestión completa: eventos, equipo, VIP, blacklist, analytics   |
| `seller` | Sus eventos asignados + agregar asistentes individual y grupal |
| `scan`   | Solo escanear QR en puerta                                     |
| `admin`  | Administración del sistema                                     |

**Importante:** Un usuario puede pertenecer a múltiples empresas con roles diferentes.
Por ejemplo, un seller puede trabajar para empresa A y empresa B simultáneamente.

---

## Estructura del Proyecto

```
src/
├── features/
│   ├── auth/         # Login, recovery
│   ├── events/       # CRUD eventos
│   ├── lists/        # Listas de invitados por evento
│   ├── tickets/      # Crear y gestionar tickets
│   ├── access/       # Control de puerta (QR scan)
│   ├── team/         # Gestión de equipo por empresa
│   └── attendees/    # VIP, blacklist
├── shared/
│   ├── components/   # Componentes shadcn-vue reutilizables
│   ├── composables/  # useAuth, useCompany, useCurrentRole, etc.
│   └── lib/
│       ├── supabase.ts
│       ├── rut.ts    # Validación RUT chileno
│       └── dayjs.ts  # Configuración day.js con timezone CL
├── layouts/
│   ├── AppLayout.vue    # Layout autenticado (sidebar + header)
│   ├── AuthLayout.vue   # Layout login/recovery
│   └── ScanLayout.vue   # Pantalla completa para control de puerta
├── router/
│   └── index.ts      # Guards por rol
├── stores/
│   └── auth.ts       # Pinia: user, company, memberships, currentRole
└── main.ts
```

---

## Reglas de Desarrollo

### Estado del servidor

- Usar **TanStack Query** (`useQuery`, `useMutation`) para todos los datos de Supabase.
- **NO** crear stores de Pinia para datos del servidor (eventos, tickets, listas, etc.).
- Pinia **solo** para: sesión de usuario, empresa activa, rol activo, estado de UI.

```ts
// ✅ Correcto
const { data: events, isLoading } = useQuery({
  queryKey: ["events", companyId],
  queryFn: () =>
    supabase.from("events").select("*").eq("company_id", companyId),
});

// ❌ Incorrecto — no poner datos del servidor en Pinia
const eventsStore = useEventsStore();
eventsStore.fetchEvents();
```

### Componentes UI

- Usar **shadcn-vue** para todos los componentes.
- No instalar otras librerías de UI sin discutir primero.
- **Mobile-first**: el flujo de puerta (scan) es el más crítico en móvil.
- Los layouts ScanLayout y AppLayout tienen breakpoints distintos — usar `ScanLayout` solo para la vista de puerta.

### TypeScript

- Tipado estricto habilitado (`strict: true`).
- Definir types para todas las entidades de Supabase (generar desde el schema con `supabase gen types`).
- No usar `any`.

### Fechas

- Siempre usar `day.js`. No usar `new Date()` directamente para formateo.
- Timezone por defecto: `America/Santiago`.
- Configuración en `src/shared/lib/dayjs.ts`.

### Validación de documentos

- RUT chileno: formato `12345678-9`.
- La función de validación está en `src/shared/lib/rut.ts`.
- No usar librerías externas para esto.

---

## Lógica Crítica — Validación de Tickets en Puerta

**No modificar esta lógica sin revisión.** Es el flujo más crítico de la plataforma.

Orden de prioridad al validar un documento/QR:

```
1. attendee.is_blocked === true  →  "Asistente Bloqueado"  (ROJO)    → DENEGAR
2. attendee.is_vip === true      →  "Asistente VIP"        (ÁMBAR)   → ALERTAR / PERMITIR
3. ticket existe && is_active    →  "Ticket Válido"         (VERDE)   → PERMITIR
4. ticket existe && !is_active   →  "Ticket Ya Utilizado"  (ROJO)    → DENEGAR
5. sin ticket                   →  "No Encontrado"         (ROJO)    → DENEGAR
```

Al confirmar ingreso:

- Marcar `tickets.is_active = false`
- Marcar `tickets.entered = true` (o `false` si se rechaza)
- Registrar `tickets.scanned_at` y `tickets.scanned_by`

---

## Base de Datos (Supabase PostgreSQL)

El schema completo está en `supabase/migrations/`.
**RLS (Row Level Security) habilitado en todas las tablas.**
Los datos siempre están scoped a `company_id`.

### Tablas por Fase

**Fase 1 — Auth:**

- `profiles` — extiende `auth.users`
- `companies` — tenants/empresas
- `company_members` — membresía usuario-empresa con rol

**Fase 2 — Eventos:**

- `events` — eventos con `event_type` y `is_public`
- `event_lists` — listas de invitados por evento

**Fase 3 — Asistentes y Tickets:**

- `attendees` — registro de asistentes por empresa (scoped a `company_id`)
- `tickets` — relación evento-asistente (incluye campos para venta futura)

### Tabla `tickets` — Campos para Venta Futura

La tabla incluye `payment_status`, `payment_id`, `price`, `currency`.
Por ahora todos los tickets son `payment_status = 'free'`.
Cuando se integre pasarela de pago, no se necesitará cambiar el schema.

### Tipos de Evento (`event_type`)

```
nightclub   — discoteca (flujo actual)
corporate   — corporativo / conferencias
festival    — festivales, conciertos
hotel       — hoteles, experiencias VIP
sports      — estadios, deportivos
```

---

## Fases de Implementación

| Fase                               | Estado | Contenido                                                   |
| ---------------------------------- | ------ | ----------------------------------------------------------- |
| 1 — Auth + Roles                   | ⬜     | Login, profiles, companies, company_members, guards RBAC    |
| 2 — Eventos + Listas + Equipo      | ⬜     | CRUD eventos, listas, gestión de equipo                     |
| 3 — Asistentes + Tickets + QR Scan | ⬜     | Agregar asistentes, control de puerta, VIP, blacklist, KPIs |

### Criterios de Cierre — Fase 1

- [ ] Owner se loguea y ve su empresa
- [ ] Seller se loguea, ve solo sus rutas, puede pertenecer a múltiples empresas
- [ ] Scan se loguea y ve solo la vista de puerta
- [ ] Logout funciona
- [ ] Guards redirigen correctamente por rol
- [ ] Si un seller pertenece a 2 empresas, puede seleccionar con cuál trabaja

---

## Sistema Anterior (Referencia)

Consultar el repo `platform-relevent` (https://github.com/JuanMaureliaCL/platform-relevent) cuando se dude del comportamiento esperado:

| Archivo                                  | Para qué sirve                                    |
| ---------------------------------------- | ------------------------------------------------- |
| `src/api/tickets.js`                     | Lógica de validación de tickets — replicar exacta |
| `src/api/events.js`                      | CRUD eventos — referencia                         |
| `src/store/modules/attendees.js`         | Real-time listeners → migrar a Supabase Realtime  |
| `src/router/index.js`                    | Guards RBAC — replicar en Vue Router 4            |
| `src/modules/access/Scanner.vue`         | UI puerta (flujo crítico)                         |
| `src/components/event/AttendeeGroup.vue` | Carga grupal de asistentes — mejorar UX           |

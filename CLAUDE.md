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
| `admin`  | Gestión completa: eventos, equipo, tareas, analytics           |
| `seller` | Sus tareas asignadas, puede pertenecer a múltiples empresas    |
| `door`   | Solo escanear QR en puerta                                     |

**Importante:** Un usuario puede pertenecer a múltiples empresas con roles diferentes.
Un seller puede trabajar para empresa A y empresa B simultáneamente.

El rol del usuario está en `company_members.role` (no en `profiles`).

---

## Estructura del Proyecto

```
src/
├── features/
│   ├── auth/         # Login, recovery, join por código de invitación
│   ├── events/       # CRUD eventos + upload flyer
│   ├── staff/        # Gestión de equipo: solicitudes, miembros, link de invitación
│   ├── tasks/        # Tareas asignadas a sellers (create, submit, review)
│   ├── access/       # Control de puerta (QR scan) — pendiente
│   └── attendees/    # Asistentes + tickets — pendiente
├── shared/
│   ├── components/   # Componentes shadcn-vue reutilizables
│   ├── composables/
│   └── lib/
│       ├── supabase.ts
│       ├── validateFile.ts  # Validación de tipo y tamaño de imágenes
│       ├── rut.ts           # Validación RUT chileno
│       └── dayjs.ts         # Configuración day.js con timezone CL
├── layouts/
│   ├── AppLayout.vue    # Layout autenticado (sidebar + header)
│   ├── AuthLayout.vue   # Layout login/recovery
│   └── ScanLayout.vue   # Pantalla completa para control de puerta
├── router/
│   ├── index.ts         # Guards de auth + rol
│   ├── guards.ts        # beforeEach: requiresAuth, requiresCompany, roles
│   └── app.routes.ts    # Rutas con meta.roles para restricción RBAC
├── stores/
│   └── auth.ts       # Pinia: user, company, memberships, activeRole
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
  queryKey: ['events', companyId],
  queryFn: () => supabase.from('events').select('*').eq('company_id', companyId),
})

// ❌ Incorrecto — no poner datos del servidor en Pinia
const eventsStore = useEventsStore()
eventsStore.fetchEvents()
```

### Componentes UI

- Usar **shadcn-vue** para todos los componentes.
- No instalar otras librerías de UI sin discutir primero.
- **Mobile-first**: el flujo de puerta (scan) es el más crítico en móvil.
- Usar `ScanLayout` solo para la vista de puerta.

### TypeScript

- Tipado estricto habilitado (`strict: true`).
- Los tipos de Supabase están en `src/types/database.ts` — regenerar con:
  ```bash
  SUPABASE_ACCESS_TOKEN=<token> npx supabase gen types typescript --project-id fqgeopgivmwmoxbmpzyf > src/types/database.ts
  ```
- No usar `any`. Si una query necesita un join complejo, usar una RPC function.

### Fechas

- Siempre usar `day.js`. No usar `new Date()` directamente para formateo.
- Timezone por defecto: `America/Santiago`.
- Configuración en `src/shared/lib/dayjs.ts`.

### Validación de documentos

- RUT chileno: formato `12345678-9`.
- La función de validación está en `src/shared/lib/rut.ts`.
- No usar librerías externas para esto.

---

## Seguridad — Reglas que NO se negocian

Estas decisiones se tomaron después de un audit completo. Aplicar en todos los módulos nuevos.

### 1. RLS obligatorio en todas las tablas

Toda tabla nueva debe tener RLS habilitado y políticas explícitas.
Los datos siempre deben estar scoped a `company_id` cuando aplique.

```sql
-- Patrón mínimo para una tabla nueva
alter table public.mi_tabla enable row level security;

create policy "mi_tabla: usuario lee los suyos"
  on public.mi_tabla for select
  using (company_id = (
    select company_id from public.company_members
    where user_id = auth.uid() limit 1
  ));
```

### 2. Evitar recursión en RLS — usar SECURITY DEFINER

Si una política necesita consultar `company_members` para saber si el usuario es admin,
**NO** hacer un subquery directo — causa recursión infinita y 500 errors.

Solución: crear una función `SECURITY DEFINER` que bypasea RLS:

```sql
create or replace function public.is_company_admin(p_company_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.company_members
    where company_id = p_company_id
      and user_id = auth.uid()
      and role = 'admin'
  )
$$;

-- Luego usarla en la policy:
create policy "tabla: admin puede insertar"
  on public.mi_tabla for insert
  with check (public.is_company_admin(company_id));
```

Funciones SECURITY DEFINER existentes:
- `public.list_company_members(p_company_id)` — miembros + perfil, solo admin
- `public.list_member_requests(p_company_id)` — solicitudes pendientes, solo admin
- `public.admin_shares_company(member_user_id)` — verifica que admin y user comparten empresa

### 3. Validar archivos antes de subir a Storage

Usar siempre `validateImageFile(file)` de `src/shared/lib/validateFile.ts` antes de cualquier upload.
Valida tipo (JPG/PNG/WEBP) y tamaño máximo (10MB).

```ts
import { validateImageFile } from '@/shared/lib/validateFile'

// En toda función de upload:
validateImageFile(file)
const { error } = await supabase.storage.from('relevent-media').upload(path, file)
```

### 4. Limpiar archivos huérfanos en Storage

Si un upload tiene éxito pero la operación posterior falla, borrar el archivo subido.
Patrón obligatorio en mutations que suben archivos:

```ts
let uploadedPath: string | null = null
try {
  const { url, path } = await uploadFn(...)
  uploadedPath = path
  // ... resto de la operación
} catch (e) {
  if (uploadedPath) {
    await supabase.storage.from('relevent-media').remove([uploadedPath])
  }
  throw e
}
```

### 5. Auth store — nunca dejar estado inconsistente

`fetchProfileAndMemberships` ya tiene try/catch que hace logout limpio si falla.
Si se agregan nuevos campos al store, incluirlos en el bloque de reset del catch.

### 6. Guards RBAC en rutas

Las rutas admin llevan `meta: { roles: ['admin'] }`.
El guard en `src/router/guards.ts` redirige a `/dashboard` si el rol no coincide.

```ts
// En app.routes.ts — rutas que solo admin puede ver:
{ path: '/staff', name: 'staff', component: StaffView, meta: { requiresAuth: true, requiresCompany: true, roles: ['admin'] } }
```

### 7. Storage RLS

El bucket `relevent-media` tiene políticas en `storage.objects`.
Al agregar nuevos tipos de archivos (nueva carpeta en el path), verificar que las políticas cubren el nuevo path o agregar una nueva.

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
**RLS habilitado en todas las tablas.**
Los datos siempre están scoped a `company_id`.

### Tablas implementadas

**Auth + Equipo:**
- `profiles` — extiende `auth.users` (full_name, avatar_url)
- `companies` — tenants/empresas (incluye `code` único para link de invitación)
- `company_members` — membresía usuario-empresa con rol (`admin`, `seller`, `door`)
- `member_requests` — solicitudes de join pendientes (trigger limita a 10 por usuario)

**Eventos:**
- `events` — con `event_type`, `is_public`, `flyer_url`

**Tareas:**
- `tasks` — tarea asignada a sellers de una empresa para un evento
- `task_assignments` — asignación tarea-seller con estado (`pending`, `submitted`, `approved`, `rejected`)
- `task_submissions` — evidencia entregada (screenshot_url, observation)

### Tablas pendientes

**Asistentes + Tickets:**
- `attendees` — registro de asistentes por empresa (scoped a `company_id`)
- `tickets` — relación evento-asistente (incluye campos para venta futura)

### Tabla `tickets` — Campos para Venta Futura

La tabla incluirá `payment_status`, `payment_id`, `price`, `currency`.
Por ahora todos los tickets son `payment_status = 'free'`.

### Tipos de Evento (`event_type`)

```
nightclub   — discoteca (flujo actual)
corporate   — corporativo / conferencias
festival    — festivales, conciertos
hotel       — hoteles, experiencias VIP
sports      — estadios, deportivos
```

---

## Flujo de Incorporación de Sellers (Join Flow)

El único punto de entrada para nuevos sellers es el link de invitación.
No existe registro libre — esto es intencional para evitar usuarios fantasma.

1. Admin copia el link: `https://app.relevent.cl/join?code=XXXX`
2. Seller abre el link → ve el nombre de la empresa → elige "Soy nuevo" o "Ya tengo cuenta"
3. Se crea `member_request` con estado pendiente
4. Admin aprueba en `/staff` → se crea `company_member` y se elimina el request
5. Seller puede unirse a múltiples empresas con el mismo usuario

---

## Fases de Implementación

| Fase                               | Estado | Contenido                                                   |
| ---------------------------------- | ------ | ----------------------------------------------------------- |
| 1 — Auth + Roles                   | ✅     | Login, profiles, companies, company_members, guards RBAC    |
| 2 — Eventos + Equipo + Tareas      | ✅     | CRUD eventos, gestión de equipo, tareas con evidencia       |
| 3 — Asistentes + Tickets + QR Scan | ⬜     | Agregar asistentes, control de puerta, VIP, blacklist, KPIs |

---

## Sistema Anterior (Referencia)

Consultar el repo `platform-relevent` cuando se dude del comportamiento esperado:

| Archivo                                  | Para qué sirve                                    |
| ---------------------------------------- | ------------------------------------------------- |
| `src/api/tickets.js`                     | Lógica de validación de tickets — replicar exacta |
| `src/api/events.js`                      | CRUD eventos — referencia                         |
| `src/store/modules/attendees.js`         | Real-time listeners → migrar a Supabase Realtime  |
| `src/router/index.js`                    | Guards RBAC — replicar en Vue Router 4            |
| `src/modules/access/Scanner.vue`         | UI puerta (flujo crítico)                         |
| `src/components/event/AttendeeGroup.vue` | Carga grupal de asistentes — mejorar UX           |

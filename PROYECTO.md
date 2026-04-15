# Iron Barberos — Documentación del Proyecto

## Descripción

Sistema de agendamiento self-service para barberías. El cliente reserva su turno desde el celular sin necesidad de WhatsApp. El dueño y recepcionista gestionan todo desde un panel admin. La configuración del negocio (barberos, servicios, horarios) se gestiona desde un panel dedicado.

**Objetivo a largo plazo:** producto SaaS escalable para vender a múltiples barberías. El código está pensado para multi-tenant desde el inicio.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 + Vite 6 |
| Routing | React Router v6 |
| Estilos | CSS en línea (sin librerías UI) |
| Storage | Supabase (PostgreSQL) |
| Deploy | Vercel (frontend) + Supabase (base de datos) |

---

## Estructura de carpetas

```
tajos/
├── public/
├── src/
│   ├── config/
│   │   ├── negocio.js        ← datos por defecto del negocio
│   │   └── supabase.js       ← cliente de Supabase (createClient)
│   ├── storage/
│   │   └── index.js          ← capa de abstracción de datos (Supabase)
│   ├── pages/
│   │   ├── Cliente.jsx       ← /  (vista pública de reservas)
│   │   ├── Admin.jsx         ← /admin (panel de gestión)
│   │   └── Config.jsx        ← /config (configuración del negocio)
│   ├── components/
│   │   └── PinGate.jsx       ← wrapper de autenticación por PIN reutilizable
│   ├── design/
│   │   └── tokens.js         ← colores, tipografía, constantes visuales
│   ├── App.jsx               ← rutas principales
│   └── main.jsx              ← entry point
├── .env.local                ← variables de entorno (no subir a git)
├── index.html
├── package.json
└── vite.config.js
```

---

## Datos del negocio (instancia inicial)

### Barberos
Carlos, Matías, Diego, Rodrigo, Nicolás

### Servicios
| Nombre | Precio | Slots (×30 min) |
|--------|--------|----------------|
| Corte de cabello | Gs. 50.000 | 2 |
| Arreglo de barba | Gs. 35.000 | 2 |
| Corte + Barba | Gs. 75.000 | 2 |
| Corte + Barba Ritual Premium | Gs. 110.000 | 2 |

### Horario
Lunes a Sábado, 09:00 a 19:30, slots de 30 minutos

### PINs de acceso
| Panel | PIN |
|-------|-----|
| Admin | `Tajosbarber26` |
| Config | `Config2402` |

---

## Rutas

| Ruta | Vista | Acceso |
|------|-------|--------|
| `/` | Cliente — reserva de turnos | Público |
| `/admin` | Panel de administración | PIN admin |
| `/config` | Configuración del negocio | PIN config |

---

## Design System (`src/design/tokens.js`)

### Paleta de colores

```js
C.bg        = "#0A0806"   // fondo principal
C.surface   = "#111009"   // superficies (cards, navbar)
C.surface2  = "#181410"   // superficies elevadas (hover)
C.border    = "#2A2218"   // bordes principales
C.border2   = "#1A150E"   // bordes suaves
C.gold      = "#C8A96E"   // acento principal (dorado)
C.goldDim   = "#8A7050"   // dorado atenuado
C.goldFaint = "#3A2F1E"   // dorado muy suave (fondos activos)
C.text      = "#E8DCC8"   // texto principal
C.textDim   = "#6B5B45"   // texto atenuado (labels)
C.textMid   = "#A89070"   // texto intermedio
C.green     = "#4A7C59"   // estado completado
C.red       = "#7C3A3A"   // estado cancelado / error
C.amber     = "#7C6A3A"   // estado pendiente
```

### Tipografía
- **Cuerpo:** Georgia, Times New Roman (serif)
- **Monoespaciado:** Courier New (para precios y horarios)

---

## Capa de Storage (`src/storage/index.js`)

Todas las funciones son `async`. La implementación usa Supabase; los componentes no saben nada de la base de datos.

### API
```js
getBookings()         // → Booking[]
saveBookings(data)    // upsert del array de turnos
getBlocked()          // → string[]
saveBlocked(data)     // reemplaza todos los slots bloqueados
getNegocio()          // → config actual o NEGOCIO_DEFAULT
saveNegocio(data)     // upsert de la fila única de configuración
```

### Tablas en Supabase

#### `bookings`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | text (PK) | `Date.now().toString()` |
| `nombre` | text | |
| `telefono` | text | |
| `barbero` | text | |
| `servicio` | text | |
| `precio` | integer | En guaraníes |
| `fecha` | text | `YYYY-MM-DD` |
| `hora` | text | `HH:MM` (primer slot) |
| `status` | text | `pending` \| `completed` \| `cancelled` |
| `source` | text | `client` \| `admin` |
| `creado_en` | timestamptz | default `now()` |

#### `blocked_slots`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | serial (PK) | |
| `slot_key` | text (unique) | Formato: `YYYY-MM-DD__HH:MM__Barbero` |

#### `negocio_config`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | integer (PK) | Siempre `1` (fila única) |
| `data` | jsonb | Objeto completo de configuración |

Todas las tablas tienen **Row Level Security** habilitado con política pública (lectura y escritura con la anon key).

---

## Estructura de datos

### Booking (turno)
```js
{
  id: "1713000000000",        // Date.now().toString()
  nombre: "Juan Pérez",
  telefono: "0981123456",
  barbero: "Carlos",
  servicio: "Corte de cabello",
  precio: 50000,
  fecha: "2026-04-14",        // YYYY-MM-DD
  hora: "09:00",              // primer slot ocupado
  status: "pending",          // "pending" | "completed" | "cancelled"
  source: "client",           // "client" | "admin"
  creadoEn: "2026-04-13T...", // ISO timestamp
}
```

### Blocked (slot bloqueado)
```js
// Array de strings con formato:
"2026-04-14__09:00__Carlos"
```

---

## Vista Cliente (`/`)

### Encabezado
Muestra "Bienvenido a [nombre del negocio]" y "¿Qué desea realizarse?" al inicio del flujo de reserva.

### Flujo de reserva

```
Paso 1: Selección de servicio
  → Paso 2: Preferencia de barbero
      → Flujo A: Barbero específico
            → 3A: Elegir barbero
            → 4A: Elegir día
            → 5A: Elegir horario
      → Flujo B: Cualquier barbero
            → 3B: Elegir día
            → 4B: Elegir horario
  → Paso final: Datos del cliente (nombre + teléfono)
  → Pantalla de éxito
```

### Lógica de disponibilidad
- Un slot está **ocupado** si: hay un booking activo (no cancelado) que ocupa ese slot o el anterior, o si el slot está en la lista de bloqueados.
- Un slot está **disponible** para un servicio si: el slot actual está libre **y** el siguiente también (todos los servicios ocupan 2 slots consecutivos).
- **Flujo B:** el barbero se asigna aleatoriamente entre los disponibles en el horario elegido.

---

## Vista Admin (`/admin`)

### Autenticación con sesión persistente
- PIN almacenado en `negocio.pins.admin`
- La sesión se guarda en `sessionStorage` con timestamp
- **Timeout de inactividad: 10 minutos** — cualquier interacción (mouse, teclado, scroll, touch) resetea el timer
- Al refrescar la página dentro de los 10 minutos: entra directo, sin pedir PIN
- Al cerrar la pestaña o pasar los 10 minutos sin actividad: solicita PIN nuevamente

### Funcionalidades

**Tab Grilla:**
- Filas = horarios, columnas = barberos
- Celda vacía → hover muestra "bloquear", click abre modal de bloqueo
- Celda con turno pendiente → fondo ámbar, nombre del cliente
- Celda con turno completado → fondo verde
- Celda bloqueada → gris oscuro, texto "BLOQUEADO"
- El segundo slot de un turno se muestra como continuación coloreada

**Tab Resumen:**
- Estadísticas del día: total, pendientes, completados, caja
- Lista cronológica de turnos con estado
- Proyección de caja si se completan todos los pendientes

**Navegación:** selector de semana por días, avanza y retrocede

**Turno manual:** formulario completo con selección de fecha, barbero, servicio y horarios disponibles

---

## Vista Config (`/config`)

### Sección 1: Barberos
- Lista con botón ✕ para eliminar
- Botones ↑ ↓ para reordenar
- Input + botón "Agregar" para nuevos barberos

### Sección 2: Servicios
- Tabla editable: nombre, precio, cantidad de slots (1–4)
- Preview de precios formateados en tiempo real
- Botón para agregar nuevos servicios

### Sección 3: Horario de atención
- Hora de inicio y fin (input type="time")
- Duración de slot: 15, 20, 30, 45 o 60 minutos
- Días de la semana: checkboxes visuales (Dom a Sáb)

Los cambios se aplican en tiempo real en las otras vistas porque todas leen desde `getNegocio()`.

---

## Componente PinGate (`src/components/PinGate.jsx`)

Reutilizable para cualquier ruta protegida. Recibe `pin` y `label`, muestra pantalla de ingreso con animación shake en caso de error.

```jsx
<PinGate pin="mi-pin" label="Panel de Configuración">
  <MiComponente />
</PinGate>
```

---

## Formato de precios

Siempre en Guaraníes con separador de miles:
```js
function formatPrice(p) {
  return "Gs. " + p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
// Ejemplo: formatPrice(110000) → "Gs. 110.000"
```

---

## Variables de entorno

El archivo `.env.local` (no subir a git) debe contener:

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Para deploy en Vercel, configurar las mismas variables en el panel de Environment Variables del proyecto.

---

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

---

## Próximos pasos (no implementados aún)

- **Deploy:** Vercel para el frontend, conectado al repo de GitHub. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en variables de entorno de Vercel.
- **Multi-tenant:** cada barbería tendrá su propia fila en `negocio_config` y sus propios registros en `bookings` / `blocked_slots` identificados por un `negocio_id`.
- **Notificaciones:** WhatsApp al confirmar turno (Twilio o Meta API).
- **Facturación:** SIFEN Paraguay.

---

## Historial de cambios

### v0.1.0 — Implementación inicial
- Creación del proyecto React + Vite desde cero
- Estructura de carpetas según especificación
- `src/config/negocio.js` con datos por defecto de Iron Barberos
- `src/storage/index.js` con capa de abstracción sobre localStorage
- `src/design/tokens.js` con paleta de colores y tipografía
- `src/components/PinGate.jsx` — componente reutilizable de autenticación por PIN
- `src/pages/Cliente.jsx` — portado desde prototipo, adaptado a storage dinámico
- `src/pages/Admin.jsx` — portado desde prototipo, adaptado a storage dinámico
- `src/pages/Config.jsx` — creado desde cero según especificación
- `src/App.jsx` con rutas `/`, `/admin`, `/config`

### v0.1.1 — Mejoras de UX
- **Cliente:** agregado encabezado de bienvenida "Bienvenido a [negocio]" y "¿Qué desea realizarse?" en el paso de selección de servicio
- **Admin:** implementada sesión persistente con timeout de 10 minutos de inactividad usando `sessionStorage`; al refrescar la página dentro del período activo no se solicita el PIN nuevamente
- **Cliente:** eliminado el badge "HOY" en la lista de días para evitar confusión con la fecha real

### v0.2.0 — Migración a Supabase
- **Storage:** reemplazado localStorage por Supabase (PostgreSQL) sin modificar ningún componente
- **`src/config/supabase.js`:** cliente Supabase inicializado con variables de entorno Vite
- **`src/storage/index.js`:** reescrito para usar `@supabase/supabase-js`; misma API pública (`getBookings`, `saveBookings`, `getBlocked`, `saveBlocked`, `getNegocio`, `saveNegocio`)
- **`.env.local`:** variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- **Tablas creadas en Supabase:** `bookings`, `blocked_slots`, `negocio_config`
- **RLS habilitado** en las tres tablas con política pública para la anon key
- **Datos iniciales:** `negocio_config` precargada con la configuración de Iron Barberos
- Los turnos reservados por el cliente son visibles en tiempo real desde cualquier dispositivo en el panel admin

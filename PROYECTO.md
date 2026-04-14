# Tajos Barbería — Documentación del Proyecto

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
| Storage actual | localStorage (abstraído para reemplazar fácilmente) |
| Deploy futuro | Vercel (frontend) + Supabase (base de datos) |

---

## Estructura de carpetas

```
tajos/
├── public/
├── src/
│   ├── config/
│   │   └── negocio.js        ← datos por defecto del negocio
│   ├── storage/
│   │   └── index.js          ← capa de abstracción de datos (localStorage → Supabase)
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

Todas las funciones son `async` para que el reemplazo por Supabase sea transparente sin modificar las páginas.

### Keys de localStorage
| Key | Contenido |
|-----|-----------|
| `tajos_bookings` | Array de turnos |
| `tajos_blocked` | Array de strings `"fecha__slot__barbero"` |
| `tajos_config` | Objeto de configuración del negocio |

### API
```js
getBookings()         // → Booking[]
saveBookings(data)    // guarda array de turnos
getBlocked()          // → string[]
saveBlocked(data)     // guarda array de slots bloqueados
getNegocio()          // → config actual o NEGOCIO_DEFAULT
saveNegocio(data)     // persiste la configuración
```

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

- **Supabase:** reemplazar localStorage por llamadas a la API. La capa `src/storage/index.js` está preparada para este cambio sin tocar las páginas.
- **Deploy:** Vercel para el frontend, conectado al repo de GitHub.
- **Multi-tenant:** cada barbería tendrá su propio `PREFIX` en storage y su propia configuración.
- **Notificaciones:** WhatsApp al confirmar turno (Twilio o Meta API).
- **Facturación:** SIFEN Paraguay.

---

## Historial de cambios

### v0.1.0 — Implementación inicial
- Creación del proyecto React + Vite desde cero
- Estructura de carpetas según especificación
- `src/config/negocio.js` con datos por defecto de Tajos Barbería
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

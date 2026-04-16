# Instrucciones: Mejoras funcionales Cliente.jsx — Iron Barberos

El proyecto está en `/Users/javier/Documents/Proyectos/Tajos/iron-barberos`.
Solo modificar `src/pages/Cliente.jsx`. No tocar ningún otro archivo.

---

## Mejora 1: Selección múltiple de servicios

Actualmente el cliente elige un solo servicio y avanza automáticamente. Cambiar para que pueda seleccionar uno o más servicios antes de continuar.

### Cambios en el estado:
- Reemplazar `selectedService` (objeto único) por `selectedServices` (array, inicialmente `[]`)

### Comportamiento del paso "service":
- Al hacer click en una card de servicio, se togglea (agrega o quita del array `selectedServices`)
- Las cards seleccionadas muestran un indicador visual: borde más grueso dorado (`2px solid #C8A96E`), fondo levemente dorado (`#FFFBF4`), y un checkmark circular en la esquina superior derecha (círculo dorado con ✓ blanco)
- Las cards NO seleccionadas mantienen su estilo actual
- NO avanzar automáticamente al hacer click — el usuario acumula servicios
- Cuando hay al menos 1 servicio seleccionado, mostrar debajo de las cards:
  - Una barra de resumen con: "X servicio(s) seleccionado(s)" a la izquierda y el precio total a la derecha (fondo `#FFFBF4`, borde `#E8D5A3`, border-radius 10px)
  - Un botón "Continuar" que lleva al paso "preference"

### Lógica de slots totales:
- `totalSlots = selectedServices.reduce((a, s) => a + s.slots, 0)`
- Usar `totalSlots` en lugar de `selectedService.slots` en todas las funciones de disponibilidad
- Ejemplo: Corte (2 slots) + Barba con ritual (2 slots) = 4 slots consecutivos necesarios

### Actualizar funciones de disponibilidad:
- `isSlotAvailableForService(slot, barbero, fecha, services, bookings, blocked, allSlots)` — recibe array de servicios, usa totalSlots para verificar que haya suficientes slots consecutivos libres
- `getAvailableSlotsForBarber` — actualizar para usar el array
- `getBestBarber` — actualizar para usar el array
- `getSlotsWithAnyBarber` — actualizar para usar el array

### Actualizar pasos posteriores:
- En el paso "preference": el subtitle muestra los nombres de los servicios separados por " + "
- En el paso "barber": igual
- En el paso "day": igual
- En el paso "slot": igual
- En el paso "confirm":
  - Mostrar todos los servicios seleccionados (lista o separados por coma)
  - Mostrar el horario de fin estimado (slot inicial + totalSlots slots)
  - El precio total es la suma de todos los servicios
  - Guardar en Supabase: campo `servicio` = nombres unidos por ", " y campo `precio` = suma total

---

## Mejora 2: Filtrar horarios pasados cuando se selecciona hoy

### En el paso "slot":
- Si `selectedDate === todayStr()`, filtrar los slots disponibles para mostrar solo los que sean al menos 30 minutos después de la hora actual
- Ejemplo: si son las 12:43, `parseTime(slot) > nowMinutes() + 30` → primer slot válido sería 13:30
- Los slots pasados deben aparecer deshabilitados visualmente (opacity 0.15, cursor not-allowed) — no ocultarlos, solo deshabilitarlos
- Agregar helper: `function nowMinutes() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }`

### En el paso "day":
- Si la fecha es hoy Y `nowMinutes() >= parseTime(horario.fin) - 30`, deshabilitar el día de hoy completamente (sin disponibilidad)
- Esto cubre el caso de que un cliente entre a la app luego de las 19:30 — hoy no debe aparecer como disponible

### En `getAvailableSlotsForBarber` y `getSlotsWithAnyBarber`:
- Cuando `fecha === todayStr()`, excluir automáticamente los slots donde `parseTime(slot) <= nowMinutes() + 30`

---

## Commit final

Hacer commit con el mensaje: `feat: seleccion multiple de servicios + filtro horarios pasados v1.2.0`

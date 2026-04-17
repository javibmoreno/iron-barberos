# Instrucciones: Lógica de slots y tiempo aproximado — Iron Barberos

El proyecto está en `/Users/javier/Documents/Proyectos/Tajos/iron-barberos`.
Solo modificar `src/pages/Cliente.jsx`. No tocar ningún otro archivo.

---

## Cambio 1: Nueva lógica de slots

La cantidad de slots ya no depende del campo `slots` de cada servicio. Ahora depende únicamente de cuántos servicios seleccionó el cliente:

- **1 servicio seleccionado** → 1 slot (30 min)
- **2 o más servicios seleccionados** → 2 slots (60 min) — este es el tope máximo, nunca más de 2 slots sin importar cuántos servicios elija

Agregar esta función helper:
```js
function getTotalSlots(numServicios) {
  return numServicios === 1 ? 1 : 2;
}

function getTotalMinutos(numServicios) {
  return numServicios === 1 ? 30 : 60;
}
```

### Actualizar todas las funciones de disponibilidad para usar `getTotalSlots(selectedServices.length)` en lugar de `totalSlots(selectedServices)`:

- `isSlotAvailableForService` — usar `getTotalSlots(services.length)` para verificar slots consecutivos
- `getAvailableSlotsForBarber` — ídem
- `getSlotsWithAnyBarber` — ídem
- `getBestBarber` — ídem
- En el paso "day": usar `getTotalSlots(selectedServices.length)` para calcular disponibilidad
- En el paso "slot": ídem
- En la función `confirm`: usar `getTotalSlots(selectedServices.length)` para determinar los slots que ocupa el turno

---

## Cambio 2: Quitar tiempo de cada card de servicio

En el paso "service", las cards de servicios NO deben mostrar ningún indicador de tiempo individual. Solo mostrar:
- Ícono
- Nombre del servicio (en dorado)
- Descripción corta
- Precio (a la derecha)

Quitar cualquier badge, pill o texto de duración que esté dentro de cada card.

---

## Cambio 3: Mostrar tiempo total en el resumen de selección

En la barra de resumen que aparece debajo de las cards cuando hay al menos 1 servicio seleccionado, agregar el tiempo aproximado total:

```jsx
<div style={{ background: "#FFFBF4", border: "1px solid #E8D5A3", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
  {/* Lista de servicios seleccionados con precio */}
  {selectedServices.map(s => (
    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F0E8D8" }}>
      <span style={{ fontSize: "13px", color: "#555" }}>{s.nombre}</span>
      <span style={{ fontSize: "13px", color: "#111", fontFamily: mono }}>{formatPrice(s.precio)}</span>
    </div>
  ))}
  {/* Fila de total */}
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 8, marginTop: 2 }}>
    <span style={{ fontSize: "13px", color: "#111", fontWeight: 500 }}>Total</span>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: "15px", color: "#C8A96E", fontFamily: mono, fontWeight: 500 }}>
        {formatPrice(selectedServices.reduce((a, s) => a + s.precio, 0))}
      </div>
      <div style={{ fontSize: "12px", color: "#888", marginTop: 2 }}>
        Tiempo aprox. {getTotalMinutos(selectedServices.length)} min.
      </div>
    </div>
  </div>
</div>
```

---

## Commit final

Hacer commit con el mensaje: `feat: logica slots por cantidad de servicios + tiempo aproximado v1.4.0`

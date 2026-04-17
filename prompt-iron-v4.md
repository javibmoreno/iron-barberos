# Instrucciones: Navbar rediseño + Notificaciones Realtime — Iron Barberos

El proyecto está en `/Users/javier/Documents/Proyectos/Tajos/iron-barberos`.

---

## Cambio 1: Rediseño del navbar en Cliente.jsx, Admin.jsx y Config.jsx

### Nuevo diseño del navbar (Opción B — horizontal):
- Layout horizontal con logo a la izquierda y nombre + subtítulo a la derecha
- Centrado en la pantalla
- Padding: 14px 24px vertical/horizontal

### Logo:
- Usar `<img src="/logo.png" />` con estas propiedades:
  - `width: 56px`
  - `height: 56px`
  - `border-radius: 50%`
  - `border: 1.5px solid #E0E0E0`
  - `object-fit: contain`
  - `mix-blend-mode: multiply` ← esto elimina el fondo blanco cuadrado visualmente
  - `background: #fff`

### Texto a la derecha del logo:
- Línea 1: "IRON BARBEROS" — font-size 13px, letter-spacing 0.35em, color #111, font-family serif, font-weight 500, text-transform uppercase
- Línea 2 (solo en Cliente.jsx): "Barbería & Estilo" — font-size 11px, color #999, letter-spacing 0.05em
- Línea 2 (en Admin.jsx): "Panel de administración" — mismo estilo
- Línea 2 (en Config.jsx): "Configuración" — mismo estilo

### Estructura HTML del navbar:
```jsx
<div style={{
  padding: "14px 24px",
  borderBottom: `1px solid #E0E0E0`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff",
  gap: 14,
}}>
  <img
    src="/logo.png"
    alt="Iron Barberos"
    style={{
      width: 56, height: 56,
      borderRadius: "50%",
      border: "1.5px solid #E0E0E0",
      objectFit: "contain",
      mixBlendMode: "multiply",
      background: "#fff",
      flexShrink: 0,
    }}
  />
  <div>
    <div style={{ fontSize: "13px", letterSpacing: "0.35em", color: "#111", fontFamily: "'Georgia','Times New Roman',serif", fontWeight: 500, textTransform: "uppercase", marginBottom: 2 }}>
      IRON BARBEROS
    </div>
    <div style={{ fontSize: "11px", color: "#999", letterSpacing: "0.05em" }}>
      Barbería & Estilo
    </div>
  </div>
</div>
```

Aplicar este navbar en los tres archivos: Cliente.jsx, Admin.jsx y Config.jsx (ajustando el subtítulo en cada uno).

---

## Cambio 2: Notificaciones en tiempo real en Admin.jsx (Supabase Realtime)

### Paso 1 — Habilitar Realtime en Supabase
Agregar una nota en el código indicando que se debe habilitar Realtime en la tabla `bookings` desde el dashboard de Supabase: Table Editor → bookings → Enable Realtime.

### Paso 2 — Suscripción en Admin.jsx

En el `useEffect` donde se cargan los datos iniciales, agregar una suscripción a cambios en tiempo real de la tabla `bookings`:

```js
const channel = supabase
  .channel('bookings-changes')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'bookings' },
    (payload) => {
      const nuevo = payload.new;
      setBookings(prev => [...prev, nuevo]);
      setToast({
        visible: true,
        mensaje: `Nuevo turno — ${nuevo.barbero}, ${nuevo.hora}`,
        cliente: nuevo.nombre,
      });
      setTimeout(() => setToast(t => ({ ...t, visible: false })), 6000);
      playNotificationSound();
    }
  )
  .subscribe();

return () => { supabase.removeChannel(channel); };
```

### Paso 3 — Estado del toast

Agregar estado:
```js
const [toast, setToast] = useState({ visible: false, mensaje: "", cliente: "" });
```

### Paso 4 — Función de sonido

```js
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch(e) {}
}
```

### Paso 5 — Componente Toast

Agregar el toast como elemento flotante dentro del return del componente Admin (después del PIN gate, dentro del panel autenticado). Posicionarlo en la esquina inferior derecha:

```jsx
{toast.visible && (
  <div style={{
    position: "fixed",
    bottom: 24,
    right: 24,
    background: "#111",
    color: "#fff",
    borderRadius: 12,
    padding: "14px 18px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
    zIndex: 9999,
    minWidth: 240,
    animation: "slideIn 0.3s ease",
  }}>
    <div style={{ fontSize: 11, color: "#C8A96E", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
      Nuevo turno
    </div>
    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{toast.cliente}</div>
    <div style={{ fontSize: 13, color: "#aaa" }}>{toast.mensaje}</div>
  </div>
)}
```

Agregar la animación en el bloque `<style>`:
```css
@keyframes slideIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
```

---

## Paso final — Habilitar Realtime en Supabase

Antes de hacer el commit, recordar al usuario que debe ir a Supabase → Table Editor → tabla `bookings` → hacer click en el ícono del mundo (Enable Realtime) para activar la funcionalidad. Sin este paso el canal no recibe eventos.

## Commit final

Hacer commit con el mensaje: `feat: navbar rediseño logo + notificaciones realtime admin v1.3.0`

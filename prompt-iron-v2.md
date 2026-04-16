# Instrucciones: Rediseño visual + datos reales Iron Barberos

El proyecto está en `/Users/javier/Documents/Proyectos/Tajos/iron-barberos`.

---

## 1. Actualizar datos del negocio en `src/config/negocio.js`

Reemplazar los datos placeholder de Tajos con los datos reales de Iron Barberos:

**Barberos:** Kevin, Jefferson

**Servicios** (agregar campo `descripcion` a cada servicio):
```
- Corte de cabello | Gs. 60.000 | 2 slots | "Corte a tijera o máquina con acabado prolijo y definido."
- Retoque de barba | Gs. 30.000 | 2 slots | "Perfilado y arreglo de barba para un look limpio y cuidado."
- Barba con ritual  | Gs. 40.000 | 2 slots | "Afeitado completo con toalla caliente, productos y acabado premium."
- Cejas             | Gs. 10.000 | 1 slot  | "Depilación y definición de cejas para un rostro más estilizado."
```

**Horario:**
- Inicio: 09:00
- Fin: 20:00
- Días: Lunes a Sábado (1,2,3,4,5,6)
- Slot: 30 minutos

---

## 2. Rediseño visual de `src/pages/Cliente.jsx`

Inspirado en el mockup del cliente. Mantener toda la lógica funcional intacta, solo cambiar el diseño visual.

### Navbar
- Mostrar el logo (`/logo.png`) centrado, tamaño mediano
- Debajo del logo: texto `IRON BARBEROS` en letras espaciadas (letter-spacing amplio), tipografía serif, color `#111111`

### Pantalla de bienvenida (antes de las cards de servicios)
- Eslogan `Tu estilo empieza en la barbería.` en tipografía serif grande y bold
- Subtítulo pequeño: `¡Te damos la bienvenida! Agenda tu cita a continuación.`

### Cards de servicios
Cada card debe mostrar:
- Ícono representativo del servicio en color dorado (`#C8A96E`) — usar emojis o SVG simple:
  - Corte de cabello: ✂️ (o SVG de tijeras)
  - Retoque de barba: 🪒 (o SVG de navaja)
  - Barba con ritual: 🪒 (navaja con detalle)
  - Cejas: ✨
- Nombre del servicio en color dorado (`#C8A96E`), tipografía serif, bold
- Descripción corta en gris oscuro (`#555555`), tipografía sans-serif, tamaño pequeño
- Precio alineado a la derecha en negro (`#111111`), tipografía monospace
- Borde de la card en dorado suave (`#E8D5A3`)
- Fondo de card blanco con sombra suave
- Border-radius generoso (12px)

---

## 3. Actualizar `src/config/negocio.js` para incluir descripción en servicios

El objeto de cada servicio debe tener este formato:
```js
{ nombre: "Corte de cabello", precio: 60000, slots: 2, descripcion: "Corte a tijera o máquina con acabado prolijo y definido." }
```

---

## 4. Actualizar `src/pages/Config.jsx`

En la sección de Servicios, agregar un campo de texto editable para la `descripcion` de cada servicio, debajo del campo de nombre. Así el dueño puede editarla desde el panel de configuración.

---

## 5. Actualizar `src/storage/index.js` si es necesario

Verificar que el campo `descripcion` se guarde y lea correctamente desde Supabase junto con los demás datos del servicio en `negocio_config`.

---

## 6. Commit final

Hacer commit con el mensaje: `feat: datos reales Iron Barberos + rediseño cards servicios v1.1.0`

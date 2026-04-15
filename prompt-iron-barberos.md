# Instrucciones: Rediseño Iron Barberos

Necesito rediseñar completamente la estética del sistema para un nuevo cliente llamado Iron Barberos. El proyecto está en `/Users/javier/Documents/Proyectos/Tajos/iron-barberos`.

## Cambios de identidad

- Nombre del negocio: "Iron Barberos"
- Eslogan: "Tu estilo empieza en la barbería"
- Logo: está en `public/logo.png` (ya fue movido ahí)

## Nueva estética (fondo blanco, minimalista)

Actualizar `src/design/tokens.js` con esta paleta:

- Fondo principal: `#FFFFFF`
- Fondo secundario / cards: `#F5F5F5`
- Bordes: `#E0E0E0`
- Texto principal: `#111111`
- Texto secundario: `#666666`
- Acento principal: `#111111` (negro)
- Acento hover: `#333333`
- Verde (completado): `#2D6A4F`
- Rojo (cancelado): `#C0392B`
- Ámbar (pendiente): `#B7860B`
- Tipografía: mantener serif para títulos, sans-serif para cuerpo

## Cambios en el código

1. Mover `Logo Iron.png` de la raíz a `public/logo.png`
2. Actualizar `src/design/tokens.js` con la nueva paleta completa
3. En `Cliente.jsx`: mostrar el logo (`/logo.png`) en la navbar en vez del texto TAJOS. Debajo del mensaje de bienvenida agregar el eslogan "Tu estilo empieza en la barbería"
4. En `Admin.jsx`: actualizar navbar con logo y texto "Iron Barberos — Admin"
5. En `Config.jsx`: actualizar navbar con logo y texto "Iron Barberos — Configuración"
6. Actualizar `src/config/negocio.js`: cambiar el nombre del negocio a "Iron Barberos". Los barberos y servicios pueden quedar igual por ahora como placeholders
7. Actualizar `index.html`: cambiar el `<title>` a "Iron Barberos"
8. Actualizar `PROYECTO.md`: cambiar todas las referencias de "Tajos Barbería" a "Iron Barberos"

## Importante

- Mantener toda la lógica funcional intacta
- Solo cambiar estética e identidad visual
- El logo tiene fondo blanco con texto e ícono negro — queda perfecto sobre fondo blanco
- Después de los cambios, hacer commit con el mensaje: "feat: rediseño Iron Barberos v1.0.0"

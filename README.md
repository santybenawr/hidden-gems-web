# Hidden Gems · Emprendimientos Online

Vitrina digital de los emprendimientos universitarios de la zona CityU y el Centro de Bogotá.

**En vivo:** https://hidden-gems-sepia.vercel.app

## Qué incluye

- Página principal: Nosotros, Qué hacemos, catálogo con filtros y favoritos, planes, procedimiento de registro y preguntas frecuentes.
- Una página por plan con detalle, comparación y contrato: `plan-semilla.html`, `plan-pro.html`, `plan-elite.html`.
- Registro de emprendimientos con datos validados (cédula, celular colombiano, correo) y verificación del correo con un código, guardado en Supabase.
- Contacto directo por WhatsApp y botón flotante "Dudas".

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Página principal |
| `plan-*.html` | Páginas de cada plan con su contrato |
| `aura-beauty-pink.html` | Página de Aura Beauty Pink: catálogo, "Crea tu kit", dinámicas y proceso de compra |
| `img/aura/` | Logo y fotos de productos de Aura Beauty Pink |
| `styles.css` | Estilos y animaciones |
| `main.js` | Interacciones, catálogo y formulario de registro |
| `config.js` | URL del proyecto de Supabase y su clave pública |
| `supabase-setup.sql` | Crea la tabla `emprendimientos` y sus reglas de seguridad |

Es un sitio estático (HTML, CSS y JavaScript, sin compilación). Para verlo en local:

```bash
python3 -m http.server 8765
```

y abre http://localhost:8765.

## Base de datos

1. En Supabase, ejecuta `supabase-setup.sql` en el SQL Editor.
2. En Authentication → Emails, configura un SMTP propio y agrega `{{ .Token }}` a las plantillas "Confirm signup" y "Magic Link".
3. Pon la Project URL y la clave publishable en `config.js`.

La clave de `config.js` es pública por diseño: la tabla solo permite registrar con un correo verificado y no deja leer los datos desde la página.

## Publicar

```bash
vercel deploy --prod
```

Los contratos son un borrador para revisión y no constituyen asesoría legal.

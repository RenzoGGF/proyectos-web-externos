# Reglas del Sistema y Contexto del Proyecto

## Identidad y Propósito
Portal web interno para asesores inmobiliarios de RE/MAX Family. Centraliza proyectos multifamiliares, oficinas, locales comerciales, disponibilidad de inventario, características técnicas, carpetas compartidas (Drive/Dropbox), contactos comerciales, FAQs y control de stock SIGI.
- **Uso estrictamente confidencial e interno**: Salvaguarda la captación y gestión comercial.
- **Políticas de privacidad**: Prohibido exponer fachadas o ubicaciones exactas sin previa cita. Manejar avisos con `sessionStorage`. Enlaces a WhatsApp formatean únicamente el *primer nombre* del asesor.

---

## Reglas de Oro Innegociables

1. **CERO EMOJIS EN LA UI**:
   - Prohibición absoluta de emojis en etiquetas, botones, modales, alertas, badges y textos.
   - Toda necesidad gráfica debe resolverse mediante iconos vectoriales de `lucide-astro` o formas geométricas CSS puras.

2. **Astro SSG Puro (Cero frameworks de cliente)**:
   - Compilación 100% estática (HTML/CSS/JS nativo).
   - No introducir dependencias de React, Vue o Svelte en las vistas.
   - La reactividad de cliente se implementa con TypeScript/JavaScript vanilla encapsulado en eventos `document.addEventListener('DOMContentLoaded', ...)`.

3. **Prevención de Colisiones de Identificadores**:
   - Al importar iconos de Lucide, no usar nombres que colisionen con constructores o APIs globales de JavaScript.
   - Ejemplo: Importar `MapPinned` en lugar de `Map` (evitar sobreescribir `new Map()`).

4. **Rendimiento y Cero Bloqueos**:
   - Cero `iframe` pesados en la carga inicial.
   - Los reproductores de video (YouTube) arrancan con `src=""`. Solo inyectan la URL al abrir su respectivo modal y se vacía el atributo `src` inmediatamente al cerrar para detener el audio en el instante.
   - Recursos de terceros y mapas se inicializan de forma diferida o asíncrona.

5. **Integridad de Layouts**:
   - En `src/pages/index.astro`, el contenedor `.catalog-layout` (vista desktop) se compone estrictamente de 2 columnas hijas directas:
     1. Primer hijo: `<FilterBar />`
     2. Segundo hijo: `<section class="catalog-content">`
   - No insertar contenedores ni elementos flotantes entre ambos para evitar la ruptura de la grilla CSS.

---

## Stack Tecnológico y Convenciones de Código

- **Framework**: Astro (Static Site Generation).
- **Tipado & Validación**: TypeScript estricto (prohibido el uso de `any`) y esquemas de validación Zod.
- **Iconografía**: `lucide-astro`.
- **Estilos**: CSS nativo modular con variables globales corporativas en `src/styles/global.css`:
  - `--color-remax-blue: #003da5`
  - `--color-remax-red: #dc1c2e`
  - Superficies y bordes neutros controlados.
- **Cartografía**: Leaflet con OpenStreetMap (sin API keys pagas; respetar atribución legal).
- **ETL / Datos**: Node.js con `xlsx` para ingesta desde `data/proyectos.xlsx`.

---

## Convenciones de Archivos

- `data/proyectos.xlsx`: Archivo maestro fuente. No modificar mediante código sin respaldo.
- `src/data/*.json`: Archivos generados automáticamente por el script ETL (`scripts/import-excel.ts`).
- `src/types/index.ts`: Contrato único de interfaces (`Project`, `Company`, `Advisor`, `FaqItem`, etc.).
- `public/images/`:
  - Inmobiliarias: `companies/c-[slug].webp`
  - Portadas: `projects/p-[slug].webp`
  - Stock SIGI: `stock/s-[slug].webp`

---

## Gestión de Sesión y Protocolo PROGRESS.md

- **`AGENTS.md` es de sólo lectura para el agente**: No modifiques este archivo a menos que el usuario lo solicite de manera explícita.
- **`PROGRESS.md` es el cuaderno de trabajo activo**:
  - Antes de iniciar una tarea compleja, consulta el estado en `PROGRESS.md`.
  - Al completar un hito, actualizar un componente o detectar un bloqueo técnico, actualiza `PROGRESS.md` reflejando los cambios realizados y los pasos siguientes.
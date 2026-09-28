# Estado de Avance del Proyecto

## Módulos Implementados (Completados)
- [x] **Arquitectura Base & SSG**: Configuración de Astro, TypeScript estricto y tokens globales RE/MAX.
- [x] **Catálogo Reactivo (`index.astro`)**:
  - Barra de filtros (`FilterBar.astro`) con sliders duales de precio, selectores de distrito, etapa y entrega.
  - Ordenamiento dinámico, contador reactivo de resultados y chips de deselección.
  - Integración del botón de alternancia hacia mapa con icono `MapPinned`.
- [x] **Ficha Técnica (`[slug].astro`)**:
  - Generación estática vía `getStaticPaths`.
  - Enlace directo a WhatsApp formateando exclusivamente el primer nombre del asesor.
  - Acordeón de FAQs por empresa en `<details>`.
  - Visor de stock SIGI con controles de zoom, paneo por arrastre y teclado.
- [x] **Sistema Global de Tutoriales**:
  - Modales diferidos de YouTube (`TutorialModal.astro`) con corte instantáneo de audio.
  - Mapeo de tutoriales por empresa en `src/config/tutorials.ts`.

---

## En Desarrollo Activo: Optimización y UI/UX del Mapa

- [x] **Pipeline de Geocodificación y Carga**:
  - [x] Contratos de coordenadas y script `scripts/import-excel.ts` funcionales.
  - [x] Filtrado de proyectos con `ubicacion !== null`.
- [x] **Página Interactiva (`src/pages/mapa.astro`) - Funcional**:
  - [x] Instancia de Leaflet y renderizado de marcadores CSS.
  - [x] Filtros por distrito y etapa sincronizados con `fitBounds()`.
  - [x] Popups con información comercial básica.
- [x] **Refactorización con Skill Ponytail (UI/UX & Anti-Sobreingeniería)**:
  - [x] Barra de navegación y filtros rediseñada como dock flotante integrado con `backdrop-blur` y estados activos destacados.
  - [x] Popups de Leaflet modernizados: tarjetas con bordes suaves, sombra elevada, imagen fluida con zoom hover, badges de etapa semánticos, precio resaltado y botón de acción con icono vectorial Lucide hacia `/proyectos/[slug]`.
  - [x] Regla innegociable cumplida: CERO emojis en toda la interfaz (CSS puro y SVG inline).
  - [x] Simplificación de JavaScript: preinstanciación de marcadores en memoria para eliminar recreación de objetos DOM/Leaflet y recolección de basura, listeners unificados y `fitBounds()` eficiente con padding y animación.
  - [x] Reubicación de controles de mapa (zoom en esquina inferior derecha y atribución en esquina inferior izquierda) para máxima legibilidad.
  - [x] Responsividad móvil optimizada para pantallas pequeñas.

---

## Próximo Paso Inmediato
- Realizar pruebas de usuario en dispositivos móviles y validar la navegación entre catálogo y mapa.
## Why

La salida actual usa dos generadores distintos: el SOP se rasteriza desde HTML y la evaluación se dibuja como texto directamente con jsPDF. Esto produce documentos inconsistentes, limita la legibilidad y accesibilidad del PDF, y no ofrece la misma experiencia de vista previa, impresión y descarga para ambos documentos.

## What Changes

- Unificar el SOP y la evaluación bajo una experiencia común de vista previa, impresión y descarga en PDF.
- Definir plantillas Carta optimizadas para papel, con encabezado corporativo, metadatos, pie, numeración y márgenes seguros.
- Aplicar paginación basada en el espacio real del contenido, evitando recortes, desbordes y separación incorrecta de bloques.
- Permitir descargar por separado el SOP y la evaluación con nombres de archivo seguros y descriptivos.
- Generar una evaluación imprimible sin revelar las respuestas correctas, con campos de identificación, instrucciones y espacio claro para responder.
- Incorporar una hoja de respuestas opcional para uso del evaluador, diferenciada del ejemplar del participante.
- Añadir estados de generación, manejo de errores y criterios de regresión visual y documental.

## Capabilities

### New Capabilities

- `printable-documents`: representación, vista previa, impresión y descarga consistente del SOP, la evaluación y su hoja de respuestas.

### Modified Capabilities

Ninguna. La capacidad se especifica separadamente mientras la change base `replicar-sop-arauco` aún no ha sido archivada como especificación principal.

## Impact

El cambio afecta principalmente `frontend/src/App.tsx`, `frontend/src/styles.css` y las pruebas del frontend. Puede requerir extraer componentes y utilidades de documentos, revisar el uso de `html2canvas`/`jsPDF` y añadir herramientas de prueba E2E o comparación visual. No cambia los contratos HTTP ni el almacenamiento de SOP; consume el modelo `SOP` y la evaluación JSON existentes.

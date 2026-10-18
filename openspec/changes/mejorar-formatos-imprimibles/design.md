## Context

La salida reside hoy en `frontend/src/App.tsx`. El SOP se compone como HTML en `CorporateSheet`, se pagina por una cantidad fija de pasos (cuatro horizontal o tres vertical), se rasteriza página por página con `html2canvas` y se inserta como JPEG en jsPDF. La impresión usa otra ruta: CSS de impresión y `window.print()` sobre copias ocultas del mismo HTML.

La evaluación se genera dentro del formulario mediante comandos de texto de jsPDF, usa un umbral vertical fijo y abre un PDF con `autoPrint`; no tiene vista previa, descarga directa, identidad corporativa, campos del participante ni una pauta separada. Véanse `proposal.md` y `specs/printable-documents/spec.md`.

Se estudiaron dos referencias exportadas desde Microsoft Excel: `calibracion de palillera-ranuradora (1).pdf`, de dos páginas Carta horizontal (792 × 612 pt), y `Cambio de Programa Sorter.pdf`, de una página física Carta vertical (612 × 792 pt, aunque su celda Hoja indica “1 de 2”). Ambos usan Arial como familia principal —la primera referencia incorpora además Aptos en una leyenda externa— y comparten la misma retícula: metadatos, herramientas/matriz, tabla Paso–Símbolo–Descripción–Procedimiento y pie de cuatro bloques.

## Goals / Non-Goals

**Goals:**

- Tener un único modelo de documento para vista previa, impresión y descarga, sin rutas visuales divergentes.
- Conservar texto del PDF como texto, no como una captura rasterizada.
- Separar datos, reglas de paginación y componentes visuales para probarlos aisladamente.
- Mantener la generación local en la SPA y los contratos `/api` actuales.

**Non-Goals:**

- Modificar el modelo persistido de SOP o evaluación.
- Registrar intentos, respuestas o calificaciones de participantes.
- Incorporar firma electrónica o protección criptográfica del PDF.
- Rediseñar la pantalla de creación del contenido SOP.

## Decisions

### Un árbol PDF declarativo como fuente única

Se extraerán plantillas tipadas para `SopDocument`, `ParticipantEvaluationDocument` y `AnswerKeyDocument` usando un renderizador PDF declarativo compatible con React. El mismo documento renderizado alimentará un visor PDF, la descarga mediante blob y la impresión mediante un iframe aislado. El SOP persiste una preferencia de 1 a 6 pasos por hoja y aplica una escala de densidad común a filas, texto e imágenes.

Esto reemplaza la captura `html2canvas` para documentos finales: preserva texto seleccionable, reduce el peso y hace deterministas los saltos de página. Se consideró mantener HTML/CSS para vista previa y generar el PDF por otra ruta, pero conservaría dos motores con riesgo de divergencia. También se descartó generar el PDF en FastAPI porque agregaría endpoints, despliegue de fuentes y transferencia de imágenes sin una necesidad actual de procesamiento servidor.

### Modelo de vista independiente de la persistencia

Una capa adaptadora convertirá `SOP` y el JSON textual `evaluation` en un `PrintableSopModel` validado. Normalizará líneas, alternativas, URLs de imagen, fechas y nombres de archivo, sin modificar los datos guardados. Los errores de JSON o recursos se convertirán en diagnósticos visibles antes de renderizar.

Esta frontera mantiene compatibilidad con el contrato existente y evita que las plantillas conozcan detalles como `evaluation` serializada o campos de formulario temporales.

### Paginación por flujo y bloques inseparables

El renderizador distribuirá el contenido según el espacio disponible. Encabezados breves se repetirán cuando aporten contexto; preguntas y filas de pasos se declararán inseparables mientras quepan en una página. El SOP admitirá Carta exacta (11 × 8,5 pulgadas horizontal u 8,5 × 11 vertical); la evaluación y su pauta usarán Carta vertical para reservar ancho y espacio de respuesta.

La altura de una fila será `max(altura mínima visual, imagen, símbolos, descripción, procedimiento)` incluyendo padding y bordes. El algoritmo medirá cada fila, reservará primero encabezado, títulos y pie, y agregará filas completas mientras quepan; si la siguiente no cabe, comenzará otra página. La cantidad fija de pasos por página queda eliminada. Cuando un único procedimiento exceda por sí solo el cuerpo de una página, se dividirá de manera controlada, repitiendo paso, símbolos y descripción como contexto de continuación.

### Retícula y escala tipográfica derivadas de las referencias

Se conservará la relación visual observada, no las dimensiones accidentales de las hojas Excel. En horizontal, las referencias equivalen aproximadamente a Arial 10 pt para cuerpo y metadatos, 16 pt negrita para títulos de columnas, 25 pt para número de paso y 6–8 pt para el pie. En vertical equivalen aproximadamente a 7–8 pt para cuerpo, 13 pt para títulos, 21 pt para número de paso y 5–6 pt para el pie.

Para mejorar legibilidad se establecerán tokens por orientación con mínimos: cuerpo de 9 pt horizontal y 8 pt vertical; títulos de tabla de 15 pt horizontal y 13 pt vertical; número de paso de 24 pt horizontal y 20 pt vertical; pie de 7 pt. El contenido nunca reducirá automáticamente esos mínimos para hacerlo caber: se paginará. Arial será la fuente base incrustada y los encabezados usarán peso normal o negrita según la referencia.

La tabla conservará cuatro columnas y la proporción dominante del procedimiento. El número y la imagen compartirán la primera celda; número, imagen, dos bandas de símbolos y descripción usarán centrado horizontal y vertical. Las imágenes usarán ajuste proporcional `contain`, sin recorte ni deformación. El procedimiento se alineará a la izquierda con interlineado constante; no se justificará con espacios artificiales porque las referencias muestran huecos irregulares al provenir de Excel.

### Pie como contenido, no como zona fija

Regla Clave, Riesgos, Medida de Control y EPP formarán una fila de cuatro celdas cuya altura será la máxima de sus contenidos. El adaptador convertirá texto delimitado o numerado en elementos ordenados y conservará saltos explícitos. Se reservará el alto medido antes de empaquetar pasos.

Si el pie no cabe respetando el mínimo de 7 pt, el paginador moverá una o más filas de pasos a la página siguiente. Si el pie por sí solo excede el área disponible, se generará una sección de continuación con los cuatro encabezados o con el encabezado del bloque continuado. Se descarta `overflow: hidden`, truncamiento y reducción tipográfica dinámica, porque contradicen el objetivo operacional de leer toda la información.

### Evaluación del participante y pauta como documentos distintos

La plantilla del participante nunca recibirá ni renderizará el campo `correct`; solo recibirá enunciados y alternativas. La pauta sí recibirá las respuestas correctas y tendrá una marca explícita de uso del evaluador. Esta separación estructural reduce el riesgo de revelar respuestas mediante estilos ocultos o capas del PDF.

### Recursos locales y nombres seguros

El logotipo y las fuentes autorizadas se incorporarán como activos locales para funcionamiento sin red. Antes de habilitar descarga o impresión se esperará la resolución de los recursos; los errores identificarán el recurso fallido. Los nombres seguirán el patrón `SOP_<codigo>.pdf`, `Evaluacion_<codigo>.pdf` y `Pauta_<codigo>.pdf`, reemplazando caracteres no seguros y usando `sin-codigo` como respaldo.

### Pruebas documentales por capas

Las pruebas unitarias cubrirán adaptación, exclusión de respuestas, nombres y casos inválidos. Pruebas de componentes cubrirán selección, estados y navegación. Una suite E2E generará PDF con fixtures mínimo, extenso y multipágina, verificará metadatos, texto extraíble, orientación y conteo de páginas. Capturas de páginas representativas se compararán contra referencias aprobadas con una tolerancia explícita.

## Risks / Trade-offs

- [Nueva dependencia de renderizado PDF aumenta el paquete] → cargar el centro de documentos de forma diferida y medir el tamaño de producción.
- [Diferencias tipográficas entre visor e impresión] → incrustar fuentes locales y usar el mismo blob PDF para ambas operaciones.
- [Imágenes grandes consumen memoria] → validar dimensiones, normalizar orientación y reducir resolución únicamente hasta un umbral apto para impresión.
- [Texto operacional extremadamente largo fuerza divisiones] → permitir división controlada del bloque, probar límites y nunca ocultar contenido con `overflow`.
- [Reservar un pie grande reduce la cantidad de pasos] → calcular el pie antes de empaquetar filas y aceptar más páginas antes que comprimir o perder texto.
- [La pauta contiene información sensible para la evaluación] → mantenerla como documento explícitamente separado y rotulado; permisos adicionales quedan fuera del alcance porque el modelo actual no distingue al evaluador.

## Migration Plan

1. Añadir adaptadores y plantillas nuevas detrás del centro de documentos, manteniendo temporalmente la previsualización actual.
2. Aprobar referencias visuales con datos sintéticos y validar PDFs en Carta horizontal y vertical.
3. Conectar las acciones existentes de previsualizar/descargar y la acción de evaluación al nuevo centro.
4. Retirar `printEvaluation`, la rasterización con `html2canvas` y los estilos/capas ocultas que queden sin uso.
5. Si se detecta una regresión, restaurar las acciones antiguas mientras las plantillas nuevas permanecen aisladas; no se requiere migración de datos ni rollback de API.

## Open Questions

- Qué versión final del logotipo debe aprobarse como activo oficial antes de fijar las referencias visuales definitivas; mientras tanto se usará el recurso Arauco local y Arial incrustada, siguiendo los ejemplos entregados.

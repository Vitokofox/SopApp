## Purpose

Define documentos operacionales consistentes, legibles y verificables para consultar, imprimir y descargar el SOP, la evaluación del participante y la hoja de respuestas del evaluador.

## ADDED Requirements

### Requirement: Centro de documentos del SOP
El sistema SHALL ofrecer desde un SOP una experiencia común de vista previa para seleccionar el documento SOP, la evaluación del participante o la hoja de respuestas, y SHALL mostrar la cantidad total de páginas y controles de navegación.

#### Scenario: Previsualizar un documento
- **WHEN** el usuario abre la salida imprimible de un SOP y selecciona un tipo de documento
- **THEN** el sistema presenta su primera página, el total de páginas y controles para recorrerlas sin modificar el SOP

#### Scenario: Documento sin contenido requerido
- **WHEN** el usuario selecciona una evaluación que no contiene preguntas
- **THEN** el sistema informa que no existe contenido imprimible y deshabilita impresión y descarga para ese documento

### Requirement: Formato imprimible del SOP
El documento SOP SHALL usar papel Carta exacto de 8,5 × 11 pulgadas y la orientación elegida, SHALL incluir identidad corporativa, código, revisión, título, responsables, fechas, herramientas, matriz de flexibilidad, pasos, imágenes, riesgos, controles, regla clave, EPP y numeración de página, y MUST mantener el contenido dentro del área imprimible.

#### Scenario: SOP de varias páginas
- **WHEN** el SOP contiene más pasos o texto del que cabe en una página
- **THEN** el sistema distribuye el contenido en páginas adicionales, repite el contexto necesario y no recorta ni superpone texto, imágenes o tablas

#### Scenario: Cantidad configurable de pasos
- **WHEN** el autor selecciona entre 1 y 6 pasos por hoja dentro de la sección Paso a Paso
- **THEN** el sistema persiste la selección, agrupa hasta esa cantidad en cada página y ajusta proporcionalmente tipografía, imágenes y espaciado al área imprimible Carta

#### Scenario: Riesgos compactos y legibles
- **WHEN** el pie contiene varios riesgos breves
- **THEN** los riesgos se componen como un párrafo continuo separado visualmente y se ajustan al ancho de la celda sin perder contenido

#### Scenario: Cambiar orientación
- **WHEN** el usuario cambia entre orientación horizontal y vertical
- **THEN** la vista previa y la salida generada se repaginan con la nueva orientación y conservan todo el contenido

### Requirement: Composición legible de filas y celdas
Cada fila de paso SHALL calcular su altura a partir del mayor espacio requerido por número e imagen, símbolos, descripción o procedimiento. La imagen, los símbolos y la descripción SHALL quedar centrados horizontal y verticalmente dentro de sus celdas; el procedimiento SHALL conservar lectura natural, separación entre líneas y márgenes interiores uniformes.

#### Scenario: Procedimiento más alto que la imagen
- **WHEN** el procedimiento ocupa más líneas que la imagen, los símbolos o la descripción
- **THEN** toda la fila adopta la altura del procedimiento y los otros contenidos permanecen centrados en esa altura

#### Scenario: Imagen de proporción diferente
- **WHEN** una imagen es vertical, horizontal o tiene una proporción distinta a su celda
- **THEN** se escala proporcionalmente dentro del área disponible, se centra y no se recorta ni deforma

### Requirement: Pie completo y ordenado
Los recuadros de Regla Clave, Riesgos, Medidas de Control y EPP SHALL mostrar todo el texto disponible, conservar su orden y usar saltos de línea y numeración legibles. El sistema MUST NOT ocultar contenido, reducirlo por debajo del tamaño mínimo definido para impresión ni usar desbordamiento recortado.

#### Scenario: Pie con listas extensas
- **WHEN** riesgos, medidas de control o EPP exceden la altura mínima del pie
- **THEN** los recuadros crecen coordinadamente hasta la altura del contenido mayor y las listas se distribuyen sin superposición

#### Scenario: Pie que no cabe en el espacio restante
- **WHEN** el pie completo no cabe junto a las filas de pasos previstas
- **THEN** el sistema reduce proporcionalmente la tipografía del pie y mueve solamente filas de pasos a la hoja siguiente; el pie nunca genera una hoja independiente

### Requirement: Evaluación para el participante
La evaluación del participante SHALL imprimirse en tamaño Carta vertical con identidad corporativa, identificación del SOP, campos para nombre, identificador, área, fecha, puntaje y firma, instrucciones, preguntas numeradas y alternativas con una marca vacía para responder. El documento MUST NOT revelar la alternativa correcta.

#### Scenario: Generar evaluación del participante
- **WHEN** el usuario selecciona la evaluación del participante
- **THEN** cada pregunta y sus alternativas aparecen completas, en orden, con espacio para responder y sin indicación de la respuesta correcta

#### Scenario: Pregunta próxima al final de página
- **WHEN** una pregunta con sus alternativas no cabe completa en el espacio restante
- **THEN** el bloque se mueve a la página siguiente, salvo que por sí solo exceda una página, caso en que se divide preservando su orden y legibilidad

### Requirement: Hoja de respuestas controlada
El sistema SHALL ofrecer una hoja de respuestas separada que identifique cada pregunta y su alternativa correcta, y SHALL distinguirla visualmente como material para el evaluador.

#### Scenario: Generar pauta del evaluador
- **WHEN** el usuario selecciona la hoja de respuestas
- **THEN** el documento muestra código y revisión del SOP, las respuestas correctas y una leyenda visible de uso del evaluador

### Requirement: Impresión y descarga coherentes
El sistema SHALL imprimir o descargar todas las páginas del documento seleccionado y SHALL mantener equivalencia de contenido, orden, orientación y paginación entre la vista previa y el resultado. El PDF descargado MUST conservar texto legible y seleccionable, e imágenes con resolución apta para impresión.

#### Scenario: Imprimir documento completo
- **WHEN** el usuario solicita imprimir desde la vista previa
- **THEN** el diálogo de impresión recibe únicamente todas las páginas del documento seleccionado, sin controles ni elementos de la aplicación

#### Scenario: Descargar PDF
- **WHEN** el usuario solicita descargar el documento seleccionado
- **THEN** el sistema descarga un PDF completo cuyo nombre contiene un tipo de documento y un código de SOP saneados para el sistema de archivos

#### Scenario: Fallo durante la generación
- **WHEN** una fuente, imagen o recurso requerido no puede incorporarse al PDF
- **THEN** el sistema detiene el estado de carga, informa el recurso afectado de forma accionable y permite reintentar sin perder datos

### Requirement: Calidad verificable de los documentos
El sistema MUST validar las plantillas imprimibles con casos representativos de contenido mínimo, contenido extenso, caracteres españoles y SOP de varias páginas, y SHALL mantener referencias aprobadas para detectar regresiones de composición.

#### Scenario: Ejecutar regresión documental
- **WHEN** se ejecuta la suite de documentos imprimibles
- **THEN** se comprueban tamaño y número de páginas, presencia de textos esenciales, ausencia de respuestas en la evaluación del participante y diferencias visuales dentro de la tolerancia aprobada

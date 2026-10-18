## 1. Base documental

- [x] 1.1 Añadir el renderizador PDF declarativo, configurarlo con carga diferida y registrar el impacto en el tamaño del bundle de producción.
- [x] 1.2 Crear los tipos `PrintableSopModel`, tipo de documento y diagnósticos de recursos, separados del modelo persistido `SOP`.
- [x] 1.3 Implementar y probar el adaptador de SOP, evaluación JSON, fechas, líneas y URLs de imágenes, incluidos datos inválidos y caracteres españoles.
- [x] 1.4 Implementar y probar el saneamiento de nombres `SOP_<codigo>.pdf`, `Evaluacion_<codigo>.pdf` y `Pauta_<codigo>.pdf`.

## 2. Plantilla del SOP

- [x] 2.1 Crear los componentes compartidos de página Carta, identidad corporativa, metadatos, numeración, colores, tipografía y estados de recursos.
- [x] 2.2 Implementar la plantilla SOP con encabezado, soporte, pasos, imágenes, riesgos, controles, regla clave y EPP.
- [x] 2.3 Implementar medición de filas mediante el máximo entre imagen, símbolos, descripción y procedimiento, con centrado vertical/horizontal y ajuste proporcional de imágenes.
- [x] 2.4 Implementar repaginación horizontal/vertical por espacio disponible, sin cantidades fijas de pasos, con repetición de contexto y división segura de procedimientos sobredimensionados.
- [x] 2.7 Permitir definir entre 1 y 6 pasos por hoja desde el paso a paso y adaptar densidad tipográfica, imágenes y espaciado al valor persistido.
- [x] 2.8 Componer los riesgos del pie como párrafo continuo para reducir la altura de la fila sin omitir contenido.
- [x] 2.9 Mantener el pie unido a la hoja, adaptar su tipografía y reservar su espacio antes de distribuir las filas de pasos.
- [x] 2.5 Implementar el pie de altura automática, listas ordenadas, reserva previa de espacio y páginas de continuación sin truncamiento ni reducción bajo 7 pt.
- [x] 2.6 Cubrir la plantilla SOP con pruebas de contenido mínimo, descripción/procedimiento extenso, pie extenso, proporciones variadas de imagen y múltiples páginas en ambas orientaciones.

## 3. Evaluación y pauta

- [x] 3.1 Implementar la evaluación Carta vertical con metadatos del SOP, campos del participante, instrucciones, preguntas y marcas vacías.
- [x] 3.2 Garantizar mediante tipos y pruebas que la plantilla del participante no recibe ni expone respuestas correctas.
- [x] 3.3 Implementar la pauta separada, rotulada para el evaluador, con preguntas y alternativas correctas.
- [x] 3.4 Probar paginación de preguntas, bloques inseparables, preguntas sobredimensionadas, ausencia de preguntas y caracteres españoles.

## 4. Centro de documentos

- [x] 4.1 Construir el modal común para seleccionar SOP, evaluación o pauta, navegar páginas, elegir orientación cuando corresponda y mostrar estados vacíos o de error.
- [x] 4.2 Conectar vista previa, descarga blob e impresión aislada al mismo PDF renderizado, con estado de generación, reintento y limpieza de URLs temporales.
- [x] 4.3 Reemplazar las acciones actuales del listado y del formulario de evaluación por el centro de documentos.
- [x] 4.4 Verificar accesibilidad de controles, foco del modal, mensajes de estado y navegación por teclado.

## 5. Calidad y retiro del formato anterior

- [x] 5.1 Crear fixtures documentales mínimo, extenso y multipágina sin datos sensibles, incluyendo riesgos, controles y EPP que obliguen a crecer o continuar el pie.
- [x] 5.2 Añadir pruebas E2E que validen tipo de documento, orientación, conteo de páginas, texto extraíble, nombres de descarga e impresión de todas las páginas.
- [x] 5.3 Usar los dos PDF entregados como referencias de retícula y jerarquía, obtener aprobación del logotipo, generar referencias visuales propias y configurar comparación con tolerancia documentada.
- [x] 5.4 Retirar `printEvaluation`, el flujo `html2canvas`, las páginas HTML ocultas y los estilos obsoletos después de aprobar la regresión.
- [x] 5.5 Ejecutar build, pruebas unitarias, E2E y validación OpenSpec; documentar resultados y cualquier diferencia aceptada.

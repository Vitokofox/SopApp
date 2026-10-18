## Verificación de implementación

Fecha: 2026-08-27

### Bundle

- Aplicación inicial: 228,28 kB (70,09 kB gzip).
- Centro de documentos cargado bajo demanda: 1.244,63 kB (457,00 kB gzip), incluido soporte PNG del navegador.
- El generador no forma parte de la carga inicial gracias a `React.lazy`.

### Pruebas

- Frontend unitario/documental: 10 pruebas aprobadas con Vitest.
- Backend: 7 pruebas aprobadas con pytest.
- E2E Chromium: login, fixture multipágina, centro de documentos, visor, navegación, SOP, evaluación y pauta, nombres de archivo y descargas.
- Inspección PDF: SOP Carta horizontal 792 × 612 pt y multipágina; evaluación Carta vertical 612 × 792 pt; texto esencial extraíble con `pdftotext`.
- Regresión visual: primera página SOP horizontal y evaluación vertical rasterizadas a 96 dpi y comparadas exactamente con referencias versionadas.
- OpenSpec: validación estricta aprobada.

### Decisiones comprobadas

- El PDF conserva texto como texto y ya no depende de `html2canvas` ni JPEG de página completa.
- La altura estimada de cada paso depende del mayor contenido entre descripción, procedimiento, símbolos e imagen.
- El pie nunca reduce su fuente bajo 7 pt; crea bloques de continuación cuando excede la capacidad prevista.
- La evaluación del participante usa un tipo que no contiene el campo de respuesta correcta; la pauta es un documento separado.

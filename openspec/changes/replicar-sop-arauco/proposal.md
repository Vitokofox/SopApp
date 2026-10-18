## Why

La aplicación existe únicamente como un ejecutable Windows empaquetado, sin código fuente mantenible. Se necesita una réplica funcional especificada y verificable que conserve los flujos observados de gestión de procedimientos SOP y permita evolucionarlos sin depender del binario.

## What Changes

- Crear una aplicación web con autenticación local y permisos granulares por módulo.
- Replicar el alta, consulta, edición, eliminación, previsualización y exportación PDF de SOP.
- Replicar el formulario integral de SOP: encabezado, pie, pasos con imagen, riesgos, controles y evaluación.
- Replicar la importación individual desde Excel y PDF y la carga masiva de archivos.
- Replicar la administración de usuarios y de catálogos de jefaturas de área y SSO.
- Replicar el informe de avance y las validaciones necesarias para finalizar un SOP.
- Mantener interfaz en español, portugués e inglés y orientación de salida configurable.
- Mantener contratos HTTP compatibles bajo `/api` con los endpoints observados.

## Capabilities

### New Capabilities

- `identity-and-access`: inicio de sesión, sesión, usuarios, activación, idioma y permisos.
- `sop-management`: ciclo de vida, estructura completa y archivos de imagen de los SOP.
- `sop-import-export`: importación Excel/PDF/masiva, previsualización, impresión y exportación PDF.
- `catalogs-and-reporting`: catálogos de jefaturas e informe de estado/avance con finalización controlada.
- `localized-web-shell`: navegación, visibilidad por permisos y experiencia multilingüe.

### Modified Capabilities

No existen especificaciones previas que modificar.

## Impact

La réplica incorporará una SPA web, una API REST, persistencia relacional y almacenamiento local de imágenes/importaciones. Deberá cubrir los endpoints `/api/auth`, `/api/sops`, `/api/import`, `/api/users`, `/api/chiefs` y `/api/health`. El binario `SOP_Arauco.exe` se conservará como referencia de comportamiento y no será modificado.

## 1. Base del proyecto

- [x] 1.1 Crear estructura separada `backend`, `frontend`, pruebas y directorio de datos configurable sin alterar `SOP_Arauco.exe`.
- [x] 1.2 Configurar FastAPI, SPA TypeScript/React, calidad estática, variables de entorno y comandos reproducibles de desarrollo.
- [x] 1.3 Implementar migraciones SQLite para usuarios, permisos, SOP, pasos, evaluación y catálogos, con pruebas de upgrade/rollback.
- [x] 1.4 Publicar `/api/health` y servir la SPA con fallback de rutas, cubiertos por una prueba de humo.

## 2. Identidad y acceso

- [x] 2.1 Implementar hash de contraseñas, usuario inicial seguro, login Bearer con expiración y `/api/auth/me`.
- [x] 2.2 Implementar autorización reusable para los cinco permisos y pruebas negativas de cada operación protegida.
- [x] 2.3 Implementar CRUD `/api/users`, validación de contraseña, activación y conservación del hash al editar sin contraseña.
- [x] 2.4 Construir login y administración de usuarios en la SPA, incluida la protección visible de `admin`.
- [ ] 2.5 Completar pruebas unitarias, de contrato y E2E de `identity-and-access`.

## 3. Gestión de SOP

- [x] 3.1 Implementar modelos y repositorios transaccionales de SOP, pasos, riesgos, controles y evaluación.
- [x] 3.2 Implementar CRUD `/api/sops` con los nombres, valores predeterminados y respuestas del contrato auditado.
- [x] 3.3 Implementar almacenamiento seguro y endpoint de imagen por paso con validación de archivo y limpieza consistente.
- [x] 3.4 Construir lista de SOP con acciones condicionadas por permisos y confirmación de eliminación.
- [x] 3.5 Construir formulario de encabezado, pie, pasos y evaluación con preservación del borrador y autoría automática.
- [ ] 3.6 Completar pruebas unitarias, de contrato y E2E de `sop-management`.

## 4. Catálogos e informe

- [x] 4.1 Implementar CRUD de jefaturas en `/api/chiefs/area` y `/api/chiefs/sso` y garantizar referencias históricas no destructivas.
- [x] 4.2 Construir administración de catálogos y enlazar sus opciones al formulario SOP.
- [x] 4.3 Implementar el cálculo de avance y las reglas de finalización en un servicio de dominio probado.
- [x] 4.4 Construir informe general con indicadores por criterio y acción de finalizar solo cuando corresponda.
- [x] 4.5 Agregar inicio y fin de seguimiento editables solo en el listado y crear un módulo Carta Gantt con filtros tipo tabla dinámica y dimensiones de filas por área, estado, mes o semana.
- [x] 4.6 Mostrar estado Asignado o Reprogramar en el control de seguimiento según la vigencia del plazo.
- [ ] 4.7 Completar pruebas unitarias, de contrato y E2E de `catalogs-and-reporting`.

## 5. Importación

- [ ] 5.1 Obtener, anonimizar y aprobar archivos Excel/PDF representativos; versionarlos como fixtures de prueba sin datos sensibles.
- [x] 5.2 Definir DTO común y pipeline transaccional de validación previo a persistencia.
- [ ] 5.3 Implementar parser Excel y `/api/import/excel` contra los fixtures aprobados.
- [ ] 5.4 Implementar parser PDF y `/api/import/pdf` contra los fixtures aprobados.
- [x] 5.5 Implementar `/api/import/bulk` con aislamiento y resultado por archivo.
- [x] 5.6 Construir controles de carga individual/masiva y mensajes de resultado en la SPA.
- [ ] 5.7 Completar pruebas de seguridad de archivos, contrato, rollback y E2E de importación.

## 6. Vista previa, PDF y localización

- [x] 6.1 Implementar layout corporativo paginado con orientación horizontal/vertical y dataset sintético completo.
- [x] 6.2 Implementar modal navegable, impresión y descarga PDF con nombre basado en código.
- [ ] 6.3 Obtener activos corporativos autorizados y establecer capturas/PDF de referencia para regresión visual.
- [x] 6.4 Completar catálogos de texto en español, portugués e inglés y selección inicial desde el perfil.
- [x] 6.5 Implementar shell adaptable, navegación y estados de carga, vacío y error accesibles.
- [ ] 6.6 Completar pruebas E2E, visuales y de accesibilidad de `sop-import-export` y `localized-web-shell`.

## 7. Paridad, migración y entrega

- [ ] 7.1 Ejecutar pruebas de contrato comparativas contra el binario para los 23 métodos/rutas auditados.
- [ ] 7.2 Identificar la ubicación de datos del binario y crear importador, respaldo verificable y ensayo de migración.
- [x] 7.3 Configurar respaldo del directorio de datos, logs sin secretos y documentación de operación/recuperación.
- [ ] 7.4 Empaquetar la réplica para Windows y validar instalación limpia, actualización y desinstalación.
- [ ] 7.5 Ejecutar aceptación con usuarios, corregir diferencias y documentar criterios de cambio y rollback.

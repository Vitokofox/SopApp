## Purpose

Define el modelo funcional y el ciclo de vida completo de los procedimientos operacionales estándar y sus pasos.

## ADDED Requirements

### Requirement: Ciclo de vida CRUD del SOP
El sistema SHALL listar, obtener, crear, actualizar y eliminar SOP en `/api/sops`. Crear y actualizar MUST requerir `code` y `title`; SHALL asignar id persistente, `revision` predeterminada `Rev. 0` y estado predeterminado `en proceso`.

#### Scenario: Crear borrador
- **WHEN** un usuario con `sop:create` guarda código y título válidos
- **THEN** el sistema devuelve el SOP persistido con id y estado `en proceso`

#### Scenario: Consultar detalle
- **WHEN** un usuario autenticado solicita un SOP existente por id
- **THEN** recibe el encabezado, pie, evaluación y pasos ordenados del SOP

### Requirement: Estructura integral del SOP
Cada SOP SHALL admitir código, revisión, título, área, elaborador, jefe de área, jefe SSO/MASSO, fechas de publicación y actualización, herramientas, matriz de flexibilidad, regla clave, riesgos, controles, EPP, evaluación, estado y pasos.

#### Scenario: Editar secciones
- **WHEN** un usuario con `sop:edit` modifica campos de encabezado, pie o evaluación
- **THEN** una lectura posterior reproduce los valores guardados

### Requirement: Pasos del procedimiento
Cada paso SHALL contener id, número no negativo, descripción, procedimiento, ruta de imagen y listas de códigos de riesgos y controles. El sistema SHALL admitir cargar una imagen por `POST /api/sops/{sop_id}/steps/{step_id}/image` y asociarla al paso correcto.

#### Scenario: Guardar paso con clasificaciones
- **WHEN** se guarda un paso con riesgos y controles seleccionados
- **THEN** el SOP conserva el número, textos y todas las selecciones

#### Scenario: Cargar imagen
- **WHEN** se envía un archivo de imagen válido a un paso existente
- **THEN** el archivo queda disponible y la ruta del paso se actualiza

### Requirement: Autoría trazable
Al crear un SOP desde la interfaz, el sistema SHALL completar el elaborador con el nombre completo del usuario autenticado, sin impedir que los datos importados conserven su autoría declarada.

#### Scenario: Nuevo SOP desde interfaz
- **WHEN** un usuario abre el formulario de creación
- **THEN** el campo elaborador muestra su nombre completo

### Requirement: Eliminación confirmada
La interfaz SHALL pedir confirmación antes de eliminar un SOP y el servidor MUST exigir `sop:delete`.

#### Scenario: Cancelar eliminación
- **WHEN** el usuario cancela la confirmación
- **THEN** el SOP permanece sin cambios

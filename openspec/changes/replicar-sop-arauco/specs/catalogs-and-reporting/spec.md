## Purpose

Define catálogos administrativos reutilizables y el control objetivo del avance y finalización de cada SOP.

## ADDED Requirements

### Requirement: Catálogo de jefes de área
Un administrador SHALL listar, agregar y eliminar registros `{id, area, name}` mediante `/api/chiefs/area`; el formulario SOP SHALL usar estos registros para completar área y jefe correspondiente.

#### Scenario: Agregar jefe de área
- **WHEN** el administrador registra área y nombre no vacíos
- **THEN** la opción queda disponible al crear o editar un SOP

### Requirement: Catálogo de jefes SSO
Un administrador SHALL listar, agregar y eliminar registros `{id, name}` mediante `/api/chiefs/sso`; el formulario SOP SHALL mostrar sus nombres como opciones.

#### Scenario: Eliminar jefe SSO
- **WHEN** el administrador confirma la eliminación de un registro existente
- **THEN** deja de aparecer en nuevas selecciones sin reescribir SOP históricos

### Requirement: Informe general de avance
El sistema SHALL mostrar total de SOP y, por SOP, código, título, estado y cumplimiento de: existencia de pasos, imagen por paso, riesgos y controles por paso y evaluación completa.

El sistema SHALL permitir asignar exclusivamente desde el listado de SOP un rango de seguimiento con fecha de inicio y fin.

El control de asignación SHALL mostrar `Asignado` cuando el rango esté vigente y `Reprogramar` cuando su fecha de fin haya vencido sin que el SOP esté finalizado.

El sistema SHALL ofrecer un módulo independiente de Carta Gantt que represente el rango planificado y diferencie pendientes, vencidos y finalizados. Sus controles SHALL seguir el concepto de tabla dinámica: los SOP son el detalle, el usuario selecciona la dimensión de filas entre área, estado, mes o semana, y puede filtrar por texto, área, estado y rango de fechas.

#### Scenario: Proyección por fecha de seguimiento
- **WHEN** existen SOP con inicio y fin de seguimiento
- **THEN** la Carta Gantt los ubica cronológicamente y permite seleccionar área, estado, mes o semana como dimensión de filas de una tabla dinámica

#### Scenario: SOP incompleto
- **WHEN** un SOP carece de cualquiera de los componentes requeridos
- **THEN** el informe identifica los criterios incumplidos y no habilita su finalización

### Requirement: Reglas de finalización
Un SOP MUST tener al menos un paso; cada paso MUST tener imagen, al menos un riesgo y al menos un control; la evaluación MUST tener al menos una pregunta y cada pregunta MUST incluir texto, alternativa correcta y opciones A, B, C y D. Solo entonces un usuario con edición SHALL cambiar el estado a `finalizado`.

#### Scenario: Finalización válida
- **WHEN** todos los criterios están completos y el usuario confirma finalizar
- **THEN** el estado persistido cambia a `finalizado`

#### Scenario: Finalización rechazada
- **WHEN** falta uno o más criterios
- **THEN** el sistema conserva el estado anterior e indica el primer requisito pendiente

### Requirement: Salud operativa
El endpoint `GET /api/health` SHALL responder un indicador positivo cuando la API está disponible.

#### Scenario: Servicio disponible
- **WHEN** un monitor consulta `/api/health`
- **THEN** recibe una respuesta exitosa con `{ "ok": true }`

## Purpose

Permite administrar máquinas por área y comprender la planificación de numerosos SOP desde un resumen semanal hasta el detalle individual.

## ADDED Requirements

### Requirement: Catálogo de máquinas por área
Un administrador SHALL listar, crear y eliminar máquinas con `{id, area, name}` en `/api/machines`; nombre y área MUST ser obligatorios y la combinación MUST ser única.

#### Scenario: Crear máquina
- **WHEN** un administrador registra “Línea 5” para “Procesos Secos”
- **THEN** la máquina queda disponible para asignar a SOP de esa área

#### Scenario: Conservar referencia histórica
- **WHEN** se elimina una máquina que ya fue asignada
- **THEN** los SOP existentes conservan el texto de su máquina y la opción deja de ofrecerse para nuevas asignaciones

### Requirement: Asignación de máquina al SOP
Cada SOP SHALL admitir una máquina opcional; el formulario SHALL mostrar solamente máquinas configuradas para el área seleccionada y SHALL limpiar una selección que no corresponda cuando el usuario cambie de área.

#### Scenario: Seleccionar máquina
- **WHEN** el usuario elige un área con máquinas configuradas
- **THEN** puede seleccionar una de ellas antes de guardar el SOP

### Requirement: Jerarquía progresiva de la Carta Gantt
La Carta Gantt SHALL iniciar con una única barra de avance general; esta SHALL poder abrirse para mostrar áreas, cada área SHALL poder abrirse para mostrar máquinas y cada máquina SHALL poder abrirse para mostrar SOP.

#### Scenario: Navegar del general al detalle
- **WHEN** el usuario abre un área y después una máquina
- **THEN** aparecen sus máquinas y luego los SOP correspondientes sin desplegar las demás agrupaciones

### Requirement: Rango global y avance visual
La línea de tiempo SHALL comenzar en la menor fecha de inicio y terminar en la mayor fecha final de los SOP visibles. Cada barra SHALL mostrar su duración con un tono base y su porcentaje de avance con un relleno más oscuro; el avance de grupos SHALL ser el promedio de sus SOP.

#### Scenario: Leer duración y avance
- **WHEN** el usuario observa el resumen general, un área, una máquina o un SOP
- **THEN** la barra ocupa su rango mínimo/máximo y el tramo oscuro representa el porcentaje completado

#### Scenario: Comparar el plan con la fecha actual
- **WHEN** la fecha de hoy está antes, dentro o después del rango de una actividad incompleta
- **THEN** la Carta Gantt muestra la posición de hoy, resalta inicio y fin y clasifica la actividad como planificada, en ejecución o fuera de plazo respectivamente

### Requirement: Matriz semanal agregada
La Carta Gantt SHALL mostrar columnas semanales y SHALL pintar una semana de área o máquina cuando al menos uno de sus SOP tenga duración superpuesta con esa semana; el detalle SOP SHALL pintar todas las semanas comprendidas entre inicio y fin.

#### Scenario: Resumen semanal del área
- **WHEN** varios SOP de un área ocupan semanas distintas o coincidentes
- **THEN** la fila del área pinta la unión de semanas ocupadas e informa cuántos SOP están activos por semana

### Requirement: Lectura operacional y filtros
La vista SHALL conservar filtros por texto, área, máquina, estado y periodo, SHALL distinguir planificado, vencido y finalizado y SHALL mostrar totales de áreas, máquinas y SOP visibles.

#### Scenario: Filtrar una máquina
- **WHEN** el usuario selecciona una máquina
- **THEN** la jerarquía muestra su área contenedora, esa máquina y únicamente sus SOP coincidentes

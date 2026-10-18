## Why

La Carta Gantt actual pierde legibilidad cuando existen muchos SOP porque muestra cada procedimiento como una fila independiente. Se necesita una lectura ejecutiva inicialmente resumida por área, con apertura progresiva por máquina hasta el SOP, conservando la planificación semanal visible.

## What Changes

- Incorporar un catálogo de máquinas asociadas a áreas en Configuración.
- Añadir la máquina al SOP y limitar la selección a las máquinas configuradas para el área elegida.
- Reemplazar la Gantt plana por una jerarquía expandible Área → Máquina → SOP, inicialmente colapsada.
- Mostrar una matriz de semanas donde cada agrupación pinta las semanas ocupadas por cualquiera de sus SOP.
- Mantener filtros, estados, fechas y detalle accesibles sin saturar la vista general.
- Adoptar el sistema visual corporativo de GradingApp: gris Arauco, lima, naranja, superficies limpias, tipografía industrial y densidad controlada.

## Capabilities

### New Capabilities

- `hierarchical-gantt`: catálogo de máquinas, asignación al SOP y visualización Gantt semanal con detalle progresivo.

### Modified Capabilities

Ninguna; la change base todavía no está archivada como especificación principal.

## Impact

Afecta el esquema SQLite, modelos y contratos SOP, un nuevo CRUD `/api/machines`, el módulo Configuración, el formulario SOP y la Carta Gantt. Los SOP existentes permanecen válidos con máquina vacía y se agrupan como “Sin máquina”.

## Context

La Gantt actual usa posiciones porcentuales en una línea continua y genera una fila por SOP incluso al agrupar. No existe máquina en persistencia ni configuración. GradingApp aporta tokens corporativos reutilizables: gris `#696158`, lima `#BFB800`, naranja `#EA7600`, fondos `#F4F4F4`, bordes `#D1D5DB` y superficies blancas.

## Goals / Non-Goals

**Goals:** jerarquía colapsable, escala semanal, catálogo administrable, compatibilidad histórica y diseño corporativo limpio.

**Non-Goals:** dependencias entre SOP, ruta crítica, edición directa de fechas en la Gantt o reemplazo completo del shell de la aplicación.

## Decisions

### Máquina como catálogo y snapshot textual

Se creará `machines(id, area, name)` y se añadirá `sops.machine TEXT NOT NULL DEFAULT ''`. El SOP guarda texto para que borrar el catálogo no destruya historia, igual que las jefaturas actuales.

### Jerarquía calculada en cliente

La API seguirá entregando SOP planos. El frontend filtrará y construirá un árbol área–máquina–SOP; evita un endpoint de reporte prematuro y mantiene compatibilidad.

### Semanas discretas

El intervalo se normalizará a lunes–domingo. Cada celda se activa por solapamiento inclusivo. Las filas agregadas calculan unión y conteo; la tabla tendrá encabezado y primera columna pegajosos y desplazamiento horizontal.

### Estado de expansión local

Áreas y máquinas comienzan cerradas; conjuntos de claves controlan expansión, con acciones “Expandir todo” y “Contraer todo”. Los filtros expanden automáticamente la ruta necesaria para mostrar resultados.

### Sistema visual GradingApp acotado

Se incorporarán tokens `--ga-*` y componentes Gantt con bordes rectos, títulos en mayúsculas, gris corporativo, lima para selección y naranja para atención, sin alterar de forma riesgosa formularios no relacionados.

## Risks / Trade-offs

- [Muchas semanas ensanchan la tabla] → ventana filtrable, scroll horizontal y columnas semanales compactas.
- [SOP antiguos sin máquina] → nodo explícito “Sin máquina”.
- [Borrar catálogo pierde opción] → snapshot textual preservado en SOP.

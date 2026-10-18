## ADDED Requirements

### Requirement: Sistema visual corporativo consistente
La aplicación SHALL utilizar la paleta `#696158`, `#BFB800`, `#EA7600` y `#DFD1A7` como base de un sistema coherente de navegación, acciones, superficies, selección y énfasis.

#### Scenario: Recorrer módulos
- **WHEN** el usuario navega entre inicio, SOP, Gantt, informes, creación y configuración
- **THEN** mantiene una jerarquía visual, espaciado, controles y estados consistentes

### Requirement: Interacción accesible
Los controles SHALL ofrecer foco visible, contraste legible, estados hover/disabled diferenciados y reducción de movimiento según preferencia del sistema.

#### Scenario: Navegar con teclado
- **WHEN** el usuario recorre campos y botones mediante teclado
- **THEN** el control activo presenta un indicador de foco visible

### Requirement: Adaptación responsive
La estructura SHALL adaptarse a escritorio, tablet y móvil sin ocultar acciones ni provocar pérdida funcional.

#### Scenario: Usar pantalla estrecha
- **WHEN** el ancho disponible es menor a 900 píxeles
- **THEN** la navegación deja de ocupar una columna lateral y los contenidos se reorganizan verticalmente

### Requirement: Independencia de impresión
La modernización de la interfaz SHALL NOT alterar el diseño Carta de los SOP y evaluaciones descargables o imprimibles.

#### Scenario: Imprimir documento
- **WHEN** el usuario imprime o descarga un SOP o evaluación
- **THEN** el documento conserva sus reglas tipográficas, dimensiones y paginación propias

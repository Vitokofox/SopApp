## Purpose

Define una interfaz web coherente, adaptable y multilingüe cuyo acceso a módulos refleje los permisos efectivos del usuario.

## ADDED Requirements

### Requirement: Navegación principal
Tras autenticarse, el usuario SHALL acceder a Inicio, Lista de SOP e Informe; Crear SOP SHALL ser visible con permiso de crear o editar, y Configuración únicamente con `user:manage`.

#### Scenario: Usuario operativo sin administración
- **WHEN** inicia sesión un usuario sin `user:manage`
- **THEN** puede usar sus módulos SOP autorizados pero no acceder a Configuración

### Requirement: Idiomas de interfaz
La interfaz SHALL ofrecer español, portugués e inglés, iniciar con el idioma almacenado en el perfil y permitir cambiarlo durante la sesión.

#### Scenario: Perfil en portugués
- **WHEN** inicia sesión un usuario cuyo idioma es `pt`
- **THEN** los textos traducibles de navegación y formularios aparecen en portugués

### Requirement: Formulario organizado
La creación y edición SHALL organizar los datos en cuatro secciones reconocibles: encabezado, pie, pasos y evaluación, manteniendo los valores al navegar entre ellas.

#### Scenario: Navegar entre secciones
- **WHEN** el usuario completa datos de encabezado y abre Pasos
- **THEN** los datos de encabezado permanecen en el borrador del formulario

### Requirement: Estados y errores visibles
La interfaz SHALL comunicar operaciones en curso, ausencia de registros, confirmaciones, errores de credenciales, importación, validación y guardado sin exponer detalles sensibles.

#### Scenario: Lista vacía
- **WHEN** no existen SOP almacenados
- **THEN** la lista muestra un estado vacío comprensible en lugar de una tabla engañosa

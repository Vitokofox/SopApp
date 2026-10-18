## Purpose

Define el acceso autenticado, la sesión y la administración segura de identidades y permisos de la aplicación SOP.

## ADDED Requirements

### Requirement: Autenticación local
El sistema SHALL autenticar `username` y `password` mediante `POST /api/auth/login`, devolver un token Bearer y permitir consultar el usuario vigente en `GET /api/auth/me`. SHALL rechazar credenciales inválidas y usuarios inactivos sin revelar cuál dato falló.

#### Scenario: Inicio de sesión válido
- **WHEN** un usuario activo presenta credenciales válidas
- **THEN** recibe un token Bearer y `/api/auth/me` devuelve id, usuario, nombre, idioma, permisos y estado

#### Scenario: Inicio de sesión inválido
- **WHEN** las credenciales no son válidas o la cuenta está inactiva
- **THEN** el sistema deniega el acceso y no crea una sesión utilizable

### Requirement: Autorización granular
El sistema MUST aplicar en API y UI los permisos `sop:create`, `sop:edit`, `sop:delete`, `sop:import` y `user:manage`; ocultar controles no autorizados no SHALL sustituir la validación del servidor.

#### Scenario: Operación sin permiso
- **WHEN** un usuario autenticado solicita una operación cuyo permiso no posee
- **THEN** el servidor la rechaza y no modifica datos

### Requirement: Administración de usuarios
Un usuario con `user:manage` SHALL listar, crear, actualizar y eliminar usuarios mediante `/api/users`; usuario y nombre son obligatorios, una cuenta nueva requiere contraseña de al menos ocho caracteres, y una actualización sin contraseña SHALL conservar la existente.

#### Scenario: Crear usuario
- **WHEN** un administrador envía usuario, nombre y contraseña válida junto con idioma, permisos y estado
- **THEN** el sistema persiste la cuenta y nunca devuelve su contraseña

#### Scenario: Editar sin cambiar contraseña
- **WHEN** un administrador actualiza una cuenta omitiendo la contraseña
- **THEN** cambian los demás campos y la contraseña anterior continúa siendo válida

### Requirement: Protección de la cuenta administrativa base
La interfaz SHALL impedir eliminar la cuenta cuyo nombre de usuario es `admin`.

#### Scenario: Cuenta base visible
- **WHEN** el administrador revisa la lista de usuarios
- **THEN** la cuenta `admin` no ofrece la acción de eliminación

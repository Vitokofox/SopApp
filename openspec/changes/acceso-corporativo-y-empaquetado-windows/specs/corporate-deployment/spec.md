## ADDED Requirements

### Requirement: Acceso HTTP corporativo
SopApp SHALL escuchar en `0.0.0.0:8090` de forma predeterminada en la distribución Windows y SHALL mostrar las URLs local y corporativa detectadas.

#### Scenario: Acceder desde otro equipo
- **WHEN** el cliente abre `http://IP_DEL_SERVIDOR:8090` y el firewall corporativo permite TCP 8090
- **THEN** recibe la misma aplicación SPA y API servida por el PC servidor

### Requirement: Persistencia OneDrive controlada
La distribución Windows SHALL usar `%USERPROFILE%\OneDrive - ARAUCO\DataBase\sop.db` y SHALL detenerse si la carpeta no está disponible, sin crear una base alternativa junto al ejecutable.

#### Scenario: OneDrive no disponible
- **WHEN** la carpeta corporativa no existe localmente al iniciar
- **THEN** SopApp muestra un error explícito y no inicia el servidor

### Requirement: Cliente sin acceso SQLite
Los equipos cliente SHALL acceder únicamente mediante HTTP; solo el proceso servidor SHALL abrir SQLite y los uploads.

#### Scenario: Uso multiusuario
- **WHEN** varios usuarios trabajan desde navegadores de la red
- **THEN** todas las operaciones pasan por la API del servidor y ningún cliente abre `sop.db` directamente

### Requirement: Distribución Windows reproducible
El ejecutable SHALL construirse como `onedir` usando un Wine prefix dedicado, Python Windows x64, el spec versionado y el frontend compilado; datos productivos y secretos MUST NOT incluirse en el bundle.

#### Scenario: Ejecutar en PC sin Python
- **WHEN** el operador abre `SOP_Arauco.exe` desde la distribución
- **THEN** inicia el backend y sirve el frontend sin depender de una instalación Python del sistema

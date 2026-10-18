## 1. Red corporativa

- [x] 1.1 Configurar host `0.0.0.0`, puerto 8090 y mostrar URL local/corporativa al iniciar.
- [x] 1.2 Documentar acceso cliente por HTTP y regla de firewall Dominio/Privado.

## 2. Persistencia corporativa

- [x] 2.1 Resolver por defecto `%USERPROFILE%\OneDrive - ARAUCO\DataBase` en Windows empaquetado.
- [x] 2.2 Detener el inicio si OneDrive no está disponible y evitar una base local alternativa.
- [x] 2.3 Mantener SQLite y uploads fuera de `_MEIPASS` y limitar el acceso directo al PC servidor.

## 3. Empaquetado

- [x] 3.1 Revisar entrypoint, frontend, dependencias y spec según `windows-python-packager`.
- [x] 3.2 Compilar frontend y generar distribución Windows `onedir` con Python Windows bajo Wine.
- [x] 3.3 Probar ejecutable, frontend, health, persistencia y contenido del release.

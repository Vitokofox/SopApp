# Puesta en marcha de SOP Arauco en la red corporativa

## Arquitectura

El PC `Victor.Valenzuela` actúa como servidor. Solo ese PC abre `sop.db`; los demás equipos ingresan por HTTP y nunca comparten el archivo SQLite.

## Datos oficiales

- Carpeta: `C:\Users\Victor.Valenzuela\OneDrive - ARAUCO\DataBase`
- Base: `C:\Users\Victor.Valenzuela\OneDrive - ARAUCO\DataBase\sop.db`
- Imágenes: `C:\Users\Victor.Valenzuela\OneDrive - ARAUCO\DataBase\uploads`

SopApp detiene el inicio si la carpeta no existe o OneDrive no está disponible. No crea una base alternativa junto al ejecutable.

## Acceso

- En el servidor: `http://127.0.0.1:8090`
- En otro PC: `http://IP_DEL_SERVIDOR:8090`
- Salud: `http://IP_DEL_SERVIDOR:8090/api/health`

Al iniciar, la consola muestra la IP detectada. Para consultarla manualmente use `ipconfig` y busque la dirección IPv4 del adaptador corporativo.

## Firewall

Ejecute `Configurar_Firewall_SOP_Arauco.bat` como administrador. La regla abre TCP 8090 solamente en perfiles Dominio y Privado. Si las políticas corporativas bloquean reglas locales, solicite la excepción a TI/EDR.

## Reglas operacionales

1. OneDrive debe estar iniciado y la carpeta `DataBase` disponible localmente antes de abrir SopApp.
2. Solo una instancia del ejecutable debe operar sobre esta base.
3. Los clientes acceden por navegador; no deben sincronizar ni abrir `sop.db` directamente.
4. Realice respaldos consistentes mediante la herramienta de respaldo de SopApp, no copiando una base mientras está en escritura.

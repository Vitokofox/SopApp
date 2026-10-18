# Acceso corporativo y empaquetado Windows

## Problema

SopApp necesita operar como servidor HTTP en el PC corporativo, almacenar su base en la carpeta OneDrive oficial y distribuirse como ejecutable Windows sin Python instalado.

## Solución

Replicar el patrón operativo de GradingApp: escucha en todas las interfaces, acceso de clientes por IP, SQLite abierto únicamente por el servidor, validación estricta de OneDrive y distribución `onedir` mediante Wine, Python Windows y PyInstaller.

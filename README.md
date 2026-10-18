# SOP Operaciones

Réplica mantenible de la aplicación local SOP Arauco, implementada con FastAPI, SQLite y React/TypeScript. El ejecutable original se conserva sin modificaciones.

## Desarrollo

```bash
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cd frontend && npm install && npm run build && cd ..
cd backend && .venv/bin/python run.py
```

Abra `http://127.0.0.1:8090`. En el primer inicio se crea el administrador configurado mediante `SOP_ADMIN_USERNAME` y `SOP_ADMIN_PASSWORD`. Copie `.env.example`, use una clave JWT aleatoria de al menos 32 caracteres y cambie la contraseña antes de un uso real. No se deben versionar `.env`, bases, uploads ni respaldos.

La distribución Windows escucha en `0.0.0.0:8090` para acceso corporativo por `http://IP_DEL_SERVIDOR:8090`. En Windows busca por defecto `sop.db` en `C:\Users\Victor.Valenzuela\OneDrive - ARAUCO\DataBase`; los clientes acceden únicamente por HTTP. Consulte [deployment/windows/INSTRUCTIVO_SERVIDOR_SOP_ARAUCO.md](deployment/windows/INSTRUCTIVO_SERVIDOR_SOP_ARAUCO.md).

Si el ejecutable original ya utiliza 8090, inicie la réplica temporalmente con `SOP_PORT=8091 .venv/bin/python run.py` desde `backend/`.

## Verificación

```bash
cd backend && .venv/bin/python -m pytest -q
cd frontend && npm run build
openspec validate replicar-sop-arauco --strict
```

## Datos y respaldo

En desarrollo, SQLite e imágenes se guardan en `data/` o en `SOP_DATA_DIR`. En la distribución corporativa Windows, la base y los uploads quedan en la carpeta OneDrive configurada, nunca dentro de los recursos temporales de PyInstaller.

```bash
backend/.venv/bin/python scripts/backup_data.py ./data
```

El respaldo consistente se crea en `data/backups/<fecha>/`. Para recuperar, detenga la aplicación y sustituya `sop.db` y `uploads/` por una copia verificada. Mantenga siempre el respaldo anterior hasta validar login, listado de SOP e imágenes.

## Importación

Los importadores aceptan `.xlsx` con pares `Código`/`Título` y filas de pasos `número, descripción, procedimiento`, y PDF con texto extraíble. La compatibilidad exacta con formatos corporativos debe verificarse con documentos anonimizados reales.

## Windows

El spec [packaging/sop_arauco.spec](packaging/sop_arauco.spec) crea una distribución `onedir`. El frontend debe compilarse antes. La compilación Windows desde Linux requiere un Wine prefix dedicado con Python Windows y PyInstaller; consulte la sección de entrega de OpenSpec.

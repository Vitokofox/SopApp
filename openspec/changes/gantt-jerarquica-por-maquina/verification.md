## Verificación

- Migración SQLite elevada a versión 4 y compatible con bases existentes.
- CRUD `/api/machines` probado, incluido duplicado y conservación del texto histórico en SOP.
- Gantt inicialmente colapsada y navegación Área → Máquina → SOP comprobada en Chromium.
- Matriz semanal probada para lunes–domingo, solapamiento inclusivo y conteo agregado.
- Frontend: 13 pruebas aprobadas.
- Backend: 7 pruebas aprobadas.
- E2E: navegación jerárquica y regresión documental aprobadas.
- Build de producción aprobado.
- OpenSpec validado en modo estricto.

El aviso de chunk grande corresponde al generador PDF existente, que permanece cargado bajo demanda y no forma parte del bundle inicial de la Gantt.

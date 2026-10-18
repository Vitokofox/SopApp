## 1. Persistencia y API

- [x] 1.1 Migrar SQLite con `sops.machine`, tabla `machines` y compatibilidad con bases existentes.
- [x] 1.2 Extender esquemas, repositorio y contratos SOP con máquina opcional.
- [x] 1.3 Implementar CRUD protegido `/api/machines` con validación y pruebas de referencias históricas.

## 2. Configuración y formulario

- [x] 2.1 Añadir tipos, cliente API y carga global del catálogo de máquinas.
- [x] 2.2 Incorporar administración de máquinas por área en Configuración con estados vacío, error y duplicado.
- [x] 2.3 Añadir selector de máquina filtrado por área al formulario SOP y probar cambio de área.

## 3. Gantt jerárquica

- [x] 3.1 Extraer utilidades probadas de semanas, solapamiento, árbol y agregación.
- [x] 3.2 Implementar resumen Área → Máquina → SOP inicialmente colapsado con expansión independiente.
- [x] 3.3 Implementar matriz semanal, conteos agregados, semana actual y tonos de estado.
- [x] 3.4 Incorporar filtros por texto, área, máquina, estado y periodo, totales y controles expandir/contraer.
- [x] 3.5 Añadir nivel Avance general → Área → Máquina → SOP con apertura progresiva por clic.
- [x] 3.6 Representar cada nivel como barra continua entre la fecha mínima y máxima, con relleno oscuro proporcional al avance documental.
- [x] 3.7 Destacar fechas de inicio/fin, proyectar la posición de hoy y clasificar planificado, en ejecución, fuera de plazo y finalizado.

## 4. Diseño y calidad

- [x] 4.1 Aplicar tokens y componentes corporativos inspirados en GradingApp con cabeceras/columnas pegajosas y responsive.
- [x] 4.2 Añadir pruebas frontend de jerarquía y semanas y ampliar pruebas backend de migración/API.
- [x] 4.3 Ejecutar build, suites completas, prueba E2E básica y validación OpenSpec.

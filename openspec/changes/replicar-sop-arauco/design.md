## Context

El único sistema de referencia es `SOP_Arauco.exe`: una SPA React servida por FastAPI, con persistencia SQLite y archivos locales, empaquetada para Windows. La auditoría dinámica confirmó 23 operaciones HTTP bajo `/api`, los modelos publicados en OpenAPI, la cuenta inicial, los permisos y las reglas de finalización. No hay datos SOP precargados para comparar importaciones reales. Véanse `proposal.md` y las especificaciones de esta change.

## Goals / Non-Goals

**Goals:**

- Producir una base de código separada, ejecutable en desarrollo y empaquetable para Windows.
- Mantener contratos de rutas, nombres de campos y comportamiento visible compatibles con el binario.
- Separar dominio, persistencia, importadores y presentación para poder probarlos aisladamente.
- Evitar secretos predeterminados inseguros en entregas productivas.

**Non-Goals:**

- Descompilar o modificar el ejecutable original.
- Replicar defectos visuales o dependencias exactas del binario.
- Integrar SSO corporativo, nube o servicios Arauco no observados.
- Garantizar compatibilidad con plantillas Excel/PDF aún no proporcionadas; se implementará mediante fixtures aprobados.

## Decisions

### Arquitectura compatible y mantenible

Se usará una SPA TypeScript/React y una API Python/FastAPI, porque reproducen los límites y contratos observados y permiten compartir el esquema OpenAPI. La API se dividirá en `auth`, `users`, `sops`, `imports`, `chiefs` y `health`, con servicios de dominio independientes de HTTP. Se consideró una aplicación monolítica renderizada en servidor, pero dificultaría la compatibilidad visual y la previsualización interactiva.

### Persistencia relacional y archivos fuera de la base

SQLite será el valor inicial para instalación local. Tablas normalizadas cubrirán usuarios, permisos, SOP, pasos, riesgos/controles por paso, evaluación y jefaturas. Imágenes y archivos temporales vivirán en un directorio de datos configurable; la base guardará rutas relativas. Se evita guardar binarios en SQLite por tamaño y complejidad de respaldo. Las actualizaciones de SOP y pasos serán transaccionales.

### Contrato exterior compatible, modelo interior tipado

Se conservarán rutas y campos del OpenAPI auditado. Aunque el original serializa `evaluation` como texto JSON, el dominio lo manejará como estructura tipada y el adaptador HTTP mantendrá compatibilidad hasta poder versionar el contrato. Los errores usarán códigos HTTP coherentes y un cuerpo `detail` seguro.

### Seguridad por defecto

Las contraseñas se almacenarán con hash adaptativo, nunca reversible. Los tokens Bearer tendrán expiración y una clave suministrada por configuración. Cada operación aplicará autorización en el servidor. El usuario inicial se creará solo en el primer arranque y exigirá cambio de contraseña o credenciales provistas por variables protegidas. Carga de archivos validará extensión, MIME, tamaño, nombre seguro y contenido; las imágenes se servirán desde rutas controladas.

### Importadores desacoplados

Cada formato implementará un adaptador que produce un DTO SOP común, seguido de validación y persistencia transaccional. La importación masiva aislará cada archivo y reportará resultados por elemento. Se consideró permitir que los parsers escribieran directamente en la base, pero impediría validar de forma uniforme y dejaría datos parciales.

### PDF reproducible en cliente

La SPA compondrá páginas de vista previa con un layout corporativo único usado para imprimir y exportar PDF; un selector determinará orientación. Fuentes, logotipos y estilos serán recursos locales. Se mantendrá el mismo modelo de paginación para evitar divergencias entre pantalla y descarga.

### Pruebas por capas y contrato

Habrá pruebas unitarias de permisos, reglas de finalización y parsers; pruebas de repositorio con base temporal; pruebas de contrato para todos los endpoints y modelos; y pruebas end-to-end para login, CRUD, importación, administración, finalización y PDF. Fixtures anonimizados de Excel/PDF definirán la compatibilidad del importador.

## Risks / Trade-offs

- [Plantillas de importación desconocidas] → obtener ejemplos reales anonimizados y convertirlos en fixtures antes de declarar paridad.
- [Campos de evaluación serializados como JSON textual] → encapsular la conversión en el adaptador y probar round-trip.
- [Diferencias de PDF entre navegadores] → fijar navegador de referencia, recursos locales y pruebas visuales.
- [SQLite con accesos simultáneos] → transacciones breves, WAL y opción futura de repositorio PostgreSQL sin cambiar dominio.
- [Paridad visual no medible con datos vacíos] → crear dataset sintético que cubra todas las secciones y comparar capturas/PDF.

## Migration Plan

1. Construir la réplica en un directorio independiente y conservar el ejecutable como referencia de solo lectura.
2. Implementar esquema y migraciones; importar una copia de datos solo después de identificar la base usada por el binario.
3. Ejecutar pruebas de contrato y paridad con dataset sintético y documentos reales anonimizados.
4. Distribuir una versión piloto con directorio de datos separado y respaldo automático.
5. Tras aceptación, hacer copia verificable de la base/archivos, migrar y cambiar el acceso de usuarios.
6. Ante fallo, detener la réplica y volver al ejecutable y su copia de datos sin conversión inversa.

## Open Questions

- Ubicación y política de respaldo productiva del directorio de datos.
- Plantillas Excel/PDF reales que deben aceptarse además de los formatos inferidos.
- Activos corporativos definitivos y criterios de fidelidad visual para el PDF.

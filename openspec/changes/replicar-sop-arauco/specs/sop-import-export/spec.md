## Purpose

Define la entrada automatizada de documentos SOP y su representación imprimible o descargable para uso operacional.

## ADDED Requirements

### Requirement: Importación individual
Un usuario con `sop:import` SHALL importar un archivo Excel `.xlsx` en `/api/import/excel` o PDF `.pdf` en `/api/import/pdf`; el sistema SHALL validar tipo y contenido, crear el SOP extraído e informar errores accionables sin dejar registros parciales.

#### Scenario: Importar Excel válido
- **WHEN** se carga un Excel compatible
- **THEN** aparece un nuevo SOP con los campos y pasos extraídos

#### Scenario: Archivo inválido
- **WHEN** el archivo no es compatible o no contiene los datos mínimos
- **THEN** la importación se rechaza sin crear un SOP incompleto

### Requirement: Importación masiva
El endpoint `/api/import/bulk` SHALL aceptar múltiples archivos Excel y PDF en una solicitud y devolver un resultado que permita distinguir éxitos y fallos por archivo.

#### Scenario: Lote mixto
- **WHEN** un lote contiene archivos válidos e inválidos
- **THEN** el usuario puede identificar el resultado individual de cada archivo y los válidos quedan disponibles

### Requirement: Previsualización paginada
El sistema SHALL generar una previsualización corporativa del SOP, paginada según sus pasos, con encabezado, metadatos, riesgos, controles, EPP y numeración de página; el usuario SHALL navegar entre páginas.

#### Scenario: Abrir previsualización
- **WHEN** un usuario selecciona previsualizar un SOP con pasos
- **THEN** se presenta la primera página y controles para recorrer todas las páginas

### Requirement: Impresión y PDF
El sistema SHALL permitir imprimir la previsualización y descargarla como PDF con nombre derivado del código del SOP, en orientación horizontal o vertical seleccionable.

#### Scenario: Descargar PDF horizontal
- **WHEN** el usuario selecciona orientación horizontal y descarga
- **THEN** obtiene un PDF horizontal que contiene todas las páginas del SOP

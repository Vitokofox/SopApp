import type { SOP } from '../types'

const procedure = 'Verificar el equipo, confirmar las condiciones operacionales y ejecutar el ajuste indicado manteniendo comunicación con el equipo de trabajo.'

export const printableFixture: SOP = {
  id: 99, code: 'SOP-ÁREA/01', revision: 'Rev. 2', title: 'Procedimiento sintético multipágina', area: 'Área de prueba', machine: 'Máquina de prueba',
  elaborator: 'Persona de prueba', chief_area: 'Jefatura de prueba', chief_masso: 'SSO de prueba', publication_date: '2026-08-27',
  last_update: '2026-08-27', follow_up_date: '', follow_up_start_date: '', follow_up_end_date: '',
  tools_text: 'Llave ajustable\nInstrumento calibrado', flexibility_matrix: 'Operador\nAyudante',
  key_rule: '1.- Intervenir de forma segura\n2.- Detener ante condiciones anormales',
  risks_text: '1.- Atrapamiento\n2.- Caída al mismo nivel\n3.- Exposición a ruido\n4.- Contacto con partes móviles',
  controls_text: '1.- Bloqueo de energías\n2.- Verificación de energía cero\n3.- Segregación del área',
  epp_text: '1.- Casco\n2.- Protección auditiva\n3.- Lentes de seguridad\n4.- Guantes\n5.- Calzado de seguridad',
  steps_per_page: 3, evaluation: JSON.stringify([
    { question_text: '¿Se verificó energía cero?', correct: 'b', a: 'No corresponde', b: 'Sí, antes de intervenir', c: 'Después del trabajo', d: 'Solo si hay ruido' },
    { question_text: '¿Qué se debe hacer ante una condición anormal?', correct: 'c', a: 'Continuar', b: 'Ocultarla', c: 'Detener y comunicar', d: 'Trabajar más rápido' },
  ]), status: 'en proceso',
  steps: Array.from({ length: 12 }, (_, index) => ({ id: index + 1, step_number: index + 1, description: index % 3 === 0 ? 'Descripción más extensa para comprobar el crecimiento automático de la celda y su centrado vertical.' : `Descripción ${index + 1}`, procedure_text: procedure.repeat(index % 4 + 1), image_path: '', risk_codes: ['1', '2'], control_codes: ['1'] })),
}

export const invalidEvaluationFixture: SOP = { ...printableFixture, evaluation: '{contenido inválido', steps: [] }

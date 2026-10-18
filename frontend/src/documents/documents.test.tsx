import { pdf } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'
import { PrintableDocument } from './PdfDocuments'
import { adaptSopForPrint, orderedItems, safeDocumentName } from './model'
import { estimatedFooterHeight, estimatedStepHeight, footerLayout, paginateFooter, paginateQuestions, paginateSop } from './pagination'
import { invalidEvaluationFixture, printableFixture } from './test-fixtures'

describe('adaptador de documentos', () => {
  it('normaliza listas, caracteres españoles y URLs sin alterar el SOP', () => {
    const original = printableFixture.evaluation
    const { model, diagnostics } = adaptSopForPrint(printableFixture)
    expect(diagnostics.filter(item => item.level === 'error')).toHaveLength(0)
    expect(model.title).toContain('sintético')
    expect(model.risks).toHaveLength(4)
    expect(model.steps[0].number).toBe(1)
    expect(printableFixture.evaluation).toBe(original)
  })

  it('informa JSON inválido y mantiene un modelo imprimible', () => {
    const result = adaptSopForPrint(invalidEvaluationFixture)
    expect(result.diagnostics.some(item => item.level === 'error')).toBe(true)
    expect(result.model.participantQuestions).toEqual([])
  })

  it('separa preguntas de participante de respuestas correctas', () => {
    const { model } = adaptSopForPrint(printableFixture)
    expect(model.answerQuestions[0].correct).toBe('b')
    expect('correct' in model.participantQuestions[0]).toBe(false)
    expect(JSON.stringify(model.participantQuestions)).not.toContain('"correct"')
  })

  it('ordena líneas y genera nombres seguros', () => {
    expect(orderedItems('1.- Uno 2.- Dos 3.- Tres')).toEqual(['1.- Uno', '2.- Dos', '3.- Tres'])
    expect(safeDocumentName('sop', 'SOP-ÁREA/01')).toBe('SOP_SOP-AREA-01.pdf')
    expect(safeDocumentName('evaluation', '')).toBe('Evaluacion_sin-codigo.pdf')
    expect(safeDocumentName('answer-key', 'A 1')).toBe('Pauta_A-1.pdf')
  })

  it('extrae solo números en símbolos y formatea pie con formato N.- Peligro', () => {
    const customSop = {
      ...printableFixture,
      risks_text: 'Atropello\n2. Caída a mismo nivel\n3.- Inmersión',
      controls_text: 'EPP\n2. Señalética',
      steps: [
        {
          id: 1, sop_id: 1, step_number: 1, description: 'Paso 1', procedure_text: 'Proc', image_path: '',
          risk_codes: ['2. Caída a mismo nivel', '1.- Atropello'],
          control_codes: ['EPP'],
        },
      ],
    }
    const { model } = adaptSopForPrint(customSop as any)
    expect(model.steps[0].risks).toBe('1-2')
    expect(model.steps[0].controls).toBe('1')
    expect(model.risks).toEqual(['1.- Atropello', '2.- Caída a mismo nivel', '3.- Inmersión'])
    expect(model.controls).toEqual(['1.- EPP', '2.- Señalética'])
  })
})

describe('paginación por contenido', () => {
  it('calcula los riesgos como párrafo continuo para reducir el pie', () => {
    const { model } = adaptSopForPrint(printableFixture)
    const items = Array.from({ length: 10 }, (_, index) => `${index + 1}. Riesgo breve`)
    const compact = estimatedFooterHeight({ ...model, risks: items, controls: [] }, 'landscape')
    const lineByLine = estimatedFooterHeight({ ...model, risks: [], controls: items }, 'landscape')
    expect(compact).toBeLessThan(lineByLine)
  })

  it('respeta la cantidad configurada de pasos por hoja en ambas orientaciones', () => {
    const { model } = adaptSopForPrint(printableFixture)
    expect(estimatedStepHeight(model.steps[3], 'landscape')).toBeGreaterThan(estimatedStepHeight(model.steps[0], 'landscape'))
    const horizontal = paginateSop(model, 'landscape')
    const vertical = paginateSop(model, 'portrait')
    expect(horizontal).toHaveLength(4)
    expect(horizontal.flatMap(page => page.steps)).toHaveLength(model.steps.length)
    expect(vertical.flatMap(page => page.steps)).toHaveLength(model.steps.length)
    expect(paginateSop({ ...model, stepsPerPage: 1 }, 'landscape')).toHaveLength(12)
    expect(paginateSop({ ...model, stepsPerPage: 6 }, 'landscape')).toHaveLength(2)
    expect(horizontal.every(page => page.steps.length <= 3)).toBe(true)
  })

  it('mantiene preguntas completas y conserva su orden', () => {
    const { model } = adaptSopForPrint(printableFixture)
    const pages = paginateQuestions(Array.from({ length: 20 }, (_, index) => ({ ...model.participantQuestions[index % 2], number: index + 1 })))
    expect(pages.length).toBeGreaterThan(1)
    expect(pages.flat().map(question => question.number)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1))
  })

  it('mantiene el pie unido y reduce su tipografía cuando es extenso', () => {
    const { model } = adaptSopForPrint({ ...printableFixture, risks_text: Array.from({ length: 80 }, (_, index) => `${index + 1}.- Riesgo operacional extenso`).join('\n') })
    const chunks = paginateFooter(model, 'landscape')
    expect(chunks).toHaveLength(1)
    expect(chunks.flatMap(chunk => chunk.risks).join('')).toContain('80.- Riesgo operacional extenso')
    expect(footerLayout(model, 'landscape').fontSize).toBeLessThan(7)
    expect(paginateSop(model, 'landscape').some(page => page.footerContinuation)).toBe(false)
  })
})

describe('renderizado PDF', () => {
  it.each(['sop', 'evaluation', 'answer-key'] as const)('genera el documento %s como PDF', async kind => {
    const { model } = adaptSopForPrint(printableFixture)
    const output = await pdf(<PrintableDocument kind={kind} model={model} orientation="landscape"/>).toBuffer()
    let bytes = 0
    for await (const chunk of output as unknown as AsyncIterable<Uint8Array>) bytes += chunk.length
    expect(bytes).toBeGreaterThan(1000)
  }, 20000)
})

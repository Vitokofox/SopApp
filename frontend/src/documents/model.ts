import type { Question, SOP } from '../types'

export type DocumentKind = 'sop' | 'evaluation' | 'answer-key'
export type DocumentOrientation = 'landscape' | 'portrait'

export interface PrintableQuestion {
  number: number
  text: string
  alternatives: Array<{ key: 'a' | 'b' | 'c' | 'd'; text: string }>
}

export interface PrintableAnswer extends PrintableQuestion {
  correct: 'a' | 'b' | 'c' | 'd'
}

export interface PrintableStep {
  id: string
  number: number
  description: string
  procedure: string
  imageUrl?: string
  risks: string
  controls: string
}

export interface PrintableSopModel {
  code: string
  revision: string
  title: string
  area: string
  elaborator: string
  chiefArea: string
  chiefMasso: string
  publicationDate: string
  lastUpdate: string
  tools: string
  flexibility: string[]
  keyRules: string[]
  risks: string[]
  controls: string[]
  epp: string[]
  stepsPerPage: number
  steps: PrintableStep[]
  participantQuestions: PrintableQuestion[]
  answerQuestions: PrintableAnswer[]
}

export interface DocumentDiagnostic {
  level: 'error' | 'warning'
  message: string
}

export interface AdaptedPrintableSop {
  model: PrintableSopModel
  diagnostics: DocumentDiagnostic[]
}

const value = (input: unknown, fallback = '—') => String(input ?? '').trim() || fallback

export function orderedItems(input: string): string[] {
  const raw = input.trim()
  if (!raw) return []
  const explicitLines = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  if (explicitLines.length > 1) return explicitLines
  const numbered = raw.split(/\s+(?=\d+\s*[.)-]\s*)/).map(line => line.trim()).filter(Boolean)
  return numbered.length > 1 ? numbered : [raw]
}

export function formatNumberedItems(input: string): string[] {
  const rawItems = orderedItems(input)
  return rawItems.map((item, index) => {
    const clean = item.trim()
    const match = clean.match(/^(\d+)\s*[-.,]+\s*(.*)$/)
    if (match) {
      return `${match[1]}.- ${match[2].trim()}`
    }
    return `${index + 1}.- ${clean}`
  })
}

export function extractCodeNumbers(codes: string[], refItems: string[]): string {
  const textToNum = new Map<string, number>()
  refItems.forEach((rawItem, idx) => {
    const clean = rawItem.trim()
    const match = clean.match(/^(\d+)\s*[-.,]+\s*(.*)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      const desc = match[2].trim().toLowerCase()
      textToNum.set(desc, num)
      textToNum.set(clean.toLowerCase(), num)
      textToNum.set(String(num), num)
    } else {
      textToNum.set(clean.toLowerCase(), idx + 1)
      textToNum.set(String(idx + 1), idx + 1)
    }
  })

  const nums = new Set<number>()
  for (const code of codes) {
    const clean = String(code ?? '').trim()
    if (!clean) continue
    const match = clean.match(/^(\d+)/)
    if (match) {
      nums.add(parseInt(match[1], 10))
    } else if (textToNum.has(clean.toLowerCase())) {
      nums.add(textToNum.get(clean.toLowerCase())!)
    } else {
      for (const [key, num] of textToNum.entries()) {
        if (key.length > 3 && (key.includes(clean.toLowerCase()) || clean.toLowerCase().includes(key))) {
          nums.add(num)
          break
        }
      }
    }
  }

  return Array.from(nums).sort((a, b) => a - b).join('-')
}

function imageUrl(path: string): string | undefined {
  const clean = path.trim()
  if (!clean) return undefined
  if (/^(data:|blob:|https?:)/i.test(clean)) return clean
  if (typeof window === 'undefined') return clean
  return new URL(clean.startsWith('/') ? clean : `/${clean}`, window.location.origin).href
}

function parseQuestions(serialized: string, diagnostics: DocumentDiagnostic[]): Question[] {
  try {
    const parsed: unknown = JSON.parse(serialized || '[]')
    if (!Array.isArray(parsed)) throw new Error('la raíz no es una lista')
    return parsed.filter((entry): entry is Question => !!entry && typeof entry === 'object').map(entry => ({
      question_text: value((entry as Question).question_text, ''),
      correct: value((entry as Question).correct, '').toLowerCase(),
      a: value((entry as Question).a, ''), b: value((entry as Question).b, ''),
      c: value((entry as Question).c, ''), d: value((entry as Question).d, ''),
    }))
  } catch (error) {
    diagnostics.push({ level: 'error', message: `La evaluación no contiene JSON válido: ${(error as Error).message}.` })
    return []
  }
}

export function adaptSopForPrint(sop: SOP): AdaptedPrintableSop {
  const diagnostics: DocumentDiagnostic[] = []
  const questions = parseQuestions(sop.evaluation, diagnostics)
  const validKeys = new Set(['a', 'b', 'c', 'd'])
  const answerQuestions: PrintableAnswer[] = questions.map((question, index) => ({
    number: index + 1,
    text: value(question.question_text),
    alternatives: (['a', 'b', 'c', 'd'] as const).map(key => ({ key, text: value(question[key]) })),
    correct: (validKeys.has(question.correct) ? question.correct : 'a') as PrintableAnswer['correct'],
  }))
  const participantQuestions: PrintableQuestion[] = answerQuestions.map(({ correct: _correct, ...question }) => question)
  if (!questions.length) diagnostics.push({ level: 'warning', message: 'El SOP no contiene preguntas de evaluación.' })

  const rawRisks = orderedItems(sop.risks_text)
  const rawControls = orderedItems(sop.controls_text)
  const formattedRisks = formatNumberedItems(sop.risks_text)
  const formattedControls = formatNumberedItems(sop.controls_text)

  return {
    diagnostics,
    model: {
      code: value(sop.code, 'sin-código'), revision: value(sop.revision), title: value(sop.title), area: value(sop.area),
      elaborator: value(sop.elaborator), chiefArea: value(sop.chief_area), chiefMasso: value(sop.chief_masso),
      publicationDate: value(sop.publication_date), lastUpdate: value(sop.last_update), tools: value(sop.tools_text),
      flexibility: orderedItems(sop.flexibility_matrix), keyRules: orderedItems(sop.key_rule),
      risks: formattedRisks,
      controls: formattedControls,
      epp: orderedItems(sop.epp_text), stepsPerPage: Math.min(6, Math.max(1, sop.steps_per_page || 3)),
      steps: [...sop.steps].sort((a, b) => a.step_number - b.step_number).map((step, index) => ({
        id: String(step.id ?? `${step.step_number}-${index}`), number: step.step_number, description: value(step.description),
        procedure: value(step.procedure_text), imageUrl: imageUrl(step.image_path),
        risks: extractCodeNumbers(step.risk_codes, rawRisks),
        controls: extractCodeNumbers(step.control_codes, rawControls),
      })),
      participantQuestions, answerQuestions,
    },
  }
}

export function safeDocumentName(kind: DocumentKind, code: string): string {
  const safeCode = code.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'sin-codigo'
  const prefix: Record<DocumentKind, string> = { sop: 'SOP', evaluation: 'Evaluacion', 'answer-key': 'Pauta' }
  return `${prefix[kind]}_${safeCode}.pdf`
}

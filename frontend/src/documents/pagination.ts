import type { DocumentOrientation, PrintableQuestion, PrintableSopModel, PrintableStep } from './model'

export interface FooterContent { keyRules: string[]; risks: string[]; controls: string[]; epp: string[] }
export interface SopPagePlan { steps: PrintableStep[]; footer: FooterContent; footerContinuation?: number }

const countLines = (text: string, chars: number) => text.split(/\r?\n/).reduce((total, line) => total + Math.max(1, Math.ceil(line.length / chars)), 0)

export function estimatedStepHeight(step: PrintableStep, orientation: DocumentOrientation): number {
  const portrait = orientation === 'portrait'
  const lineHeight = portrait ? 10 : 11
  const description = countLines(step.description, portrait ? 24 : 31) * lineHeight + 14
  const procedure = countLines(step.procedure, portrait ? 43 : 65) * lineHeight + 14
  const symbols = Math.max(countLines(step.risks, 14), countLines(step.controls, 14)) * lineHeight * 2 + 20
  return Math.max(portrait ? 66 : 72, description, procedure, symbols)
}

export function estimatedFooterHeight(model: PrintableSopModel, orientation: DocumentOrientation): number {
  const widths = orientation === 'portrait' ? [18, 29, 22, 34] : [18, 34, 23, 47]
  const groups = [model.keyRules, model.risks, model.controls, model.epp]
  const lines = groups.map((items, index) => countLines(items.join(index === 1 ? ' · ' : '\n'), widths[index]))
  return Math.max(54, Math.max(...lines, 1) * 8.4 + 22)
}

export function paginateFooter(model: PrintableSopModel, orientation: DocumentOrientation): FooterContent[] {
  return [{ keyRules: model.keyRules, risks: model.risks, controls: model.controls, epp: model.epp }]
}

export function footerLayout(model: PrintableSopModel, orientation: DocumentOrientation): { fontSize:number; height:number } {
  const natural = estimatedFooterHeight(model, orientation)
  const maximum = orientation === 'portrait' ? 150 : 112
  const fontSize = Math.max(4.2, Math.min(7, 7 * maximum / Math.max(natural, maximum)))
  return { fontSize, height: Math.min(maximum, natural * fontSize / 7) }
}

export function paginateSop(model: PrintableSopModel, orientation: DocumentOrientation): SopPagePlan[] {
  const configured = Math.min(6, Math.max(1, model.stepsPerPage || 3))
  if (model.steps.length) {
    const footers = paginateFooter(model, orientation)
    const pages: SopPagePlan[] = []
    for (let index = 0; index < model.steps.length; index += configured) pages.push({ steps: model.steps.slice(index, index + configured), footer: footers[0] })
    return pages
  }
  const footers = paginateFooter(model, orientation)
  return [{ steps: [], footer: footers[0] }]
}

export function paginateQuestions(questions: PrintableQuestion[]): PrintableQuestion[][] {
  const available = 650
  const pages: PrintableQuestion[][] = []
  let current: PrintableQuestion[] = []
  let used = 0
  for (const question of questions) {
    const alternatives = question.alternatives.reduce((sum, option) => sum + countLines(option.text, 78), 0)
    const height = Math.min(available, 38 + countLines(question.text, 82) * 13 + alternatives * 12)
    if (current.length && used + height > available) {
      pages.push(current)
      current = []
      used = 0
    }
    current.push(question)
    used += height
  }
  if (current.length) pages.push(current)
  return pages
}

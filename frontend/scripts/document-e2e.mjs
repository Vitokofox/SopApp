import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'

const baseURL = process.env.SOP_E2E_URL || 'http://127.0.0.1:5173'
async function inspectPdf(page, target, expectedSize, expectedText) {
  const base64 = await page.locator('.document-frame').evaluate(async frame => {
    const response = await fetch(frame.getAttribute('src').split('#')[0])
    const bytes = new Uint8Array(await response.arrayBuffer())
    let binary = ''; for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
    return btoa(binary)
  })
  await writeFile(target, Buffer.from(base64, 'base64'))
  const info = execFileSync('pdfinfo', [target], { encoding: 'utf8' })
  const text = execFileSync('pdftotext', ['-layout', target, '-'], { encoding: 'utf8' })
  if (!info.includes(expectedSize)) throw new Error(`Tamaño de página inesperado en ${target}`)
  if (!text.includes(expectedText)) throw new Error(`Texto esencial ausente en ${target}`)
  return Number(info.match(/Pages:\s+(\d+)/)?.[1] || 0)
}
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/snap/bin/chromium', headless: true, args: ['--no-sandbox'] })
try {
  const page = await browser.newPage({ acceptDownloads: true })
  const browserErrors = []
  page.on('console', message => { if ((message.type() === 'error' || message.type() === 'warning') && !message.text().startsWith('Failed to load resource:')) browserErrors.push(message.text()) })
  page.on('pageerror', error => browserErrors.push(error.message))
  await page.goto(baseURL)
  await page.getByLabel('Usuario').fill('admin')
  await page.getByLabel('Contraseña').fill('Admin123*')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await page.waitForFunction(() => !!localStorage.getItem('sop_token'))
  await page.evaluate(async () => {
    const token = localStorage.getItem('sop_token')
    const procedure = 'Verificar condiciones operacionales y ejecutar el ajuste manteniendo comunicación con el equipo de trabajo. '
    const response = await fetch('/api/sops', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({
      code: 'E2E-DOC-01', revision: 'Rev. 1', title: 'Prueba documental multipágina', area: 'Área prueba', machine: 'Máquina E2E', elaborator: 'Usuario E2E', chief_area: 'Jefatura', chief_masso: 'SSO',
      publication_date: '2026-08-27', last_update: '2026-08-27', follow_up_start_date: '2026-08-03', follow_up_end_date: '2026-08-28', tools_text: 'Instrumento calibrado', flexibility_matrix: 'Operador\nAyudante', key_rule: '1.- Trabajo seguro',
      risks_text: '1.- Atrapamiento\n2.- Ruido', controls_text: '1.- Bloqueo\n2.- Verificación', epp_text: '1.- Casco\n2.- Lentes\n3.- Guantes', status: 'en proceso',
      evaluation: JSON.stringify([{ question_text: '¿Qué control se aplica?', correct: 'b', a: 'Ninguno', b: 'Bloqueo', c: 'Continuar', d: 'Omitir' }]),
      steps: Array.from({ length: 8 }, (_, index) => ({ step_number: index + 1, description: `Descripción ${index + 1}`, procedure_text: procedure.repeat(index % 3 + 1), image_path: '', risk_codes: ['1'], control_codes: ['1'] })),
    }) })
    if (!response.ok && response.status !== 409) throw new Error(`No se pudo crear fixture E2E: ${response.status}`)
  })
  await page.reload()
  await page.getByRole('button', { name: 'Carta Gantt', exact: true }).click()
  await page.getByRole('button', { name: /Área prueba/ }).waitFor()
  if (await page.getByText('E2E-DOC-01', { exact: true }).count()) throw new Error('La Gantt no inició colapsada')
  await page.getByRole('button', { name: /Área prueba/ }).click()
  await page.getByRole('button', { name: /Máquina E2E/ }).click()
  await page.getByText('E2E-DOC-01', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Lista de SOP', exact: true }).click()
  const sopRow = page.getByRole('row').filter({ hasText: 'E2E-DOC-01' }).first()
  await sopRow.waitFor()
  await sopRow.getByTitle('Previsualizar').click()
  await page.getByRole('dialog').waitFor()
  await page.locator('.document-frame').waitFor()
  await page.getByText(/Página 1 de \d+/).waitFor()
  const sopPages = await inspectPdf(page, '/tmp/sop-e2e-document.pdf', '792 x 612 pts (letter)', 'Prueba documental multipágina')
  if (sopPages < 2) throw new Error('El fixture SOP no produjo múltiples páginas')
  if (await page.getByRole('button', { name: 'Imprimir' }).isDisabled()) throw new Error('La impresión SOP quedó deshabilitada')

  const sopDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar PDF' }).click()
  const sop = await sopDownload
  if (sop.suggestedFilename() !== 'SOP_E2E-DOC-01.pdf') throw new Error(`Nombre SOP inesperado: ${sop.suggestedFilename()}`)

  const documentSelect = page.locator('.document-controls select').first()
  await documentSelect.selectOption('evaluation')
  await page.locator('.document-frame').waitFor()
  await inspectPdf(page, '/tmp/evaluacion-e2e-document.pdf', '612 x 792 pts (letter)', '¿Qué control se aplica?')
  const evaluationDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar PDF' }).click()
  const evaluation = await evaluationDownload
  if (evaluation.suggestedFilename() !== 'Evaluacion_E2E-DOC-01.pdf') throw new Error(`Nombre evaluación inesperado: ${evaluation.suggestedFilename()}`)

  await documentSelect.selectOption('answer-key')
  await page.getByText('El SOP no contiene preguntas').waitFor({ state: 'detached' }).catch(() => {})
  const keyDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar PDF' }).click()
  const key = await keyDownload
  if (key.suggestedFilename() !== 'Pauta_E2E-DOC-01.pdf') throw new Error(`Nombre pauta inesperado: ${key.suggestedFilename()}`)
  if (browserErrors.length) throw new Error(`Errores del navegador:\n${browserErrors.join('\n')}`)
  execFileSync('pdftoppm', ['-f', '1', '-singlefile', '-png', '-r', '96', '/tmp/sop-e2e-document.pdf', '/tmp/sop-e2e-current'])
  execFileSync('pdftoppm', ['-f', '1', '-singlefile', '-png', '-r', '96', '/tmp/evaluacion-e2e-document.pdf', '/tmp/evaluation-e2e-current'])
  execFileSync('cmp', ['tests/references/sop-letter-landscape.png', '/tmp/sop-e2e-current.png'])
  execFileSync('cmp', ['tests/references/evaluation-letter-portrait.png', '/tmp/evaluation-e2e-current.png'])
  console.log('E2E documentos: SOP, evaluación y pauta generados y descargados correctamente.')
} finally {
  await browser.close()
}

import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import logo from '../assets/arauco-logo.png'
import type { DocumentKind, DocumentOrientation, PrintableAnswer, PrintableQuestion, PrintableSopModel, PrintableStep } from './model'
import { footerLayout, paginateQuestions, paginateSop, type FooterContent } from './pagination'

const colors = {
  brand: '#bfb800',
  blue: '#2e5cb8',
  red: '#c83a3a',
  border: '#111111',
  soft: '#f6f7f2',
}
const logoSource = typeof window === 'undefined' ? '' : logo

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', padding: 8, color: '#111', backgroundColor: '#fff' },
  outerFrame: {
    border: `1.5 solid ${colors.border}`,
    borderRadius: 4,
    padding: 6,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topSection: { display: 'flex', flexDirection: 'column' },
  logo: { width: 110, height: 21, objectFit: 'contain', marginBottom: 4 },
  row: { display: 'flex', flexDirection: 'row' },
  box: { border: `1 solid ${colors.border}` },
  label: {
    color: '#fff',
    backgroundColor: colors.brand,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  value: {
    textAlign: 'center',
    paddingVertical: 3,
    paddingHorizontal: 3,
    color: '#111',
  },
  metaRow: { display: 'flex', flexDirection: 'row', marginBottom: 3, gap: 3 },
  support: { display: 'flex', flexDirection: 'row', marginBottom: 4, gap: 3 },
  supportValue: { minHeight: 40, padding: 4, justifyContent: 'center' },
  legendContainer: { display: 'flex', flexDirection: 'column', gap: 3, paddingRight: 4 },
  legendRow: { display: 'flex', flexDirection: 'row', alignItems: 'center' },
  legendPill: { width: 22, height: 8, borderRadius: 3, border: `1 solid ${colors.border}`, marginRight: 4 },
  legendText: { color: '#111' },

  tableContainer: { display: 'flex', flexDirection: 'column' },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: colors.brand,
    borderTop: `1 solid ${colors.border}`,
    borderLeft: `1 solid ${colors.border}`,
  },
  tableHeaderCell: {
    borderRight: `1 solid ${colors.border}`,
    borderBottom: `1 solid ${colors.border}`,
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    paddingVertical: 3,
    paddingHorizontal: 5,
    textAlign: 'left',
  },
  stepRow: {
    display: 'flex',
    flexDirection: 'row',
    borderLeft: `1 solid ${colors.border}`,
  },
  stepCell: {
    borderRight: `1 solid ${colors.border}`,
    borderBottom: `1 solid ${colors.border}`,
    padding: 4,
    justifyContent: 'center',
  },
  identity: { display: 'flex', flexDirection: 'row', padding: 0 },
  stepNumber: {
    width: '20%',
    backgroundColor: colors.brand,
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    justifyContent: 'center',
    borderRight: `1 solid ${colors.border}`,
  },
  imageWrap: { width: '80%', padding: 2, alignItems: 'center', justifyContent: 'center' },
  stepImage: { maxWidth: '96%', maxHeight: 78, objectFit: 'contain' },
  missingImage: { color: '#777', textAlign: 'center' },
  symbolCell: { alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 4 },
  symbol: {
    width: '88%',
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    border: `1 solid ${colors.border}`,
    borderRadius: 4,
    paddingVertical: 3,
    textAlign: 'center',
    minHeight: 14,
  },
  description: { textAlign: 'center', fontFamily: 'Helvetica-Bold', lineHeight: 1.25 },
  procedure: { textAlign: 'left', lineHeight: 1.25 },

  footer: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 4,
    borderTop: `1 solid ${colors.border}`,
    borderLeft: `1 solid ${colors.border}`,
  },
  footerCell: { borderRight: `1 solid ${colors.border}`, borderBottom: `1 solid ${colors.border}`, width: '25%' },
  footerText: { padding: 4, lineHeight: 1.22 },
  footerContinuation: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 3 },
  pageNumber: { position: 'absolute', right: 20, bottom: 7, fontSize: 7, color: '#555' },

  docTitle: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: colors.brand, marginBottom: 4 },
  evalMeta: { border: `1 solid ${colors.border}`, padding: 6, marginBottom: 7 },
  fields: { display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 5 },
  field: { flexGrow: 1, borderBottom: `1 solid ${colors.border}`, paddingBottom: 2 },
  instruction: { backgroundColor: '#f9f9ee', border: `1 solid ${colors.brand}`, padding: 6, marginBottom: 8 },
  question: { border: `1 solid #777`, padding: 7, marginBottom: 7 },
  questionText: { fontFamily: 'Helvetica-Bold', marginBottom: 5, lineHeight: 1.25 },
  option: { display: 'flex', flexDirection: 'row', gap: 5, marginBottom: 3, lineHeight: 1.2 },
  checkBox: { width: 10, height: 10, border: `1 solid ${colors.border}` },
  evaluatorBanner: { backgroundColor: colors.red, color: '#fff', fontFamily: 'Helvetica-Bold', padding: 6, textAlign: 'center', marginBottom: 8 },
  answerRow: { display: 'flex', flexDirection: 'row', borderBottom: '1 solid #bbb', paddingVertical: 5 },
})

function MetaBox({ label, value, flex, blue = false, fontSize }: { label: string; value: string; flex: number; blue?: boolean; fontSize: number }) {
  return (
    <View style={[styles.box, { flex }]}>
      <Text style={[styles.label, blue ? { backgroundColor: colors.blue } : {}, { fontSize }]}>{label}</Text>
      <Text style={[styles.value, { fontSize }]}>{value}</Text>
    </View>
  )
}

function SopHeader({ model, page, total, fontSize }: { model: PrintableSopModel; page: number; total: number; fontSize: number }) {
  return (
    <View style={styles.topSection}>
      {logoSource ? <Image src={logoSource} style={styles.logo} /> : <View style={styles.logo} />}
      <View style={styles.metaRow}>
        <MetaBox label="Revisión" value={model.revision} flex={12} fontSize={fontSize} />
        <MetaBox label="Procedimiento Estándar" value={model.title} flex={28} fontSize={fontSize} />
        <MetaBox label="Elaborador" value={model.elaborator} flex={16} fontSize={fontSize} />
        <MetaBox label="Área" value={model.area} flex={16} fontSize={fontSize} />
        <MetaBox label="Identificador" value={model.code} flex={16} fontSize={fontSize} />
        <MetaBox label="Hoja" value={`${page} de ${total}`} flex={12} fontSize={fontSize} />
      </View>
      <View style={styles.metaRow}>
        <MetaBox label="Fecha Publicación" value={model.publicationDate} flex={12} fontSize={fontSize} />
        <MetaBox label="Validaciones" value="—" flex={28} fontSize={fontSize} />
        <MetaBox label="Jefe de Área" value={model.chiefArea} flex={16} fontSize={fontSize} />
        <MetaBox label="Jefe Masso" value={model.chiefMasso} flex={16} fontSize={fontSize} />
        <MetaBox label="Última Actualización" value={model.lastUpdate} flex={28} fontSize={fontSize} />
      </View>
      <View style={styles.support}>
        <View style={[styles.box, { flex: 56 }]}>
          <Text style={[styles.label, { fontSize }]}>Herramientas a utilizar</Text>
          <View style={styles.supportValue}>
            <Text style={{ fontSize }}>{model.tools || '—'}</Text>
          </View>
        </View>
        <View style={[styles.box, { flex: 44 }]}>
          <Text style={[styles.label, { fontSize, backgroundColor: colors.blue }]}>Matriz de flexibilidad</Text>
          <View style={[styles.supportValue, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={{ fontSize }}>{model.flexibility.join('\n') || '—'}</Text>
            <View style={styles.legendContainer}>
              <View style={styles.legendRow}>
                <View style={[styles.legendPill, { backgroundColor: colors.red }]} />
                <Text style={[styles.legendText, { fontSize: Math.max(6, fontSize - 0.5) }]}>Riesgo</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendPill, { backgroundColor: colors.blue }]} />
                <Text style={[styles.legendText, { fontSize: Math.max(6, fontSize - 0.5) }]}>Medida de Control</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

function documentDensity(model: PrintableSopModel, orientation: DocumentOrientation, stepsPerPage: number) {
  const count = Math.min(6, Math.max(1, stepsPerPage))
  const pageHeight = orientation === 'landscape' ? 612 : 792
  const structuralHeight = orientation === 'landscape' ? 188 : 210
  const available = Math.max(150, pageHeight - structuralHeight - footerLayout(model, orientation).height)
  const rowHeight = available / count
  const body = Math.max(6.5, (orientation === 'landscape' ? 8.5 : 7.8) - (count > 3 ? (count - 3) * 0.45 : 0))
  const header = Math.max(8.5, 11 - (count - 1) * 0.4)
  const imageHeight = Math.max(34, rowHeight - 10)
  return { body, rowHeight, imageHeight, header }
}

function StepTableHeader({ model, orientation, stepsPerPage }: { model: PrintableSopModel; orientation: DocumentOrientation; stepsPerPage: number }) {
  const size = documentDensity(model, orientation, stepsPerPage).header
  return (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, { width: '19%', fontSize: size }]}>Paso</Text>
      <Text style={[styles.tableHeaderCell, { width: '13%', fontSize: size }]}>Símbolo</Text>
      <Text style={[styles.tableHeaderCell, { width: '25%', fontSize: size }]}>Descripción</Text>
      <Text style={[styles.tableHeaderCell, { width: '43%', fontSize: size }]}>Procedimiento</Text>
    </View>
  )
}

function StepRow({ model, step, orientation, stepsPerPage }: { model: PrintableSopModel; step: PrintableStep; orientation: DocumentOrientation; stepsPerPage: number }) {
  const density = documentDensity(model, orientation, stepsPerPage), body = density.body
  return (
    <View style={[styles.stepRow, { height: density.rowHeight }]} wrap={false}>
      <View style={[styles.stepCell, styles.identity, { width: '19%' }]}>
        <View style={[styles.stepNumber, { fontSize: Math.max(13, body * 2.3) }]}>
          <Text>{step.number}</Text>
        </View>
        <View style={styles.imageWrap}>
          {step.imageUrl ? (
            <Image src={step.imageUrl} style={[styles.stepImage, { maxHeight: density.imageHeight }]} />
          ) : (
            <Text style={[styles.missingImage, { fontSize: body }]}>Sin imagen</Text>
          )}
        </View>
      </View>
      <View style={[styles.stepCell, styles.symbolCell, { width: '13%' }]}>
        <Text style={[styles.symbol, { backgroundColor: colors.red, fontSize: body }]}>{step.risks || ' '}</Text>
        <Text style={[styles.symbol, { backgroundColor: colors.blue, fontSize: body }]}>{step.controls || ' '}</Text>
      </View>
      <View style={[styles.stepCell, { width: '25%', alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[styles.description, { fontSize: body }]}>{step.description}</Text>
      </View>
      <View style={[styles.stepCell, { width: '43%', alignItems: 'flex-start', justifyContent: 'flex-start' }]}>
        <Text style={[styles.procedure, { fontSize: body }]}>{step.procedure}</Text>
      </View>
    </View>
  )
}

function Footer({ model, content, continuation, orientation }: { model: PrintableSopModel; content: FooterContent; continuation?: number; orientation: DocumentOrientation }) {
  const density = footerLayout(model, orientation)
  const cells: Array<{ label: string; items: string[]; color: string }> = [
    { label: 'Regla Clave', items: content.keyRules, color: colors.brand },
    { label: 'Riesgos', items: content.risks, color: colors.red },
    { label: 'Medida de Control', items: content.controls, color: colors.blue },
    { label: 'EPP', items: content.epp, color: colors.brand },
  ]
  return (
    <>
      {continuation && <Text style={styles.footerContinuation}>Continuación de información de seguridad · bloque {continuation}</Text>}
      <View style={[styles.footer, { minHeight: density.height }]} wrap={false}>
        {cells.map((cell) => (
          <View key={cell.label} style={styles.footerCell}>
            <Text style={[styles.label, { backgroundColor: cell.color, fontSize: Math.max(6, density.fontSize + 1) }]}>{cell.label}</Text>
            <Text style={[styles.footerText, { fontSize: density.fontSize, padding: Math.max(2, density.fontSize * 0.55) }]}>
              {cell.items.join('\n') || '—'}
            </Text>
          </View>
        ))}
      </View>
    </>
  )
}

function SopDocument({ model, orientation }: { model: PrintableSopModel; orientation: DocumentOrientation }) {
  const plans = paginateSop(model, orientation)
  return (
    <Document title={`SOP ${model.code}`} author={model.elaborator} subject={model.title} language="es-CL">
      {plans.map((plan, index) => (
        <Page key={index} size="LETTER" orientation={orientation} style={styles.page}>
          <View style={styles.outerFrame}>
            <View>
              <SopHeader model={model} page={index + 1} total={plans.length} fontSize={orientation === 'landscape' ? 7.5 : 6.8} />
              <StepTableHeader model={model} orientation={orientation} stepsPerPage={model.stepsPerPage} />
              {plan.footerContinuation ? (
                <Text style={[styles.instruction, { fontSize: 8.5 }]}>La información continúa para mantener el tamaño mínimo de lectura y evitar recortes.</Text>
              ) : plan.steps.length ? (
                plan.steps.map(step => (
                  <StepRow key={step.id} model={model} step={step} orientation={orientation} stepsPerPage={model.stepsPerPage} />
                ))
              ) : (
                <View style={[styles.box, { padding: 20 }]}>
                  <Text style={{ textAlign: 'center', fontSize: 9 }}>Sin pasos registrados</Text>
                </View>
              )}
            </View>
            <Footer model={model} content={plan.footer} continuation={plan.footerContinuation} orientation={orientation} />
          </View>
        </Page>
      ))}
    </Document>
  )
}

function EvaluationHeader({ model, title }: { model: PrintableSopModel; title: string }) {
  return (
    <>
      {logoSource ? <Image src={logoSource} style={styles.logo} /> : <View style={styles.logo} />}
      <Text style={styles.docTitle}>{title}</Text>
      <View style={styles.evalMeta}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{model.code} · {model.revision}</Text>
        <Text style={{ fontSize: 9 }}>{model.title}</Text>
        <Text style={{ fontSize: 8 }}>Área: {model.area}</Text>
      </View>
    </>
  )
}

function QuestionBlock({ question }: { question: PrintableQuestion }) {
  return (
    <View style={styles.question} wrap={false}>
      <Text style={[styles.questionText, { fontSize: 10 }]}>{question.number}. {question.text}</Text>
      {question.alternatives.map(option => (
        <View key={option.key} style={styles.option}>
          <View style={styles.checkBox} />
          <Text style={{ width: 16, fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{option.key.toUpperCase()})</Text>
          <Text style={{ flexGrow: 1, fontSize: 9 }}>{option.text}</Text>
        </View>
      ))}
    </View>
  )
}

function EvaluationDocument({ model }: { model: PrintableSopModel }) {
  const pages = paginateQuestions(model.participantQuestions)
  return (
    <Document title={`Evaluación ${model.code}`} author={model.elaborator} subject={model.title} language="es-CL">
      {pages.map((questions, index) => (
        <Page key={index} size="LETTER" orientation="portrait" style={styles.page}>
          <EvaluationHeader model={model} title="EVALUACIÓN DEL PARTICIPANTE" />
          <View style={styles.fields}>
            <Text style={[styles.field, { fontSize: 8 }]}>Nombre:</Text>
            <Text style={[styles.field, { fontSize: 8 }]}>Identificador:</Text>
            <Text style={[styles.field, { fontSize: 8 }]}>Área:</Text>
          </View>
          <View style={styles.fields}>
            <Text style={[styles.field, { fontSize: 8 }]}>Fecha:</Text>
            <Text style={[styles.field, { fontSize: 8 }]}>Puntaje:</Text>
            <Text style={[styles.field, { fontSize: 8 }]}>Firma:</Text>
          </View>
          <Text style={[styles.instruction, { fontSize: 8 }]}>
            Instrucciones: marque una sola alternativa por pregunta. Responda con letra clara y entregue el documento al evaluador.
          </Text>
          {questions.map(question => (
            <QuestionBlock key={question.number} question={question} />
          ))}
          <Text style={styles.pageNumber}>{index + 1}/{pages.length}</Text>
        </Page>
      ))}
    </Document>
  )
}

function AnswerRow({ question }: { question: PrintableAnswer }) {
  const selected = question.alternatives.find(option => option.key === question.correct)
  return (
    <View style={styles.answerRow} wrap={false}>
      <Text style={{ width: '9%', fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{question.number}</Text>
      <Text style={{ width: '61%', fontSize: 9 }}>{question.text}</Text>
      <Text style={{ width: '30%', fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{question.correct.toUpperCase()}) {selected?.text}</Text>
    </View>
  )
}

function AnswerKeyDocument({ model }: { model: PrintableSopModel }) {
  return (
    <Document title={`Pauta ${model.code}`} author={model.elaborator} subject={model.title} language="es-CL">
      <Page size="LETTER" orientation="portrait" style={styles.page}>
        <EvaluationHeader model={model} title="PAUTA DE RESPUESTAS" />
        <Text style={[styles.evaluatorBanner, { fontSize: 10 }]}>MATERIAL DE USO EXCLUSIVO DEL EVALUADOR</Text>
        <View style={[styles.row, { borderBottom: `2 solid ${colors.brand}`, paddingBottom: 4 }]}>
          <Text style={{ width: '9%', fontSize: 8, fontFamily: 'Helvetica-Bold' }}>N.º</Text>
          <Text style={{ width: '61%', fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Pregunta</Text>
          <Text style={{ width: '30%', fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Respuesta correcta</Text>
        </View>
        {model.answerQuestions.map(question => (
          <AnswerRow key={question.number} question={question} />
        ))}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} fixed />
      </Page>
    </Document>
  )
}

export function PrintableDocument({ kind, model, orientation }: { kind: DocumentKind; model: PrintableSopModel; orientation: DocumentOrientation }) {
  if (kind === 'evaluation') return <EvaluationDocument model={model}/>
  if (kind === 'answer-key') return <AnswerKeyDocument model={model}/>
  return <SopDocument model={model} orientation={orientation}/>
}

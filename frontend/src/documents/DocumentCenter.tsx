import { pdf } from '@react-pdf/renderer'
import { Buffer } from 'buffer'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { SOP } from '../types'
import { PrintableDocument } from './PdfDocuments'
import { adaptSopForPrint, safeDocumentName, type DocumentKind, type DocumentOrientation } from './model'

const browserGlobal = globalThis as typeof globalThis & { Buffer?: typeof Buffer }
browserGlobal.Buffer ??= Buffer

interface Props { sop: SOP; initialOrientation?: DocumentOrientation; onClose: () => void }

const labels: Record<DocumentKind, string> = { sop: 'SOP', evaluation: 'Evaluación participante', 'answer-key': 'Pauta evaluador' }

async function countPdfPages(blob: Blob): Promise<number> {
  const source = new TextDecoder('latin1').decode(await blob.arrayBuffer())
  return Math.max(1, (source.match(/\/Type\s*\/Page\b/g) || []).length)
}

export default function DocumentCenter({ sop, initialOrientation = 'landscape', onClose }: Props) {
  const adapted = useMemo(() => adaptSopForPrint(sop), [sop])
  const [kind, setKind] = useState<DocumentKind>('sop')
  const [orientation, setOrientation] = useState<DocumentOrientation>(initialOrientation)
  const [url, setUrl] = useState('')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const closeButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const empty = kind !== 'sop' && !adapted.model.participantQuestions.length

  async function generate() {
    if (empty) return
    setBusy(true); setError(''); setPage(1)
    try {
      const result = await pdf(<PrintableDocument kind={kind} model={adapted.model} orientation={orientation}/>).toBlob()
      const nextUrl = URL.createObjectURL(result)
      setUrl(previous => { if (previous) URL.revokeObjectURL(previous); return nextUrl })
      setBlob(result)
      setPages(await countPdfPages(result))
    } catch (caught) {
      setBlob(null); setUrl(''); setError(`No se pudo generar el documento: ${(caught as Error).message}`)
    } finally { setBusy(false) }
  }

  useEffect(() => { void generate() }, [kind, orientation, sop]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  useEffect(() => {
    closeButton.current?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return onClose()
      if (event.key !== 'Tab' || !dialog.current) return
      const controls = Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), iframe, [tabindex]:not([tabindex="-1"])'))
      if (!controls.length) return
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [onClose])

  function download() {
    if (!blob) return
    const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = safeDocumentName(kind, adapted.model.code); anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(anchor.href), 60_000)
  }

  function print() {
    if (!frame.current?.contentWindow) return setError('El visor aún no está disponible para imprimir.')
    frame.current.contentWindow.focus(); frame.current.contentWindow.print()
  }

  return <div ref={dialog} className="modal document-modal" role="dialog" aria-modal="true" aria-labelledby="document-title">
    <div className="modal-box document-center">
      <header className="document-toolbar"><div><p className="eyebrow">DOCUMENTOS DEL SOP</p><h2 id="document-title">{adapted.model.code} — {adapted.model.title}</h2></div><button ref={closeButton} className="plain close" aria-label="Cerrar centro de documentos" onClick={onClose}>×</button></header>
      <div className="document-controls">
        <label>Documento<select value={kind} onChange={event => setKind(event.target.value as DocumentKind)}>{(Object.keys(labels) as DocumentKind[]).map(key => <option key={key} value={key}>{labels[key]}</option>)}</select></label>
        {kind === 'sop' && <label>Orientación<select value={orientation} onChange={event => setOrientation(event.target.value as DocumentOrientation)}><option value="landscape">Horizontal — Carta 11 × 8,5</option><option value="portrait">Vertical — Carta 8,5 × 11</option></select></label>}
        <div className="document-actions"><button className="secondary" disabled={!blob || busy || empty} onClick={print}>Imprimir</button><button disabled={!blob || busy || empty} onClick={download}>Descargar PDF</button></div>
      </div>
      {!!adapted.diagnostics.length && <div className="document-diagnostics">{adapted.diagnostics.map((diagnostic, index) => <p className={diagnostic.level} key={index}>{diagnostic.message}</p>)}</div>}
      {empty ? <div className="document-empty">Este SOP no contiene preguntas. Agrega al menos una pregunta para generar la evaluación o la pauta.</div> : error ? <div className="document-error" role="alert"><p>{error}</p><button onClick={generate}>Reintentar</button></div> : busy ? <div className="document-loading" role="status">Generando documento con texto seleccionable…</div> : url && <>
        <div className="document-pager"><button className="secondary compact" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>← Anterior</button><strong>Página {page} de {pages}</strong><button className="secondary compact" disabled={page >= pages} onClick={() => setPage(value => value + 1)}>Siguiente →</button></div>
        <iframe ref={frame} title={`Vista previa: ${labels[kind]}`} className="document-frame" src={`${url}#page=${page}&toolbar=0&navpanes=0&view=FitH`}/>
      </>}
    </div>
  </div>
}

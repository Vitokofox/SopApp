import type { SOP } from './types'

export interface GanttWeek { key: string; start: Date; end: Date; label: string; month: string }
export interface MachineNode { name: string; sops: SOP[] }
export interface AreaNode { name: string; machines: MachineNode[]; sops: SOP[] }
export interface GanttRange { start: string; end: string }

export const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`)
export const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

export function mondayOf(date: Date): Date {
  const result = new Date(date); const day = result.getDay() || 7
  result.setDate(result.getDate() - day + 1); result.setHours(0, 0, 0, 0); return result
}

export function buildWeeks(sops: SOP[]): GanttWeek[] {
  if (!sops.length) return []
  const start = mondayOf(new Date(Math.min(...sops.map(sop => parseLocalDate(sop.follow_up_start_date).getTime()))))
  const last = mondayOf(new Date(Math.max(...sops.map(sop => parseLocalDate(sop.follow_up_end_date).getTime()))))
  const weeks: GanttWeek[] = []
  for (const cursor = new Date(start); cursor <= last; cursor.setDate(cursor.getDate() + 7)) {
    const weekStart = new Date(cursor), weekEnd = new Date(cursor); weekEnd.setDate(weekEnd.getDate() + 6)
    weeks.push({ key: isoDate(weekStart), start: weekStart, end: weekEnd, label: `${weekStart.getDate()}–${weekEnd.getDate()}`, month: weekStart.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '') })
  }
  return weeks
}

export const overlapsWeek = (sop: SOP, week: GanttWeek) => parseLocalDate(sop.follow_up_start_date) <= week.end && parseLocalDate(sop.follow_up_end_date) >= week.start
export const activeCount = (sops: SOP[], week: GanttWeek) => sops.filter(sop => overlapsWeek(sop, week)).length

export function dateRange(sops: SOP[]): GanttRange {
  return {
    start: sops.reduce((value, sop) => !value || sop.follow_up_start_date < value ? sop.follow_up_start_date : value, ''),
    end: sops.reduce((value, sop) => !value || sop.follow_up_end_date > value ? sop.follow_up_end_date : value, ''),
  }
}

export function isWithinSchedule(sop: SOP, today = new Date()): boolean {
  const current = parseLocalDate(isoDate(today))
  return current >= parseLocalDate(sop.follow_up_start_date) && current <= parseLocalDate(sop.follow_up_end_date)
}

export function sopProgress(sop: SOP, today = new Date()): number {
  if (!isWithinSchedule(sop, today)) return 0
  if (sop.status.toLocaleLowerCase() === 'finalizado') return 100
  let evaluation: Array<{question_text?:string;correct?:string;a?:string;b?:string;c?:string;d?:string}> = []
  try { evaluation = JSON.parse(sop.evaluation || '[]') } catch { evaluation = [] }
  const checks = [
    sop.steps.length > 0,
    sop.steps.length > 0 && sop.steps.every(step => !!step.image_path),
    sop.steps.length > 0 && sop.steps.every(step => step.risk_codes.length > 0 && step.control_codes.length > 0),
    evaluation.length > 0 && evaluation.every(q => q.question_text && q.correct && q.a && q.b && q.c && q.d),
  ]
  return checks.filter(Boolean).length * 25
}

export function groupProgress(sops: SOP[], today = new Date()): number {
  return sops.length ? Math.round(sops.reduce((sum, sop) => sum + sopProgress(sop, today), 0) / sops.length) : 0
}

export function rangePosition(range: GanttRange, bounds: GanttRange): { left:number; width:number } {
  const start = parseLocalDate(bounds.start).getTime(), end = parseLocalDate(bounds.end).getTime()
  const total = Math.max(end - start, 86400000)
  const rawLeft = Math.max(0, (parseLocalDate(range.start).getTime() - start) / total * 100)
  const right = Math.min(100, (parseLocalDate(range.end).getTime() - start) / total * 100)
  const width = Math.min(100, Math.max(1.2, right - rawLeft))
  return { left: Math.min(rawLeft, 100 - width), width }
}

export function datePosition(value: string, bounds: GanttRange): number {
  const start = parseLocalDate(bounds.start).getTime(), end = parseLocalDate(bounds.end).getTime()
  return (parseLocalDate(value).getTime() - start) / Math.max(end - start, 86400000) * 100
}

export function scheduleTone(range: GanttRange, progress: number, today = new Date()): 'planned'|'in-progress'|'overdue'|'finished'|'not-started' {
  const current = parseLocalDate(isoDate(today))
  if (current < parseLocalDate(range.start) || current > parseLocalDate(range.end)) return 'not-started'
  if (progress >= 100) return 'finished'
  return 'in-progress'
}

export function buildGanttTree(sops: SOP[]): AreaNode[] {
  const areas = new Map<string, Map<string, SOP[]>>()
  for (const sop of sops) {
    const area = sop.area.trim() || 'Sin área', machine = sop.machine?.trim() || 'Sin máquina'
    if (!areas.has(area)) areas.set(area, new Map())
    const machines = areas.get(area)!; machines.set(machine, [...(machines.get(machine) || []), sop])
  }
  return [...areas.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, machines]) => {
    const machineNodes = [...machines.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([machine, rows]) => ({ name: machine, sops: rows.sort((a,b) => a.follow_up_start_date.localeCompare(b.follow_up_start_date)) }))
    return { name, machines: machineNodes, sops: machineNodes.flatMap(node => node.sops) }
  })
}

export function sopTone(sop: SOP, today = new Date()): 'planned'|'in-progress'|'overdue'|'finished'|'not-started' {
  return scheduleTone({start:sop.follow_up_start_date,end:sop.follow_up_end_date},sopProgress(sop, today),today)
}

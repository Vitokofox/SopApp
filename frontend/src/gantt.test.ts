import { describe, expect, it } from 'vitest'
import { activeCount, buildGanttTree, buildWeeks, dateRange, groupProgress, overlapsWeek, rangePosition, scheduleTone, sopProgress } from './gantt'
import { printableFixture } from './documents/test-fixtures'

const sop=(id:number,area:string,machine:string,start:string,end:string)=>({...printableFixture,id,code:`S${id}`,area,machine,follow_up_start_date:start,follow_up_end_date:end})

describe('Gantt jerárquica semanal',()=>{
  const rows=[sop(1,'Procesos Secos','Línea 5','2026-08-03','2026-08-14'),sop(2,'Procesos Secos','Línea 6','2026-08-10','2026-08-28'),sop(3,'Aserradero','','2026-08-17','2026-08-21')]
  it('construye área, máquina y nodo sin máquina',()=>{const tree=buildGanttTree(rows);expect(tree).toHaveLength(2);expect(tree.find(x=>x.name==='Procesos Secos')?.machines).toHaveLength(2);expect(tree.find(x=>x.name==='Aserradero')?.machines[0].name).toBe('Sin máquina')})
  it('genera semanas lunes a domingo',()=>{const weeks=buildWeeks(rows);expect(weeks[0].key).toBe('2026-08-03');expect(weeks.at(-1)?.key).toBe('2026-08-24')})
  it('agrega la unión y conteo de SOP por semana',()=>{const weeks=buildWeeks(rows);expect(overlapsWeek(rows[0],weeks[1])).toBe(true);expect(activeCount(rows,weeks[1])).toBe(2);expect(activeCount(rows,weeks[3])).toBe(1)})
  it('usa el inicio menor y final mayor como límites generales',()=>{expect(dateRange(rows)).toEqual({start:'2026-08-03',end:'2026-08-28'});expect(rangePosition({start:'2026-08-10',end:'2026-08-20'},dateRange(rows))).toEqual({left:28.000000000000004,width:40})})
  it('solo calcula avance de SOPs dentro de su ventana de fechas',()=>{const today=new Date('2026-08-15T12:00:00'),empty={...rows[0],steps:[],evaluation:'[]'},active={...rows[1],follow_up_start_date:'2026-08-10',follow_up_end_date:'2026-08-20'},finished={...active,status:'finalizado'};expect(sopProgress(empty,today)).toBe(0);expect(sopProgress(rows[0],today)).toBe(0);expect(sopProgress(active,today)).toBe(75);expect(sopProgress({...active,follow_up_start_date:'2026-08-20'},today)).toBe(0);expect(sopProgress(finished,today)).toBe(100);expect(groupProgress([empty,finished],today)).toBe(50)})
  it('clasifica fuera de fecha como no iniciado',()=>{const today=new Date('2026-08-15T12:00:00');expect(scheduleTone({start:'2026-08-20',end:'2026-08-30'},0,today)).toBe('not-started');expect(scheduleTone({start:'2026-08-10',end:'2026-08-20'},50,today)).toBe('in-progress');expect(scheduleTone({start:'2026-08-01',end:'2026-08-10'},75,today)).toBe('not-started');expect(scheduleTone({start:'2026-08-01',end:'2026-08-10'},100,today)).toBe('not-started');expect(scheduleTone({start:'2026-08-15',end:'2026-08-15'},100,today)).toBe('finished')})
})

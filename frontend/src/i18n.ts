import type { Language } from './types'

const words = {
  es: {home:'Inicio', list:'Lista de SOP', gantt:'Carta Gantt', report:'Informe', create:'Crear SOP', settings:'Configuración', logout:'Cerrar sesión', login:'Iniciar sesión', user:'Usuario', password:'Contraseña', save:'Guardar', cancel:'Cancelar', empty:'Sin registros', title:'SOP Operaciones', subtitle:'Estandarización de procesos en planta'},
  pt: {home:'Início', list:'Lista de SOP', gantt:'Gráfico de Gantt', report:'Relatório', create:'Criar SOP', settings:'Configuração', logout:'Sair', login:'Entrar', user:'Usuário', password:'Senha', save:'Salvar', cancel:'Cancelar', empty:'Sem registros', title:'SOP Operações', subtitle:'Padronização de processos na planta'},
  en: {home:'Home', list:'SOP List', gantt:'Gantt Chart', report:'Report', create:'Create SOP', settings:'Settings', logout:'Sign out', login:'Sign in', user:'User', password:'Password', save:'Save', cancel:'Cancel', empty:'No records', title:'SOP Operations', subtitle:'Plant process standardization'},
} as const
export type Word = keyof typeof words.es
export const t = (lang:Language,key:Word) => words[lang][key]

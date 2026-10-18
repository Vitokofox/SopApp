export type Language = 'es' | 'pt' | 'en'
export type Permission = 'sop:create' | 'sop:edit' | 'sop:delete' | 'sop:import' | 'user:manage'

export interface User {
  id: number; username: string; full_name: string; language: Language;
  permissions: Permission[]; is_active: boolean
}
export interface Step {
  id?: number; step_number: number; description: string; procedure_text: string;
  image_path: string; risk_codes: string[]; control_codes: string[]; imageFile?: File
}
export interface Question { question_text: string; correct: string; a: string; b: string; c: string; d: string }
export interface SOP {
  id?: number; code: string; revision: string; title: string; area: string; machine: string; elaborator: string;
  chief_area: string; chief_masso: string; publication_date: string; last_update: string; follow_up_date: string;
  follow_up_start_date: string; follow_up_end_date: string;
  tools_text: string; flexibility_matrix: string; key_rule: string; risks_text: string;
  controls_text: string; epp_text: string; evaluation: string; status: string; steps_per_page: number; steps: Step[]
}
export interface AreaChief { id: number; area: string; name: string }
export interface SsoChief { id: number; name: string }
export interface Machine { id: number; area: string; name: string }

export const emptySop = (): SOP => ({
  code: '', revision: 'Rev. 0', title: '', area: '', machine: '', elaborator: '', chief_area: '', chief_masso: '',
  publication_date: '', last_update: '', follow_up_date: '', follow_up_start_date: '', follow_up_end_date: '', tools_text: '', flexibility_matrix: '', key_rule: '',
  risks_text: '', controls_text: '', epp_text: '', evaluation: '[]', status: 'en proceso', steps_per_page: 3, steps: [],
})

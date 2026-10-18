import type { AreaChief, Machine, SOP, SsoChief, User } from './types'

const tokenKey = 'sop_token'
export const session = {
  get: () => localStorage.getItem(tokenKey) || '',
  set: (value: string) => localStorage.setItem(tokenKey, value),
  clear: () => localStorage.removeItem(tokenKey),
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (session.get()) headers.set('Authorization', `Bearer ${session.get()}`)
  const response = await fetch(`/api${path}`, { ...init, headers })
  if (!response.ok) {
    let message = `HTTP ${response.status}`
    try { message = (await response.json()).detail || message } catch { /* ignored */ }
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }
  if (response.status === 204) return undefined as T
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(`El servidor respondió ${contentType || 'un formato desconocido'} en ${path}; reinicia el backend para cargar la versión actualizada.`)
  }
  return response.json()
}

export const api = {
  login: (username: string, password: string) => request<{access_token: string}>('/auth/login', {method:'POST', body:JSON.stringify({username,password})}),
  me: () => request<User>('/auth/me'),
  sops: () => request<SOP[]>('/sops'),
  createSop: (sop: SOP) => request<SOP>('/sops', {method:'POST',body:JSON.stringify(sop)}),
  updateSop: (sop: SOP) => request<SOP>(`/sops/${sop.id}`, {method:'PUT',body:JSON.stringify(sop)}),
  deleteSop: (id: number) => request<void>(`/sops/${id}`, {method:'DELETE'}),
  uploadImage: (sopId:number, stepId:number, file:File) => { const body=new FormData(); body.append('image',file); return request<{image_path:string}>(`/sops/${sopId}/steps/${stepId}/image`,{method:'POST',body}) },
  users: () => request<User[]>('/users'),
  saveUser: (user: Partial<User>&{password?:string}) => user.id ? request<User>(`/users/${user.id}`,{method:'PUT',body:JSON.stringify(user)}) : request<User>('/users',{method:'POST',body:JSON.stringify(user)}),
  deleteUser: (id:number) => request<void>(`/users/${id}`,{method:'DELETE'}),
  areaChiefs: () => request<AreaChief[]>('/chiefs/area'),
  ssoChiefs: () => request<SsoChief[]>('/chiefs/sso'),
  machines: () => request<Machine[]>('/machines'),
  addMachine: (area:string,name:string) => request<Machine>('/machines',{method:'POST',body:JSON.stringify({area,name})}),
  deleteMachine: (id:number) => request<void>(`/machines/${id}`,{method:'DELETE'}),
  addArea: (area:string,name:string) => request<AreaChief>('/chiefs/area',{method:'POST',body:JSON.stringify({area,name})}),
  addSso: (name:string) => request<SsoChief>('/chiefs/sso',{method:'POST',body:JSON.stringify({name})}),
  deleteArea: (id:number) => request<void>(`/chiefs/area/${id}`,{method:'DELETE'}),
  deleteSso: (id:number) => request<void>(`/chiefs/sso/${id}`,{method:'DELETE'}),
  importFile: (file:File) => { const body=new FormData(); body.append('file',file); return request<SOP>(`/import/${file.name.toLowerCase().endsWith('.pdf')?'pdf':'excel'}`,{method:'POST',body}) },
  importBulk: (files:File[]) => { const body=new FormData(); files.forEach(f=>body.append('files',f)); return request<Array<{filename:string;ok:boolean;error?:string}>>('/import/bulk',{method:'POST',body}) },
}


import { create } from 'zustand'
import { exportActivityHash } from '../../../exporters/activityHash'



type FormMeta = {
  id?: number,
  idnumber?: string,
  creator?: string,
  status?: number, // 0: Unsaved, 1: Saved draft, 2: Live
  timecreated?: number,
  timemodified?: number,
}

type FormMetaStore = FormMeta & {
  setState: (newState: FormMeta | null) => void,
  reset: () => void
}

const formMetaInit = {
  id: 0,
  idnumber: '',
  creator: '',
  status: 0, // 0: Unsaved, 1: Saved draft, 2: Live
  timecreated: 0,
  timemodified: 0,
}
const useFormMetaStore = create<FormMetaStore>((set) => ({
  ...formMetaInit,
  setState: (newState) => set(newState || formMetaInit),
  reset: () => set(formMetaInit)
}))



type FormState = {
  oldhash: string,
  hash: string,
  formloaded: boolean,
  studentsloaded: boolean,
  haschanges: boolean,
  reloadstulist: boolean,
}

type FormStateStore = FormState & {
  setState: (newState: FormState | null) => void,
  reset: () => void,
  reloadStudents: () => void,
  baselineHash: () =>  void,
  clearHash: () =>  void,
  updateHash: () => void,
  resetHash: () => void,
  setFormLoaded: () => void,
  setStudentsLoaded: () => void,
}

const formStateInit = {
  oldhash: '',
  hash: '',
  formloaded: false,
  studentsloaded: false,
  haschanges: false,
  reloadstulist: false,
}
const useFormStateStore = create<FormStateStore>((set) => ({
  ...formStateInit,
  setState: (newState) => set(newState ? newState : formStateInit),
  reset: () => set(formStateInit),
  reloadStudents: () => set({reloadstulist: true}),
  baselineHash: () => {
    const hash = exportActivityHash()
    set({
      oldhash: hash, 
      hash: hash
    })
  },
  clearHash: () => {
    set({
      oldhash: '', 
      hash: '',
      haschanges: false,
    })
  },
  updateHash: () => {
    const hash = exportActivityHash()
    set((state: FormState) => ({ 
      hash: hash, 
      haschanges: (hash !== state.oldhash) 
    }))
  },
  resetHash: () => set((state: FormState) => ({
    hash: state.oldhash,
    haschanges: false,
  })),
  setFormLoaded: () => set({formloaded: true}),
  setStudentsLoaded: () => set({studentsloaded: true}),
}))



export { useFormMetaStore, useFormStateStore };
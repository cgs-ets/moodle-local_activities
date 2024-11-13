
import { create } from 'zustand'
import { exportActivityHash } from '../utils/activityHash'

type State = {
  oldhash: string,
  hash: string,
  formloaded: boolean,
  studentsloaded: boolean,
  filesloaded: boolean,
  haschanges: boolean,
  reloadstulist: boolean,
  savedtime: number,
}

type StateStore = State & {
  setState: (newState: State | null) => void,
  reset: () => void,
  reloadStudents: () => void,
  baselineHash: () =>  void,
  clearHash: () =>  void,
  updateHash: () => void,
  resetHash: () => void,
  setFormLoaded: () => void,
  setStudentsLoaded: () => void,
  setFilesLoaded: () => void,
  updateSavedTime: () => void,
}

const formStateInit = {
  oldhash: '',
  hash: '',
  formloaded: false,
  studentsloaded: false,
  filesloaded: false,
  haschanges: false,
  reloadstulist: false,
  savedtime: 0,
}
const useStateStore = create<StateStore>((set, get) => ({
  ...formStateInit,
  setState: (newState) => set(newState ? newState : formStateInit),
  reset: () => set(formStateInit),
  reloadStudents: () => set({reloadstulist: true}),
  baselineHash: () => {
    console.log("Baselining hash")
    const hash = exportActivityHash()
    set({
      oldhash: hash, 
      hash: hash
    })
  },
  clearHash: () => {
    console.log("Clearing hash")
    set({
      oldhash: '', 
      hash: '',
      haschanges: false,
    })
  },
  updateHash: () => {
    console.log("Updating hash")
    const hash = exportActivityHash()
    console.log('hash', hash)
    console.log('oldhash', get().oldhash)
    set((state: State) => ({ 
      hash: hash, 
      haschanges: (hash !== state.oldhash) 
    }))
  },
  resetHash: () => {
    const hash = exportActivityHash()
    set((state: State) => ({
      hash: state.oldhash,
      haschanges: (hash !== state.oldhash) ,
    }))
  },
  setFormLoaded: () => set({formloaded: true}),
  setStudentsLoaded: () => set({studentsloaded: true}),
  setFilesLoaded: () => set({filesloaded: true}),
  updateSavedTime: () => set({savedtime: Date.now()}),
}))



export { useStateStore };
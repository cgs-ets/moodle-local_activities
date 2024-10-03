
import { create } from 'zustand'
import { exportActivityHash } from '../utils/activityHash'

type State = {
  oldhash: string,
  hash: string,
  formloaded: boolean,
  studentsloaded: boolean,
  haschanges: boolean,
  reloadstulist: boolean,
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
}

const formStateInit = {
  oldhash: '',
  hash: '',
  formloaded: false,
  studentsloaded: false,
  haschanges: false,
  reloadstulist: false,
}
const useStateStore = create<StateStore>((set, get) => ({
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
    //console.log('hash', hash)
    //console.log('oldhash', get().oldhash)
    set((state: State) => ({ 
      hash: hash, 
      haschanges: (hash !== state.oldhash) 
    }))
  },
  resetHash: () => set((state: State) => ({
    hash: state.oldhash,
    haschanges: false,
  })),
  setFormLoaded: () => set({formloaded: true}),
  setStudentsLoaded: () => set({studentsloaded: true}),
}))



export { useStateStore };
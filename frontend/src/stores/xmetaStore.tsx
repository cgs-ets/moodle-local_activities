
import dayjs from 'dayjs'
import { create } from 'zustand'

type FormMeta = {
  id?: number,
  idnumber?: string,
  creator?: string,
  status?: number, // 0: Unsaved, 1: Saved draft, 2: Live
  timecreated?: string,
  timemodified?: string,
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
  timecreated: dayjs().unix().toString(),
  timemodified: dayjs().unix().toString(),
}
const useFormMetaStore = create<FormMetaStore>((set) => ({
  ...formMetaInit,
  setState: (newState) => set(newState || formMetaInit),
  reset: () => set(formMetaInit)
}))

export { useFormMetaStore };
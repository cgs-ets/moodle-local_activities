
import { create } from 'zustand'

export type BasicDetails = {
  idnumber: string,
  activityname: string,
  activitytype: string,
  category: string,
  categoryName: string,
  details: string,
  initDescription: string,
}

type BasicDetailsStore = BasicDetails & {
  setState: (newState: BasicDetails | null) => void,
  reset: () => void,
}

const basicDetailsInit = {
  idnumber: '',
  activityname: '',
  activitytype: '',
  category: '',
  categoryName: '',
  details: '',
  initDescription: '',
}
const useBasicDetailsStore = create<BasicDetailsStore>((set) => ({
  ...basicDetailsInit,
  setState: (newState) => set(newState || basicDetailsInit),
  reset: () => set(basicDetailsInit),
}))






type StaffDetails= {
  coaches: string[],
  assistants: string[],
}

type StaffDetailsStore = StaffDetails & {
  setState: (newState: StaffDetails | null) => void,
  reset: () => void,
}

const staffDetailsInit = {
  coaches: [],
  assistants: [],
}

const useStaffDetailsStore = create<StaffDetailsStore>((set) => ({
  ...staffDetailsInit,
  setState: (newState) => set(newState || staffDetailsInit),
  reset: () => set(staffDetailsInit),
}))





type StudentList= {
  data: string[],
  usernames: string[],
  move: string[],
}

type StudentListStore = StudentList & {
  setState: (newState: StudentList | null) => void,
  reset: () => void,
}


const studentListInit = {
  data: [],
  usernames: [],
  move: [],
}
const useStudentListStore = create<StudentListStore>((set) => ({
  ...studentListInit,
  setState: (newState) => set(newState || studentListInit),
  reset: () => set(studentListInit),
}))


export type Errors = {
  [key: string]: string[]
}

type FormValidationStore = {
  formErrors: Errors,
  rules: any,
  setFormErrors: (errors: Errors) => void,
  reset: () => void,
}


const useFormValidationStore = create<FormValidationStore>((set) => ({
  formErrors: {},
  rules: {
    activityname: [
      (value: string) => (value.length ? null : 'Activity name is required. '),
    ],
  },
  setFormErrors: (errors) => set({ formErrors: errors }),
  reset: () => set({formErrors: {}}),
}))

export { 
  useBasicDetailsStore, 
  useStaffDetailsStore, 
  useStudentListStore, 
  useFormValidationStore
};

import dayjs from 'dayjs'
import { create } from 'zustand'

export type Form = {
  id?: number,
  idnumber?: string,
  creator?: string,
  status?: number, // 0: Unsaved, 1: Saved draft, 2: Live
  timecreated?: number,
  timemodified?: number,

  activityname: string;
  campus: string;
  activitytype: string;
  location: string;
  timestart: number;
  timeend: number;
  studentlistjson: string;
  description: string;
  transport: string;
  cost: string;
  permissions: string;
  permissionstype: string;
  permissionslimit: string;
  permissionsdueby: number;
  //deleted: string;
  riskassessment: string;
  attachments: string;
  staffincharge: string;
  staffinchargejson: string;
  planningstaffjson: string;
  accompanyingstaffjson: string;
  otherparticipants: string;
  //absencesprocessed: string;
  //remindersprocessed: string;
  categories: string[];
  categoriesjson: string;
  colourcategory: string;
  areasjson: string;
  displaypublic: boolean;
  //pushpublic: string;
  isactivity: string;
  //timesynclive: number;
  //timesyncplanning: number;
  isassessment: string;
  courseid: string;
  assessmenturl: string;
};

type FormStore = Form & {
  setState: (newState: Form | null) => void,
  reset: () => void,
}

const defaults: Form = {
  id: 0,
  idnumber: '',
  creator: '',
  status: 0, // 0: Unsaved, 1: Saved draft, 2: Live
  timecreated: dayjs().unix(),
  timemodified: dayjs().unix(),
    activityname: '',
    campus: 'primary',
    activitytype: 'excursion',
    location: '',
    timestart: dayjs().unix(),
    timeend: dayjs().unix(),
    studentlistjson: '',
    description: '',
    transport: '',
    cost: '',
    permissions: '',
    permissionstype: '',
    permissionslimit: '',
    permissionsdueby: dayjs().unix(),
    //deleted: '',
    riskassessment: '',
    attachments: '',
    staffincharge: '',
    staffinchargejson: '',
    planningstaffjson: '',
    accompanyingstaffjson: '',
    otherparticipants: '',
    //absencesprocessed: '',
    //remindersprocessed: '',
    categories: [],
    categoriesjson: '',
    colourcategory: '',
    areasjson: '',
    displaypublic: false,
    //pushpublic: '',
    isactivity: '',
    //timesynclive: dayjs().unix(),
    //timesyncplanning: dayjs().unix(),
    isassessment: '',
    courseid: '',
    assessmenturl: ''
};

const useFormStore = create<FormStore>((set) => ({
  ...defaults,
  setState: (newState) => set(newState || defaults),
  reset: () => set(defaults),
}))





type StaffDetails= {
  planning: string[],
  accompanying: string[],
}

type StaffDetailsStore = StaffDetails & {
  setState: (newState: StaffDetails | null) => void,
  reset: () => void,
}

const staffDetailsInit = {
  planning: [],
  accompanying: [],
}

const useStaffDetailsStore = create<StaffDetailsStore>((set) => ({
  ...staffDetailsInit,
  setState: (newState) => set(newState || staffDetailsInit),
  reset: () => set(staffDetailsInit),
}))





type StudentList= {
  data: string[],
  usernames: string[],
}

type StudentListStore = StudentList & {
  setState: (newState: StudentList | null) => void,
  reset: () => void,
}

const studentListInit = {
  data: [],
  usernames: [],
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
  defaults,
  useFormStore, 
  useStaffDetailsStore,
  useStudentListStore,
  useFormValidationStore
};
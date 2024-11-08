
import dayjs from 'dayjs'
import { create } from 'zustand'
import { getConfig } from '../utils';

export type Form = {
  id?: number,
  idnumber?: string,
  creator?: string,
  status?: number, // 0: Unsaved, 1: Saved draft, 2: Live
  timecreated?: number,
  timemodified?: number,

  activityname: string;
  initialCampus: string;
  campus: string;
  initialActivitytype: string;
  activitytype: string;
  location: string;
  timestart: number;
  timeend: number;
  description: string;
  transport: string;
  cost: string;
  permissions: string;
  permissionstype: string;
  permissionslimit: string;
  permissionsdueby: number;
  riskassessment: string;
  attachments: string;

  studentlist: any[];
  studentlistjson: string;
  staffincharge: any[];
  staffinchargejson: string;
  planningstaff: any[];
  planningstaffjson: string;
  accompanyingstaff: any[];
  accompanyingstaffjson: string;

  otherparticipants: string;
  categories: string[];
  categoriesjson: string;
  colourcategory: string;
  areasjson: string;
  displaypublic: boolean;
  pushpublic: boolean,
  isactivity: string;
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
  initialCampus: '',
  campus: 'primary',
  initialActivitytype: '',
  activitytype: 'excursion',
  location: '',
  timestart: dayjs().unix(),
  timeend: dayjs().unix(),
  description: '',
  transport: '',
  cost: '',
  permissions: '',
  permissionstype: '',
  permissionslimit: '',
  permissionsdueby: dayjs().unix(),
  riskassessment: '',
  attachments: '',

  studentlist: [],
  studentlistjson: '',
  staffincharge: [getConfig().user],
  staffinchargejson: '',
  planningstaff: [],
  planningstaffjson: '',
  accompanyingstaff: [],
  accompanyingstaffjson: '',
  
  otherparticipants: '',
  categories: [],
  categoriesjson: '',
  colourcategory: '',
  areasjson: '',
  displaypublic: false,
  pushpublic: false,
  isactivity: '',
  isassessment: '',
  courseid: '',
  assessmenturl: ''
};

const useFormStore = create<FormStore>((set) => ({
  ...defaults,
  setState: (newState) => set(newState || defaults),
  reset: () => set(defaults),
}))



/*

export type StaffDetails= {
  planning: string[],
  accompanying: string[],
}

type StaffDetailsStore = StaffDetails & {
  setState: (newState: StaffDetails | null) => void,
  reset: () => void,
}

const staffDefaults = {
  planning: [],
  accompanying: [],
}

const useStaffDetailsStore = create<StaffDetailsStore>((set) => ({
  ...staffDefaults,
  setState: (newState) => set(newState || staffDefaults),
  reset: () => set(staffDefaults),
}))

*/


/*
export type StudentList= {
  data: any[],
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
*/






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
      (value: string, formData: Form) => (value.length ? null : 'Activity name is required. '),
    ],
    timestart: [
      (value: string, formData: Form) => (Number(value) == formData.timeend || Number(value) > formData.timeend ? 'End time must be greater than start time. ' : null),
    ],
  },
  setFormErrors: (errors) => set({ formErrors: errors }),
  reset: () => set({formErrors: {}}),
}))

export { 
  defaults,
  useFormStore, 
  //useStaffDetailsStore,
  //useStudentListStore,
  useFormValidationStore
};
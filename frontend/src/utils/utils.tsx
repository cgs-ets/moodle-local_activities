
import { getConfig, statuses } from ".";
import { useFormStore } from "../stores/formStore";
import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge"

export const isActivity = (activitytype: string) => {
  return (
    activitytype == 'excursion' || 
    activitytype == 'incursion'
  )
};

export const isCalEntry = (activitytype: string) => {
  return (activitytype == 'calendar')
};

export const excursionStatus = () => {
  const status = useFormStore((state) => state.status) 
  return status == statuses.draft ? "Draft" :
        status == statuses.saved ? "Draft" :
        status == statuses.inreview ? "In Review" :
        status == statuses.approved ? "Approved" : "";
}

export const entryStatus = () => {
  const status = useFormStore((state) => state.status) 
  return status == statuses.draft ? "Draft" :
         status >= statuses.saved ? "Saved" : "";
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isCalReviewer = () => {
  return !!getConfig().calroles?.includes("cal_reviewer")
}

export const getTermFromMonth = (month: string, year: string) => {
  const moyear = `${String(month).padStart(2, '0')}-${year}`
  return moyear > '09-28' ? 4 
    : moyear > '06-29' ? 3
    : moyear > '04-13' ? 2
    : 1
}

export const getMonthFromTerm = (term: string) => {
  return Number(term) == 4 ? 9 
    : Number(term) == 3 ? 6
    : Number(term) == 2 ? 4
    : 1
}

export const isDigitalRisksEnabled = () => {
  return true
  /*return (
    //true ||
       getConfig().user.un == '43563'
    || getConfig().user.un == 'admin'
    || getConfig().user.un == '57056'
    || getConfig().user.un == '61460'
    || getConfig().user.un == '67769' // Anna
    || getConfig().user.un == '41544' // Tanya
    || getConfig().user.un == '41895' // Kate
    || getConfig().user.un == '73125' // Jess
    || getConfig().user.un == '71753' // Dahee
    || getConfig().user.un == '73749' // Safa
    || getConfig().user.un == '71140' // Faith
    || getConfig().user.un == '76741' // Hannah
    || getConfig().user.un == '61460' // Kristen 
    || getConfig().user.un == '70774' // Mary
    || getConfig().user.un == '36291' // Louise
    || getConfig().user.un == '68130' // Lauren
    || getConfig().user.un == '21016' // Angela
    || getConfig().user.un == '61946' // Rob
    
    || getConfig().user.un == '76352'
    || getConfig().user.un == '76558'
    || getConfig().user.un == '73228'
    || getConfig().user.un == '76446'
    || getConfig().user.un == '57301'
    || getConfig().user.un == '71058'
    || getConfig().user.un == '74815'
    || getConfig().user.un == '72748'
    || getConfig().user.un == '76210'
    || getConfig().user.un == '70774'
    || getConfig().user.un == '76778'
    || getConfig().user.un == '74196'
    || getConfig().user.un == '76140'
    || getConfig().user.un == '16494'
    || getConfig().user.un == '68767'
    || getConfig().user.un == '74577'
    || getConfig().user.un == '73970'
    || getConfig().user.un == '67018'
    || getConfig().user.un == '77487'
    || getConfig().user.un == '39835'
    || getConfig().user.un == '68130'
    || getConfig().user.un == '74612'
    || getConfig().user.un == '76557'
    || getConfig().user.un == '72845'
    || getConfig().user.un == '71661'
    || getConfig().user.un == '74980'
    || getConfig().user.un == '16396'
    || getConfig().user.un == '75813'
    || getConfig().user.un == '74630'
    || getConfig().user.un == '41585'
    || getConfig().user.un == '77188'
    || getConfig().user.un == '58102'
    || getConfig().user.un == '52387'
    || getConfig().user.un == '73114'
    || getConfig().user.un == '43144'
    || getConfig().user.un == '74907'
    || getConfig().user.un == '73716'
  )*/
}
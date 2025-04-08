
import { getConfig, statuses } from ".";
import { useFormStore } from "../stores/formStore";
import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge"

export const isActivity = (activitytype: string) => {
  return (
    activitytype == 'excursion' || 
    activitytype == 'incursion' ||
    activitytype == 'commercial' ||
    activitytype == 'assessment' 
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
  console.log("status", status)
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


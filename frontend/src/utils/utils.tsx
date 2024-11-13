
import { getConfig, statuses } from ".";
import { useFormStore } from "../stores/formStore";
import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const isExcursion = (activitytype: string) => {
  return (activitytype == 'excursion' || activitytype == 'incursion')
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

export const isExporting = (activitytype: string , status: number) => {
  if (activitytype == 'excursion' || activitytype == 'incursion') {
    
  } else {
 
  }
  return false
}

export const isCalReviewer = () => {
  return !!getConfig().calroles.includes("cal_reviewer")
}

import { useFormStore } from "../stores/formStore";

export const showExcursionFields = () => {
  const activitytype = useFormStore((state) => state.activitytype) 
  return (activitytype == 'excursion' || activitytype == 'incursion')
};

import hash from "object-hash";
import { useFormStore } from "../stores/formStore";


export const exportActivityHash = () => {
  const formData = useFormStore.getState()

  // Unset some props.
  const { status, pushpublic, ...rest } = formData; 

  // NOTE - when there are existing files these are loaded into the controls and the string goes from empty to filled.. 
  // Remove existing attachments and ra from the hash as these are added after the hash is initially baselined.
  const attachments = filterExisting(formData.attachments);
  const riskassessment = filterExisting(formData.riskassessment);
  const cleaned = {...rest, attachments, riskassessment} //Put attachments andd riskassessment back into object without the existing items.

  console.log("cleaned", cleaned)

  return hash(JSON.parse(JSON.stringify(cleaned)))
};



const filterExisting = (str: string) => {
  return String(str)
    .split(',')
    .filter(value => !value.includes("EXISTING::"))
    .join(',');
}
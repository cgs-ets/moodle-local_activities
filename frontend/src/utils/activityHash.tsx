
import hash from "object-hash";
import { useFormStore } from "../stores/formStore";

//NOTE - issue with riskassessment and attachments... 
//when there are existing files these are loaded into the controls and the string goes from empty to filled.. 
//how do we get these initialised before the baseline hash?


const exportActivityHash = () => {
  const formData = useFormStore.getState()
  // Unset some props.
  const { status, pushpublic, ...rest } = formData; 

  // Remove existing attachments and ra from the hash as these are added after the hash is initially baselined.
  const attachments = filterExisting(formData.attachments);
  const riskassessment = filterExisting(formData.riskassessment);
  const cleaned = {...rest, attachments, riskassessment}

  return hash(JSON.parse(JSON.stringify(cleaned)))
};
export {exportActivityHash}

const filterExisting = (str: string) => {
  return String(str)
    .split(',')
    .filter(value => !value.includes("EXISTING::"))
    .join(',');
}
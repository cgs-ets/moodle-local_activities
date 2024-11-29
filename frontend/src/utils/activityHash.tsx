
import hash from "object-hash";
import { useFormStore } from "../stores/formStore";


export const exportActivityHash = () => {
  const formData = useFormStore.getState()

  // Unset some props that should not interfere with the hash.
  const { status, pushpublic, studentlistjson, ...rest } = formData; 

  // NOTE - when there are existing files these are loaded into the controls and the string goes from empty to filled.. 
  // Remove existing attachments and ra from the hash as these are added after the hash is initially baselined.
  const attachments = filterExisting(formData.attachments);
  const riskassessment = filterExisting(formData.riskassessment);

  // Remove permissions from studentlist.
  const studentlist = rest.studentlist.map((student) => {
    const {parents, permission, ...rest} = student;
    return rest
  })

  // Put attachments, riskassessment back into object without the existing items. 
  // Put studentlist back in without permissions.
  const cleaned = {...rest, attachments, riskassessment, studentlist}

  return hash(JSON.parse(JSON.stringify(cleaned)))
};



const filterExisting = (str: string) => {
  return String(str)
    .split(',')
    .filter(value => !value.includes("EXISTING::"))
    .join(',');
}

import hash from "object-hash";
import { useFormStore } from "../stores/formStore";

const exportActivityHash = () => {
  const formData = useFormStore.getState()
  console.log(formData)
  return hash(JSON.parse(JSON.stringify(formData)))
};
export {exportActivityHash}
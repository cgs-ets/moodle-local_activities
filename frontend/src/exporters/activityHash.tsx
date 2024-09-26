
import hash from "object-hash";
import { useFormStore } from "../stores/formStore";

const exportActivityHash = () => {
  const formData = useFormStore.getState()
  return hash(JSON.parse(JSON.stringify(formData)))
};
export {exportActivityHash}
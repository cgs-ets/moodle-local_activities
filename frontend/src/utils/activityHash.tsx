
import hash from "object-hash";
import { useFormStore } from "../stores/formStore";

const exportActivityHash = () => {
  const formData = useFormStore.getState()
  // Unset some props.
  const { status, pushpublic, ...rest } = formData;
  return hash(JSON.parse(JSON.stringify(rest)))
};
export {exportActivityHash}
import { useFormStore } from "../stores/formStore";
import { useStateStore } from "../stores/stateStore";
import { useWorkflowStore } from "../stores/workflowStore";


export const resetAllStores = () => {
  const resetForm = useFormStore((state) => (state.reset))
  const resetState = useStateStore((state) => (state.reset))
  const resetWF = useWorkflowStore((state) => (state.reset))
  resetForm()
  resetState()
  resetWF()
};
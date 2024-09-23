
import hash from "object-hash";
import { useBasicDetailsStore, useStaffDetailsStore, useStudentListStore } from "../pages/Activity/store/formFieldsStore";

const exportActivityHash = () => {
  const basic = useBasicDetailsStore.getState()
  const staff = useStaffDetailsStore.getState()
  const students = useStudentListStore.getState()
  const formData = JSON.parse(JSON.stringify({...basic, ...staff, ...students}));
  return hash(formData)
};
export {exportActivityHash}
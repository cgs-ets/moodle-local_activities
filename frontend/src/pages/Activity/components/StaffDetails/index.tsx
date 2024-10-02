import { Text } from "@mantine/core";
import { Form, useFormStore } from "../../../../stores/formStore";
import { StaffSelector } from "./components/StaffSelector";


export function StaffDetails() {

  const accompanyingstaff = useFormStore((state) => state.accompanyingstaff) 
  const planningstaff = useFormStore((state) => state.planningstaff) 
  const staffincharge = useFormStore((state) => state.staffincharge) 

  const setState = useFormStore(state => state.setState)

  const setAccompanying = (value: any[]) => {
    setState({['accompanyingstaff']: value} as Form)
  }
  const setPlanning = (value: any[]) => {
    setState({['planningstaff']: value} as Form)
  }
  const setStaffInCharge = (value: any[]) => {
    setState({['staffincharge']: value} as Form)
  }

  return (
    <div>
      <Text fz="sm" mb="5px" fw={500} c="#212529">Staff</Text>
      <div className="flex flex-col gap-6 p-4 border border-gray-300 rounded-sm bg-gray-50">
        <div className="flex flex-col gap-2">
          <StaffSelector staff={staffincharge} setStaff={setStaffInCharge} label="Leader" multiple={false} />
          <StaffSelector staff={planningstaff} setStaff={setPlanning} label="Planning" multiple={true} />
          <StaffSelector staff={accompanyingstaff} setStaff={setAccompanying} label="Accompanying" multiple={true} />
        </div>
      </div>
    </div>
  );
};
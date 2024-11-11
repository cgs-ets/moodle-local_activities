import { Card, Text } from "@mantine/core";
import { Form, useFormStore } from "../../../../stores/formStore";
import { StaffSelector } from "./components/StaffSelector";
import { isExcursion } from "../../../../utils/utils";


export function StaffDetails() {

  const accompanyingstaff = useFormStore((state) => state.accompanyingstaff) 
  const planningstaff = useFormStore((state) => state.planningstaff) 
  const staffincharge = useFormStore((state) => state.staffincharge) 
  const activitytype = useFormStore((state) => state.activitytype) 

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
    <Card withBorder radius="sm" className="p-0">
      <div className="px-4 py-3">
        <Text fz="md">Staff</Text>
      </div>
      <div className="flex flex-col gap-6 p-4 border-t border-gray-300">
        <div className="flex flex-col gap-2">
          <StaffSelector staff={staffincharge} setStaff={setStaffInCharge} label="Leader" multiple={false} />
          { isExcursion(activitytype) &&
            <>
              <StaffSelector staff={planningstaff} setStaff={setPlanning} label="Planning" multiple={true} />
              <StaffSelector staff={accompanyingstaff} setStaff={setAccompanying} label="Accompanying" multiple={true} />
            </>
          }
        </div>
      </div>
    </Card>
  );
};
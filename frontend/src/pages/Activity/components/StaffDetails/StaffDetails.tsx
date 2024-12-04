import { Card, Text, Textarea } from "@mantine/core";
import { Form, useFormStore } from "../../../../stores/formStore";
import { StaffSelector } from "./components/StaffSelector/StaffSelector";
import { isActivity } from "../../../../utils/utils";
import { useStateStore } from "../../../../stores/stateStore";

export function StaffDetails() {

  const accompanyingstaff = useFormStore((state) => state.accompanyingstaff) 
  const planningstaff = useFormStore((state) => state.planningstaff) 
  const staffincharge = useFormStore((state) => state.staffincharge) 
  const activitytype = useFormStore((state) => state.activitytype) 
  const otherparticipants = useFormStore((state) => state.otherparticipants) 
  const viewStateProps = useStateStore((state) => (state.viewStateProps))

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
        <span className="text-base">Staff</span>
      </div>
      <div className="flex flex-col gap-6 p-4 border-t border-gray-300">
        <div className="flex flex-col gap-4">
          <StaffSelector staff={staffincharge} setStaff={setStaffInCharge} label="Leader" multiple={false} />
          { isActivity(activitytype) &&
            <>
              <StaffSelector staff={planningstaff} setStaff={setPlanning} label="Planning" multiple={true} />
              <StaffSelector staff={accompanyingstaff} setStaff={setAccompanying} label="Accompanying" multiple={true} />
              <div>
                <Text fz="sm" mb="5px" fw={500} c="#212529">Non-school participants</Text>
                <Textarea {...viewStateProps} value={otherparticipants} onChange={(event) => setState({['otherparticipants']: event.currentTarget.value} as Form)}/>
              </div>
            </>
          }
        </div>
      </div>
    </Card>
  );
};
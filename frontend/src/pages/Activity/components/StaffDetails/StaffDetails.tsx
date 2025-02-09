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
    <Card withBorder radius="sm" className="p-0 overflow-visible">
      <div className="px-4 py-3">
        <span className="text-base">Staff</span>
      </div>
      <div className="flex flex-col gap-6 p-4 border-t border-gray-300">
        <div className="flex flex-col gap-4">
          <StaffSelector 
            staff={staffincharge} 
            setStaff={setStaffInCharge} 
            label="Leader"
            tip="As the Staff-in-Charge of this activity, I acknowledge that all staff and volunteers participating will be made aware of the risk mitigation strategies and any additional activity documentation. I acknowledge I am responsible for all updates and changes to this form to ensure all information is current for staff and school community reference."
            sublabel={isActivity(activitytype) ? "If accompanying please also add name in accompanying list" : ''} 
            multiple={false} 
            readOnly={viewStateProps.readOnly} 
          />
          { isActivity(activitytype) &&
            <>
              <StaffSelector staff={planningstaff} setStaff={setPlanning} label="Planning" multiple={true} readOnly={viewStateProps.readOnly} />
              <StaffSelector 
                staff={accompanyingstaff} 
                setStaff={setAccompanying} 
                label="Accompanying" 
                sublabel="List all staff accompanying the activity, including Leader and Planning staff if attending"
                multiple={true} 
                readOnly={viewStateProps.readOnly} 
                tip="As an accompanying staff member, I have read and understood the risk mitigation strategies and any additional activity documentation. I understand I am actively responsible for engaging in the measures outlined."
              />
              <div>
                <Text fz="sm" mb="5px" fw={500} c="#212529">Non-school participants</Text>
                <Textarea readOnly={viewStateProps.readOnly} value={otherparticipants} onChange={(event) => setState({['otherparticipants']: event.currentTarget.value} as Form)}/>
              </div>
            </>
          }
        </div>
      </div>
    </Card>
  );
};
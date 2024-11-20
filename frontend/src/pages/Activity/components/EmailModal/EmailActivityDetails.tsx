import { useFormStore } from "../../../../stores/formStore"


export function EmailActivityDetails() {
  const activityname = useFormStore((state) => (state.activityname))
  const location = useFormStore((state) => (state.location))
  const timestart = useFormStore((state) => (state.timestart))
  const timeend = useFormStore((state) => (state.timeend))
  const description = useFormStore((state) => (state.description))
  const activitytype = useFormStore((state) => (state.activitytype))
  const transport = useFormStore((state) => (state.transport))
  const cost = useFormStore((state) => (state.cost))
  const staffincharge = useFormStore((state) => (state.actstaffinchargeivityname))

  return (
    <>
      <tr><td width="120"><strong>Activity name: </strong></td><td>{activityname}</td></tr>
      <tr><td><strong>Location: </strong></td><td>{activitytype == 'incursion' ? "(Incursion)" : location}</td></tr>
      <tr><td><strong>Start: </strong></td><td>{timestart}</td></tr>
      <tr><td><strong>End: </strong></td><td>{timeend}</td></tr>
      <tr><td><strong>Details: </strong></td><td>{description}</td></tr>
      { activitytype == 'excursion'
        ? <>
            <tr><td><strong>Transport: </strong></td><td>{transport}</td></tr>
            <tr><td><strong>Cost: </strong></td><td>{cost}</td></tr>
          </>
        : null
      }
      <tr><td><strong>Staff in charge: </strong></td><td>{staffincharge}</td></tr>
    </>
  )


};
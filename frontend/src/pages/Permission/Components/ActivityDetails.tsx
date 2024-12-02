import { Text, Card, Group, Avatar } from '@mantine/core';
import dayjs from "dayjs";
import { useFormStore } from "../../../stores/formStore";

export function ActivityDetails() {

  const formData = useFormStore()

  const details = [
    {
      label: "Activity name",
      value: formData.activityname,
    },
    {
      label: "Start time",
      value: dayjs.unix(Number(formData.timestart)).format("D MMM YYYY H:mma")
    },
    {
      label: "End time",
      value: dayjs.unix(Number(formData.timeend)).format("D MMM YYYY H:mma")
    },
    {
      label: "Location",
      value: formData.location,
    },
    {
      label: "Transport",
      value: formData.transport,
    },
    {
      label: "Cost",
      value: formData.cost,
    },
  ]

  return (
    <Card withBorder radius="sm" className="p-0">
      
      <div className="hidden px-4 py-3">
        <Text fz="md">Activity details</Text>
      </div>

      <Card.Section pos="relative" className='m-0'>
        {details.map((item) => (
          item.value &&
          <div key={item.label} className='border-b flex items-center gap-1 px-4 py-3'>
            <div className='w-36 font-bold'>{item.label}</div>
            <div className='flex-1'>{item.value}</div>
          </div>
        ))}
      </Card.Section>
      
      <Card.Section pos="relative" className='m-0 border-b  flex items-center gap-1 px-4 py-2'>
        <div className='w-36 font-bold'>Staff in charge</div>
        <div>
          { formData.staffincharge.map((staff) => 
              <Group key={staff.un} gap="sm">
                <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + staff.un} />
                <Text>{staff.fn} {staff.ln}</Text>
              </Group>
            )
          }
        </div>
      </Card.Section>

      <Card.Section pos="relative" className='m-0 px-4 py-2 border-b'>
        <div className='font-bold mb-2'>Description</div>
        <div dangerouslySetInnerHTML={ {__html: formData.description || ''} }></div>
      </Card.Section>



    </Card>
  );
};
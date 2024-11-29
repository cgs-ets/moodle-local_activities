import { Text, Card, Table } from '@mantine/core';
import { IconArrowNarrowRight } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useFormStore } from "../../../../stores/formStore";

export function ActivityDetails() {

  const formData = useFormStore()
  const description = useFormStore((state) => (state.description))

  const details = [
    {
      label: "Activity name",
      value: formData.activityname,
    },
    {
      label: "Start time",
      value: dayjs.unix(Number(formData.timestart)).format("DD/MM/YYYY H:mm")
    },
    {
      label: "End time",
      value: dayjs.unix(Number(formData.timeend)).format("DD/MM/YYYY H:mm")
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
      <div className="px-4 py-3">
        <Text fz="md">Activity details</Text>
      </div>

      <Card.Section pos="relative" className='m-0 border-b'>
        {details.map((item) => (
          <div key={item.label} className='border-t flex items-center gap-1 px-4 py-2'>
            <div className='w-36 font-bold'>{item.label}</div>
            <div className='flex-1'>{item.value}</div>
          </div>
        ))}
      </Card.Section>

      <Card.Section pos="relative" className='m-0 px-4 py-2 border-b'>
        <div className='font-bold mb-2'>Description</div>
        <div dangerouslySetInnerHTML={ {__html: formData.description || ''} }></div>
      </Card.Section>



    </Card>
  );
};
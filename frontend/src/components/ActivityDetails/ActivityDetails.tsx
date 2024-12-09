import { Text, Card, Group, Avatar } from '@mantine/core';
import dayjs from "dayjs";
import { Form } from '../../stores/formStore';

export function ActivityDetails({activity}: {activity: Form}) {


  const details = [
    {
      label: "Activity name",
      value: activity.activityname,
    },
    {
      label: "Start time",
      value: dayjs.unix(Number(activity.timestart)).format("D MMM YYYY H:mma")
    },
    {
      label: "End time",
      value: dayjs.unix(Number(activity.timeend)).format("D MMM YYYY H:mma")
    },
    {
      label: "Location",
      value: activity.location,
    },
    {
      label: "Transport",
      value: activity.transport,
    },
    {
      label: "Cost",
      value: activity.cost,
    },
  ]

  const staffincharge = JSON.parse(activity.staffinchargejson);

  return (
    <Card radius={0} className="p-0">
    
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
          <Group key={staffincharge.un} gap="sm">
            <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + staffincharge.un} />
            <Text>{staffincharge.fn} {staffincharge.ln}</Text>
          </Group>
        </div>
      </Card.Section>

      { !!activity.description.length &&
        <Card.Section pos="relative" className='m-0 px-4 py-2 border-b'>
          <div className='font-bold mb-2'>Description</div>
          <div dangerouslySetInnerHTML={ {__html: activity.description || ''} }></div>
        </Card.Section>
      }


    </Card>
  );
};
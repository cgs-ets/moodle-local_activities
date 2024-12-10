import { Text, Card, Group, Avatar, Badge } from '@mantine/core';
import dayjs from "dayjs";
import { Form } from '../../../stores/formStore';
import { IconArrowNarrowRight } from '@tabler/icons-react';

export function ActivityDetails({activity}: {activity: Form}) {

  const details = [
    {
      label: "Type",
      value: activity.activitytype.charAt(0).toUpperCase() + String(activity.activitytype).slice(1),
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


      <Card.Section pos="relative" className='m-0 border-b  flex items-center gap-1 px-4 py-2'>
        <div className='w-36 font-bold'>Time</div>
        <div className='text-base flex items-center gap-3'>
          {dayjs.unix(Number(activity.timestart)).format("H:mmA, D MMM")} <IconArrowNarrowRight className='stroke-1' /> {dayjs.unix(Number(activity.timeend)).format("H:mmA, D MMM")}
        </div>
      </Card.Section>

    
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
          <Group gap="sm">
            <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + staffincharge.un} />
            <Text>{staffincharge.fn} {staffincharge.ln}</Text>
          </Group>
        </div>
      </Card.Section>

      <Card.Section pos="relative" className='m-0 border-b  flex items-center gap-1 px-4 py-2'>
        <div className='w-36 font-bold'>Categories</div>
        <div className='flex gap-2'>
          { JSON.parse(activity.areasjson)?.map((area: string) => {
            return (
              <Badge key={area} variant='light'>{area}</Badge>
            )
          })}
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
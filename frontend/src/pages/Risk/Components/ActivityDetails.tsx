import { Text, Card, Group, Avatar } from '@mantine/core';
import dayjs from "dayjs";
import { Form } from '../../../stores/formStore';

export function ActivityDetails({activity}: {activity: Form}) {


  const staffincharge = JSON.parse(activity.staffinchargejson);

  return (
    <Card radius={0} className="p-0">
    

      {activity.activityname &&
        <Card.Section pos="relative" className='m-0 border-b flex items-center gap-1 px-4 py-3'>
          <div className='w-36 font-bold'>Activity name</div>
          <Text>{activity.activityname}</Text>
        </Card.Section>
      }

      {activity.timestart &&
        <Card.Section pos="relative" className='m-0 border-b flex items-center gap-1 px-4 py-3'>
          <div className='w-36 font-bold'>Start time</div>
          <Text>{dayjs.unix(Number(activity.timestart)).format("D MMM YYYY H:mma")}</Text>
        </Card.Section>
      }

      {!!Number(activity.recurring)
       ?  <Card.Section pos="relative" className='m-0 border-b flex items-start gap-1 px-4 py-3'>
            <div className='w-36 font-bold'>Dates</div>
            <div>
              {activity.occurrences.datesReadable.map((date: any) => (
                <Text key={date.id}>{date.start} - {date.end}</Text>
              ))}
            </div>
          </Card.Section>
       :  <>
            {activity.timeend &&
              <Card.Section pos="relative" className='m-0 border-b flex items-center gap-1 px-4 py-3'>
                <div className='w-36 font-bold'>End time</div>
                <Text>{dayjs.unix(Number(activity.timeend)).format("D MMM YYYY H:mma")}</Text>
              </Card.Section>
            }

            {activity.location &&
              <Card.Section pos="relative" className='m-0 border-b flex items-center gap-1 px-4 py-3'>
                <div className='w-36 font-bold'>Location</div>
                <Text>{activity.location}</Text>
              </Card.Section>
            }
          </>
      }

      {activity.transport &&
        <Card.Section pos="relative" className='m-0 border-b flex items-center gap-1 px-4 py-3'>
          <div className='w-36 font-bold'>Transport</div>
          <Text>{activity.transport}</Text>
        </Card.Section>
      }

      {activity.cost &&
        <Card.Section pos="relative" className='m-0 border-b flex items-center gap-1 px-4 py-3'>
          <div className='w-36 font-bold'>Cost</div>
          <Text>{activity.cost}</Text>
        </Card.Section>
      }

      <Card.Section pos="relative" className='m-0 border-b flex items-center gap-1 px-4 py-2'>
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
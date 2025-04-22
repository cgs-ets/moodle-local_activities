import { Text, Card, Group, Avatar, Badge } from '@mantine/core';
import dayjs from "dayjs";
import { Form } from '../stores/formStore';
import { IconArrowNarrowRight, IconUser } from '@tabler/icons-react';
import { User } from '../types/types';


export function ActivityDetails({activity, isPublic}: {activity: Form, isPublic: boolean}) {

  const details = isPublic 
    ? [
        {
          label: "Location",
          value: activity.location,
        }
      ]
    : [
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
          value: Number(activity.cost) ? activity.cost : '',
        },
      ]

  const staffincharge = JSON.parse(activity.staffinchargejson || '{}');
  const planning = JSON.parse(activity.planningstaffjson || '[]');
  const accompanying = JSON.parse(activity.accompanyingstaffjson || '[]');

  return (
    <Card radius={0} className="p-0">


      <Card.Section pos="relative" className='m-0 border-b  flex items-center gap-1 px-4 pb-2'>
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
      
      {!isPublic &&
        <>
          <Card.Section pos="relative" className='m-0 border-b  flex items-center gap-1 px-4 py-2'>
            <div className='w-36 font-bold'>Staff in charge</div>
            <div>
              <Badge variant='filled' key={staffincharge.un} pl={0} size="lg" h={28} color="gray.2" radius="xl" leftSection={
                  <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + staffincharge.un}><IconUser /></Avatar>
                }
              >
                <Text className="normal-case font-normal text-black text-sm">{staffincharge.fn} {staffincharge.ln}</Text>
              </Badge>
            </div>
          </Card.Section>

          {!!planning.length &&
            <Card.Section pos="relative" className='m-0 border-b  flex items-center gap-1 px-4 py-2'>
              <div className='w-36 font-bold'>Planning staff</div>
              <div className='flex gap-2 items-center'> 
                { planning.map((staff: User) => 
                  <Badge variant='filled' key={staff.un} pl={0} size="lg" h={28} color="gray.2" radius="xl" leftSection={
                      <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + staff.un}><IconUser /></Avatar>
                    }
                  >
                    <Text className="normal-case font-normal text-black text-sm">{staff.fn} {staff.ln}</Text>
                  </Badge>
                )}
              </div>
            </Card.Section>
          }

          {!!accompanying.length &&
            <Card.Section pos="relative" className='m-0 border-b  flex items-center gap-1 px-4 py-2'>
              <div className='w-36 font-bold'>Accompanying staff</div>
              <div className='flex gap-2 items-center'> 
                { accompanying.map((staff: User) => 
                  <Badge variant='filled' key={staff.un} pl={0} size="lg" h={28} color="gray.2" radius="xl" leftSection={
                    <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + staff.un}><IconUser /></Avatar>
                  }
                >
                  <Text className="normal-case font-normal text-black text-sm">{staff.fn} {staff.ln}</Text>
                </Badge>
                )}
              </div>
            </Card.Section>
          }
        </>
      }

      { JSON.parse(activity.areasjson ?? '[]').length > 0 &&
        <Card.Section pos="relative" className='m-0 border-b  flex items-start gap-1 px-4 py-2'>
          <div className='w-36 font-bold'>Categories</div>
          <div className='flex flex-wrap gap-2'>
            { JSON.parse(activity.areasjson ?? '[]')?.map((area: string) => {
              return (
                <Badge key={area} variant='light'>{area}</Badge>
              )
            })}
          </div>
        </Card.Section>
      }

      { !!activity.description.length &&
        <Card.Section pos="relative" className='m-0 px-4 py-2 border-b'>
          <div className='font-bold mb-2'>Description</div>
          <div dangerouslySetInnerHTML={ {__html: activity.description || ''} }></div>
        </Card.Section>
      }

    </Card>
  );
};
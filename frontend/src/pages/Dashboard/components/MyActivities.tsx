import { Avatar, Button, UnstyledButton } from '@mantine/core';
import { useEffect, useState } from 'react';
import useFetch from '../../../hooks/useFetch';
import { Form } from '../../../stores/formStore';
import dayjs from 'dayjs';
import { getConfig, statuses } from '../../../utils';
import { cn } from '../../../utils/utils';
import { IconChecklist, IconUser } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { EventModal } from '../../../components/EventModal';



export function MyActivities() {
  const [involvement, setInvolvement] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Form|null>(null)

  const getMyEvents = useFetch()

  useEffect(() => {
    getEvents()
  }, []);

  const getEvents = async () => {
    const res = await getMyEvents.call({
      query: {
        methodname: 'local_activities-get_my_involvement',
      }
    })
    if (!res.data || res.data.error) {
      return
    }
    setInvolvement(Object.keys(res.data).map((key) => res.data[key]) || [])
  }

  if (!involvement.length) {
    return null
  }
 
  return (
    <div>
      <div className='border-b px-4 py-2 font-semibold bg-gray-200 text-black'>
        <span className="text-base">My upcoming activities</span>
      </div>
      <div className="bg-white">
        <div>  
          { involvement.map((area, i) => {
           
            if (!area.events.length) {
              return null
            }
            return (
              <div key={i}>
                {!!area.heading && <div className='font-semibold border-b py-2 px-4 bg-gray-100'>{area.heading}</div>}
                { area.events?.map((event: any) =>
                  <div key={event.id} className='flex justify-between items-center py-2 px-4 border-b'>

                    {/* The tease */}
                    <div className='cursor-pointer w-full' onClick={() => setSelectedEvent(event)} >
                      <div className='flex items-center gap-2'>
                        <div className={cn("size-2 rounded-full min-w-2", event.status == statuses.approved 
                          ? "bg-[#4aa15d]" 
                          : event.status == statuses.saved 
                            ? "bg-gray-400"
                            : "bg-[#ffa94d]")}></div>
                        {event.activityname}
                      </div>
                      <div>
                        { dayjs.unix(Number(event.timestart)).format("DDMM") == dayjs.unix(Number(event.timeend)).format("DDMM") 
                          ? <div className='text-sm'>{dayjs.unix(Number(event.timestart)).format("DD MMM h:mma ")} - {dayjs.unix(Number(event.timeend)).format("h:mma")}</div>
                          : <div className='text-sm'>{dayjs.unix(Number(event.timestart)).format("DD MMM h:mma ")} - {dayjs.unix(Number(event.timeend)).format("DD MMM h:mma")}</div>
                        }
                      </div>
                    </div>

                    { event.stupermissions?.length > 0 &&
                      <div className='flex items-center gap-2'>
                        <UnstyledButton component={Link} to={`/${event.id}/permission`}>
                          <Avatar.Group className="cursor-pointer">
                            {event.stupermissions.map((permission: any) => {
                              let color = 'border-yellow-500'
                              if (permission.response == 1) {
                                color = 'border-green-500'
                              } else if (permission.response == 2) {
                                color = 'border-red-500'
                              }
                              return (
                                <Avatar 
                                  className={cn('border-2', color)}
                                  size={30} 
                                  key={permission.student.un} 
                                  src={'/local/activities/avatar.php?username=' + permission.student.un}
                                >
                                  <IconUser />
                                </Avatar>
                              )
                            })}
                          </Avatar.Group>
                        </UnstyledButton>
                        <Button component={Link} to={`/${event.id}/permission`} size="compact-md" radius="lg" color="blue" leftSection={<IconChecklist size={20} />}>Permissions</Button>
                      </div>
                    }

                  </div>
                )}
              </div>
            )
          })} 
        </div>
      </div>
      <EventModal hideOpenButton={!getConfig().roles?.includes("staff")} activity={selectedEvent} close={() => setSelectedEvent(null)} />
    </div>
  );
}
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
import { StatusDot } from '../../../components/StatusDot';


interface HistoryArea {
  heading: string;
  events: any[]; // Consider using a more specific type than 'any'
}

export function MyHistory() {
  const [history, setHistory] = useState<Record<string, HistoryArea>>({});
  const [selectedEvent, setSelectedEvent] = useState<Form|null>(null)
  const [loading, setLoading] = useState(false)
  const getMyHistory = useFetch()

  useEffect(() => {
    getHistory()
  }, []);

  const getHistory = async () => {
    setLoading(true)
    const res = await getMyHistory.call({
      query: {
        methodname: 'local_activities-get_my_history',
      }
    })
    if (!res.data || res.data.error) {
      return
    }

    setLoading(false)
    // Need to inject events into the correct area.
    /*const newHistory = JSON.parse(JSON.stringify(history))
    Object.keys(res.data).forEach((area: any) => {
      if (!newHistory[area]) {
        newHistory[area] = {
          heading: res.data[area]?.heading || '',
          events: []
        }
      }
      const newEvents = res.data[area]?.events || [];
      newHistory[area].events = [...(newHistory[area].events || []), ...newEvents]
    })*/
    setHistory(res.data)
 
  }

  return (
    <div>
      <div className='border-b px-4 py-2 font-semibold bg-gray-200 text-black'>
        <span className="text-base">Past activities</span>
      </div>
      <div className="bg-white">
        <div>  
          { Object.keys(history).map((area, i) => {
            if (!history[area]?.events?.length) {
              return null
            }
            return (
              <div key={i}>
                {!!history[area]?.heading && <div className='font-semibold border-b py-2 px-4 bg-gray-100'>{history[area].heading}</div>}
                { history[area]?.events?.map((event: any) =>
                  <div key={`${event.id}-${event.occurrenceid}`} className='flex justify-between items-center py-2 px-4 border-b'>

                    {/* The tease */}
                    <div className='cursor-pointer w-full' onClick={() => setSelectedEvent(event)} >
                      <div className='flex items-center gap-2'>
                        <StatusDot status={event.status} />
                        {event.activityname}
                      </div>
                      <div>
                        { !!Number(event.isallday)
                          ? dayjs.unix(Number(event.timestart)).format("DDMM") == dayjs.unix(Number(event.timeend)).format("DDMM") 
                            ? <div className='text-sm'>All day {dayjs.unix(Number(event.timestart)).format("DD MMM YYYY")}</div>
                            : <div className='text-sm'>All day {dayjs.unix(Number(event.timestart)).format("DD MMM YYYY")} - {dayjs.unix(Number(event.timeend)).format("DD MMM")}</div>
                          : dayjs.unix(Number(event.timestart)).format("DDMM") == dayjs.unix(Number(event.timeend)).format("DDMM") 
                            ? <div className='text-sm'>{dayjs.unix(Number(event.timestart)).format("DD MMM YYYY h:mma ")} - {dayjs.unix(Number(event.timeend)).format("h:mma")}</div>
                            : <div className='text-sm'>{dayjs.unix(Number(event.timestart)).format("DD MMM YYYYh:mma ")} - {dayjs.unix(Number(event.timeend)).format("DD MMM h:mma")}</div>
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
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



export function MyHistory() {
  const [history, setHistory] = useState<any>({})
  const [selectedEvent, setSelectedEvent] = useState<Form|null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const getMyHistory = useFetch()

  useEffect(() => {
    getHistory()
  }, []);

  useEffect(() => {
    getHistory()
  }, [page])

  const getHistory = async () => {
    setLoading(true)
    const res = await getMyHistory.call({
      query: {
        methodname: 'local_activities-get_my_history',
        page: page,
      }
    })
    if (!res.data || res.data.error) {
      return
    }
    const hasSome = Object.values(res.data).some((area: any) => area.events.length)
    if (!hasSome) {
      setHasMore(false)
    }
    setLoading(false)

    if (hasSome) {
      // Need to inject events into the correct area.
      const newHistory = JSON.parse(JSON.stringify(history))
      Object.keys(res.data).forEach((area: any) => {
        if (!newHistory[area]) {
          newHistory[area] = {
            heading: res.data[area].heading,
            events: []
          }
        }
        console.log('res.data[area]', res.data[area])
        const newEvents = res.data[area].events || []
        newHistory[area].events = [...newHistory[area].events, ...newEvents]
      })
      setHistory(newHistory)
    }

  }

  return (
    <div>
      <div className='border-b px-4 py-2 font-semibold bg-[#59a5d7] text-white'>
        <span className="text-base">Past activities</span>
      </div>
      <div className="bg-white">
        <div>  
          { Object.keys(history).map((area, i) => {
            if (!history[area].events.length) {
              return null
            }
            return (
              <div key={i}>
                {!!history[area].heading && <div className='font-semibold border-b py-2 px-4 bg-gray-100'>{history[area].heading}</div>}
                { history[area].events?.map((event: any) =>
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
                          ? <div className='text-sm'>{dayjs.unix(Number(event.timestart)).format("DD MMM YYYY h:mma ")} - {dayjs.unix(Number(event.timeend)).format("h:mma")}</div>
                          : <div className='text-sm'>{dayjs.unix(Number(event.timestart)).format("DD MMM YYYY h:mma ")} - {dayjs.unix(Number(event.timeend)).format("DD MMM h:mma")}</div>
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
        { hasMore &&
          <div className='flex justify-center py-4'>
            <Button size="compact-md" variant='light' className="rounded-full" onClick={() => setPage(page + 1)} loading={loading}>Load more</Button>
          </div>
        }
      </div>
      <EventModal hideOpenButton={!getConfig().roles?.includes("staff")} activity={selectedEvent} close={() => setSelectedEvent(null)} />

    </div>
  );
}
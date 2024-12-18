import { LoadingOverlay } from '@mantine/core';
import { useEffect, useState } from 'react';
import useFetch from '../../../hooks/useFetch';



export function MyActivities() {
  const [involvement, setInvolvement] = useState<any[]>([])
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
    setInvolvement(
      [
        {
          heading: "Student participant",
          events: []
        },
        {
          heading: "Parent of participating student",
          events: []
        },
        {
          heading: "Staff member in charge",
          events: []
        },
        {
          heading: "Planner",
          events: []
        },
        {
          heading: "Accompanying",
          events: []
        },
      ]
    )
  }
 
  return (
    <>
      <div className="bg-white">
        <div className='border-b p-4'>
          <span className="text-base">My upcoming activities</span>
        </div>
        <div>  
          { involvement.map((area) =>
            <div className='border-b p-2 px-4'>
              <div className='font-semibold'>{area.heading}</div>
            </div>
          )}
        </div>
      </div>

    </>
  );
}
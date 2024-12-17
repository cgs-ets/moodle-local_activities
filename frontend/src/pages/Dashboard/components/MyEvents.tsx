import { LoadingOverlay } from '@mantine/core';
import { useState } from 'react';



export function MyEvents() {
  const [events, setEvents] = useState<any[]>([])

  const getEvents = () => {
    
  }
 
  return (
    <>
      <div className="bg-white">
        <div className='border-b p-4'>
          <span className="text-base">My activities</span>
        </div>
        <div className='border-b p-4'>
          <LoadingOverlay visible={false} />
          Something cool
        </div>
      </div>

    </>
  );
}
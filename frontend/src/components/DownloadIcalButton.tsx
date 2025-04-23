import React from 'react';
import { Form } from '../stores/formStore';
import { getConfig } from '../utils';
import { IconCalendarDown } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';
interface DownloadIcalButtonProps {
  events: Form[];
  isPublic?: boolean;
}

const DownloadIcalButton: React.FC<DownloadIcalButtonProps> = ({ events, isPublic }) => {
  const formatUnixTimestampToIcal = (timestamp: number, includeTimezone: boolean = true): string => {
    // Convert Unix timestamp (seconds) to milliseconds
    const date = new Date(timestamp * 1000);
    
    // Format as YYYYMMDDTHHMMSS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  const generateIcalContent = (): string => {
    // Basic iCal headers
    let icalContent = [
      'BEGIN:VCALENDAR',
      'PRODID:https://calendar.cgs.act.edu.au',
      'VERSION:2.0',
      'METHOD:PUBLISH',
      'BEGIN:VTIMEZONE',
      'TZID:AUS Eastern Standard Time',
      'BEGIN:STANDARD',
      'DTSTART:16010401T030000',
      'RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=4',
      'TZOFFSETFROM:+1100',
      'TZOFFSETTO:+1000',
      'END:STANDARD',
      'BEGIN:DAYLIGHT',
      'DTSTART:16011007T020000',
      'RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=10',
      'TZOFFSETFROM:+1000',
      'TZOFFSETTO:+1100',
      'END:DAYLIGHT',
      'END:VTIMEZONE',
    ].join('\r\n');

    // Add events
    events.forEach((event: Form) => {
      icalContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:${event.id}@calendar.cgs.act.edu.au`,
        `DTSTART;TZID="AUS Eastern Standard Time":${formatUnixTimestampToIcal(event.timestart)}`,
        `DTEND;TZID="AUS Eastern Standard Time":${formatUnixTimestampToIcal(event.timeend)}`,
        `DTSTAMP:${formatUnixTimestampToIcal(Math.floor(Date.now() / 1000))}`,
        'PRIORITY:5',
        'SEQUENCE:0',
        `SUMMARY;LANGUAGE=en-au:${event.activityname.trim()}`,
        `URL:${ isPublic ? `${getConfig().wwwroot}/local/activities/public/${event.id}` : `${getConfig().wwwroot}/local/activities/${event.id}`}`,
        `DESCRIPTION:View more at: ${ isPublic ? `${getConfig().wwwroot}/local/activities/public/${event.id}` : `${getConfig().wwwroot}/local/activities/${event.id}`}`,
        `CATEGORIES:${ JSON.parse(event.areasjson ?? '[]')?.map((area: string) => area).join(',') }`,
        `LOCATION:${event.location ? event.location.trim() : ''}`,
        'END:VEVENT',
      ].join('\r\n');
    });

    icalContent += '\r\nEND:VCALENDAR';
    return icalContent;
  };

  const handleDownload = (): void => {
    const icalContent = generateIcalContent();
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'calendar.ics');
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ActionIcon variant="transparent" onClick={handleDownload} className='!outline-none'>
      <IconCalendarDown size={20} />
    </ActionIcon>
  );
};

export default DownloadIcalButton;
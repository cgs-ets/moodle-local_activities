import { ActionIcon } from "@mantine/core";
import { IconArrowNarrowLeft, IconArrowNarrowRight } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import useFetch from "../../../hooks/useFetch";
import { CalendarTease } from "./CalendarTease";
import { EventModal } from "./EventModal";
import { Form } from "../../../stores/formStore";
import { useSearchParams } from "react-router-dom";

type MoYear = {
  month: string,
  year: string,
}

export function Calendar() {

  const [searchParams, setSearchParams] = useSearchParams();

  const [date, setDate] = useState<MoYear>({
    month: searchParams.get('month') || dayjs().format("MM"),
    year: searchParams.get('year') || dayjs().format("YYYY"),
  })
  
  const getCalendarAPI = useFetch()
  const [calendar, setCalendar] = useState<any>({
    cells: []
  })

  const [selectedEvent, setSelectedEvent] = useState<Form|null>(null)

  // If search params change, update the date.
  useEffect(() => {
    if (searchParams.get('month') && searchParams.get('year')) {
      setDate({month: searchParams.get('month')!, year: searchParams.get('year')!})
    }
  }, [searchParams]);

  // If the date changes, get calendar.
  useEffect(() => {
    if (date && date.month && date.year) {
      getCalendar(date)
    }
  }, [date]);

  const getCalendar = async (date: MoYear) => {
    const res = await getCalendarAPI.call({
      query: {
        methodname: 'local_activities-get_cal',
        type: 'full',
        month: date.month,
        year: date.year,
      }
    })
    const result = splitCells(res.data.cells);
    const adapted = {...res.data, cells: result}
    setCalendar(adapted)
    console.log(adapted)
  }


  const splitCells = (cells: Record<string, any>) => {
    const keys = Object.keys(cells);
    const splitCellsArray: Array<Array<any>> = [];
  
    for (let i = 0; i < keys.length; i += 7) {
      const weekCells: Array<any> = [];
      for (let j = 0; j < 7 && i + j < keys.length; j++) {
        const dayKey = keys[i + j];
        const dayObject = { ...cells[dayKey], day_key: dayKey }; // Add day_key to the object
        weekCells.push(dayObject);
      }
      splitCellsArray.push(weekCells);
    }
  
    return splitCellsArray;
  };

  const handleNav = (direction: number) => {
    if (direction > 0) {
      setSearchParams(params => {
        params.set("month", calendar.pagination.next.mo);
        params.set("year", calendar.pagination.next.yr);
        return params;
      });
    } else {
      setSearchParams(params => {
        params.set("month", calendar.pagination.previous.mo);
        params.set("year", calendar.pagination.previous.yr);
        return params;
      });
    }
  }

  return (
    <div>
      
      <div className="h-[54px] w-full flex justify-between items-center">
        <ActionIcon onClick={() => handleNav(-1)} variant="subtle" size="lg"><IconArrowNarrowLeft className="size-7" /></ActionIcon>

        <div className="text-xl font-semibold">{dayjs(`${date.year}-${date.month}-15`).format("MMM YYYY")}</div>

        <ActionIcon onClick={() => handleNav(1)} variant="subtle" size="lg"><IconArrowNarrowRight className="size-7" /></ActionIcon>
      </div>

      <table className="ev-calendar full-calendar">
        <thead>
          <tr className="days-names">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((weekday) => <td key={weekday}>{weekday}</td>)}
          </tr>
        </thead>
        <tbody>
            { calendar.cells.map((week: any, i: number) => (
              <tr key={i}>
                { week.map((cell: any) => {
                  return (
                    !!cell.events_count
                    ? <td key={cell.date} className={`eventful ${cell.type}`}>
                        <span className="day-num">{dayjs.unix(cell.date).format("D") }</span>
                        <ul>
                          { Object.keys(cell.events).map((ts) => {
                            const event = cell.events[ts]
                            return (
                              <div key={event.id}>                            
                                <CalendarTease celldate={cell.date} event={event} setSelectedEvent={setSelectedEvent}/>
                              </div>
                            )})
                          }
                        </ul>
                      </td>
                    : <td key={cell.date} className={`eventless ${cell.type}`}>
                        <span className="day-num">{dayjs.unix(cell.date).format("D") }</span>
                      </td>
                  )
                })}
              </tr>
            ))}
        </tbody>
      </table>

      <EventModal activity={selectedEvent} close={() => setSelectedEvent(null)} />

    </div>
  )
}

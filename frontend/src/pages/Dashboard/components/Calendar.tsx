import { ActionIcon, Button } from "@mantine/core";
import { IconArrowNarrowLeft, IconArrowNarrowRight } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useAjax } from "../../../hooks/useAjax";

type Props = {
  month: number;
  year: number;
}

export function Calendar({month, year}: Props) {
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchData] = useAjax(); // destructure state and fetch function
  const [calendar, setCalendar] = useState<any>({
    cells: []
  })

  useEffect(() => {
    getCalendar()
  }, []);

  const getCalendar = () => {
    fetchAjax({
      query: {
        methodname: 'local_activities-get_cal',
        type: 'full',
      }
    })
  }



  useEffect(() => {
    if (fetchResponse && !fetchError) {
      const result = splitCells(fetchResponse.data.cells);
      const adapted = {...fetchResponse.data, cells: result}
      setCalendar(adapted)
      console.log(adapted)
    }
  }, [fetchResponse]);

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
  
  
  

  return (
    <div>
      
      <div className="h-[54px] w-full flex justify-between items-center mt-10">
        <ActionIcon onClick={getCalendar} variant="subtle" size="lg"><IconArrowNarrowLeft className="size-7" /></ActionIcon>

        <div className="text-xl">{dayjs(`${year}-${month}-15`).format("MMM YYYY")}</div>

        <ActionIcon variant="subtle" size="lg"><IconArrowNarrowRight className="size-7" /></ActionIcon>
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
                    cell.events.length 
                    ? <td key={cell.date} className={`eventful ${cell.type}`}>
                        <span className="day-num">{dayjs.unix(cell.date).format("D") }</span>
                        <ul>
                          { cell.events.map((event: any) => (
                            <span>tease-full-event</span>
                          ))}
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


    </div>
    
  )
}

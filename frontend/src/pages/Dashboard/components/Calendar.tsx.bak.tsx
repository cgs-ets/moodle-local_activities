import { ActionIcon, Button, LoadingOverlay, Select } from "@mantine/core";
import { IconAdjustments, IconArrowNarrowLeft, IconArrowNarrowRight, IconCalendarDue, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import useFetch from "../../../hooks/useFetch";
import { CalendarTease } from "./CalendarTease";
import { EventModal } from "./EventModal";
import { Form } from "../../../stores/formStore";
import { useSearchParams } from "react-router-dom";
import { FilterModal } from "./FilterModal";
import { useDisclosure } from "@mantine/hooks";
import { User } from "../../../types/types";
import { useFilterStore } from "../../../stores/filterStore";

type MoYear = {
  month: string,
  year: string,
}

export function Calendar() {

  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useFilterStore((state) => state)
  const setFilters = useFilterStore((state) => (state.setState))
  const reset = useFilterStore((state) => (state.reset))
  const [loading, {open: startLoading, close: stopLoading}] = useDisclosure(true)

  const [filterOpened, {close: closeFilter, open: openFilter}] = useDisclosure(false)

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
    startLoading()
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
    stopLoading()
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

  const handleMonthSelect = (month: string | null) => {
    setSearchParams(params => {
      params.set("month", month || dayjs().format("MM"));
      return params;
    });
  }

  const handleYearSelect = (year: string | null) => {
    setSearchParams(params => {
      params.set("year", year || dayjs().format("YYYY"));
      return params;
    });
  }

  const goToToday = () => {
    setSearchParams(params => {
      params.set("year", dayjs().format("YYYY"));
      params.set("month", dayjs().format("MM"));
      return params;
    });
  }

  const filteredCalendar = useMemo(() => {
    if (!calendar || !filters) return calendar;
    const filterStaff = filters.staff.map((u: string) => JSON.parse(u).un)
  
    const filteredCells = calendar.cells.map((week: any) =>
      week.map((day: any) => {
        if (!day.events) return day;

        const filteredEvents: Record<string, Form> = {};
  
        for (const [eventId, event] of Object.entries(day.events as Form[])) {

          const eventCategories = JSON.parse(event.categoriesjson || '[]');
          const matchesCategory =
            filters.categories.length === 0 || 
            filters.categories.some((cat) => eventCategories.includes(cat));

          const matchesType =
            filters.types.length === 0 || 
            filters.types.includes(event.activitytype);

          const matchesStatus =
            filters.status.length === 0 || 
            filters.status.includes(event.status.toString());

          const eventStaff = [event.staffincharge, ...JSON.parse(event.planningstaffjson).map((u: User) => u.un), ...JSON.parse(event.accompanyingstaffjson).map((u: User) => u.un)]
          const uniqueEventStaff = [...new Set(eventStaff.filter(item => item.trim() !== ""))];
          const matchesStaff =
            filterStaff.length === 0 || 
            filterStaff.some((staff) => uniqueEventStaff.includes(staff));

          if (matchesCategory && matchesType && matchesStatus && matchesStaff) {
            filteredEvents[eventId] = event;
          }
        }
  
        return { ...day, events: filteredEvents };
      })
    );
  
    return { ...calendar, cells: filteredCells };
  }, [filters, calendar]);


  const hasFilters = () => {
    return filters.categories.length || filters.types.length || filters.status.length || filters.staff.length
  }


  return (
    <div>
      
      <div className="p-3 w-full flex justify-between items-center">
        <ActionIcon onClick={() => handleNav(-1)} variant="subtle" size="lg"><IconArrowNarrowLeft className="size-7" /></ActionIcon>

        <div className="text-xl font-semibold flex gap-2 items-center">
          <Select
            placeholder="Month"
            data={[
              { value: '1', label: 'January' },
              { value: '2', label: 'February' },
              { value: '3', label: 'March' },
              { value: '4', label: 'April' },
              { value: '5', label: 'May' },
              { value: '6', label: 'June' },
              { value: '7', label: 'July' },
              { value: '8', label: 'August' },
              { value: '9', label: 'September' },
              { value: '10', label: 'October' },
              { value: '11', label: 'November' },
              { value: '12', label: 'December' },
            ]}
            value={date.month} onChange={handleMonthSelect} 
            className="w-36"
            size="md"
          />

          <Select
            placeholder="Year"
            data={Array
              .from({ length: 11 }, (_, i) => parseInt(dayjs().format("YYYY"), 10) - 5 + i)
              .map(year => year.toString())  
            }
            value={date.year} onChange={handleYearSelect} 
            className="w-28"
            size="md"
          />

          <div className="ml-2 flex items-center gap-2 ">
            <Button onClick={goToToday} variant="light" aria-label="Filters" className="h-8" size="compact-md">Today</Button>
            { hasFilters() 
              ? <div className="flex">
                  <Button color="orange" onClick={() => openFilter()} variant="light" aria-label="Filters" size="compact-md" leftSection={<IconAdjustments size={20} />} className="h-8 rounded-r-none">Filters on</Button>
                  <ActionIcon color="orange" onClick={reset} variant="light" aria-label="Clear"  size="compact-md" ml={2} className="rounded-l-none pl-1 pr-1">
                    <IconX stroke={1.5} size={18} />
                  </ActionIcon>
                </div>
              : <ActionIcon onClick={() => openFilter()} variant="light" aria-label="Filters" className="size-8"  >
                  <IconAdjustments stroke={1.5} />
                </ActionIcon>
            } 
          </div>
          


        </div>

        <ActionIcon onClick={() => handleNav(1)} variant="subtle" size="lg"><IconArrowNarrowRight className="size-7" /></ActionIcon>
      </div>

      
      <div className="relative">
        <LoadingOverlay visible={loading}  />
        <table className="ev-calendar full-calendar">
          <thead>
            <tr className="days-names">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((weekday) => <td key={weekday}>{weekday}</td>)}
            </tr>
          </thead>
          <tbody>
              { filteredCalendar.cells.map((week: any, i: number) => (
                <tr key={i}>
                  { week.map((cell: any) => {
                    return (
                      !!Object.entries(cell.events).length
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
      </div>
      

      <EventModal activity={selectedEvent} close={() => setSelectedEvent(null)} />

      <FilterModal opened={filterOpened} filters={filters} setFilters={setFilters} close={() => closeFilter()} />

    </div>
  )
}

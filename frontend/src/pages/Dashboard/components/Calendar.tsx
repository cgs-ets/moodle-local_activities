import { ActionIcon, Button, Card, LoadingOverlay, Select } from "@mantine/core";
import { IconAdjustments, IconArrowNarrowLeft, IconArrowNarrowRight, IconCalendarDue, IconCalendarWeek, IconClockCheck, IconListDetails, IconTable, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import useFetch from "../../../hooks/useFetch";
import { CalendarTease } from "./CalendarTease";
import { Form } from "../../../stores/formStore";
import { useSearchParams } from "react-router-dom";
import { FilterModal } from "./FilterModal";
import { useDisclosure } from "@mantine/hooks";
import { User } from "../../../types/types";
import { useFilterStore } from "../../../stores/filterStore";
import { getTermFromMonth } from "../../../utils/utils";
import { getConfig, statuses } from "../../../utils";
import { EventModal } from "../../../components/EventModal";

type MoYear = {
  month: string,
  year: string,
}

type Props = {
  setCaltype: (caltype: string) => void,
}

export function Calendar({setCaltype}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useFilterStore((state) => state)
  const setFilters = useFilterStore((state) => (state.setState))
  const reset = useFilterStore((state) => (state.reset))
  const [loading, {open: startLoading, close: stopLoading}] = useDisclosure(true)

  const [filterOpened, {close: closeFilter, open: openFilter}] = useDisclosure(false)

  const [date, setDate] = useState<MoYear>({
    month: searchParams.get('month') || dayjs().format("M"),
    year: searchParams.get('year') || dayjs().format("YYYY"),
  })
  
  const getCalendarAPI = useFetch()

  const [calendar, setCalendar] = useState<any>({
    cells: []
  })

  const [selectedEvent, setSelectedEvent] = useState<Form|null>(null)

  // If search params change, update the date.
  useEffect(() => {
    setDate({
      month: searchParams.get('month') || dayjs().format("M"), 
      year: searchParams.get('year') || dayjs().format("YYYY"), 
    })
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
        params.set("year", calendar.pagination.next.yr);
        params.set("month", calendar.pagination.next.mo);
        params.set("term", getTermFromMonth(calendar.pagination.next.mo, calendar.pagination.next.yr).toString());
        return params;
      });
    } else {
      setSearchParams(params => {
        params.set("year", calendar.pagination.previous.yr);
        params.set("month", calendar.pagination.previous.mo);
        params.set("term", getTermFromMonth(calendar.pagination.previous.mo, calendar.pagination.previous.yr).toString());
        return params;
      });
    }
  }

  const handleMonthSelect = (month: string | null) => {
    setSearchParams(params => {
      const m = month || dayjs().format("MM")
      params.set("year", date.year);
      params.set("month", m);
      params.set("term", getTermFromMonth(m, date.year).toString());
      return params;
    });
  }

  const handleYearSelect = (year: string | null) => {
    setSearchParams(params => {
      const y = year || dayjs().format("YYYY")
      params.set("year", y);
      params.set("month", date.month);
      params.set("term", getTermFromMonth(date.month, y).toString());
      return params;
    });
  }

  const goToToday = () => {
    setSearchParams(params => {
      params.set("year", dayjs().format("YYYY"));
      params.set("month", dayjs().format("M"));
      params.set("term", getTermFromMonth(dayjs().format("M"), dayjs().format("YYYY")).toString());
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

          const matchesName =
            filters.name.length === 0 || 
            event.activityname.toLowerCase().includes(filters.name.toLowerCase());
          

          const eventCategories = JSON.parse(event.categoriesjson || '[]');
          const matchesCategory =
            filters.categories.length === 0 || 
            filters.categories.some((cat) => eventCategories.includes(cat));

          const matchesType =
            filters.types.length === 0 || 
            filters.types.includes(event.activitytype);

            
          const matchesCampus =
            filters.campus.length === 0 || 
            filters.campus.includes(event.campus);

          const matchesStatus =
            filters.status.length === 0 || 
            filters.status.includes(event.status.toString());

          const eventStaff = [event.staffincharge, ...JSON.parse(event.planningstaffjson).map((u: User) => u.un), ...JSON.parse(event.accompanyingstaffjson).map((u: User) => u.un)]
          const uniqueEventStaff = [...new Set(eventStaff.filter(item => item.trim() !== ""))];
          const matchesStaff =
            filterStaff.length === 0 || 
            filterStaff.some((staff) => uniqueEventStaff.includes(staff));

          const matchesReviewStep = filters.reviewstep.length === 0 ||
            ( event.status == statuses.inreview && 
              filters.reviewstep.some((step) => event.stepname.indexOf(step) > -1)
            ); 

          if (matchesName && matchesCategory && matchesType && matchesCampus && matchesStatus && matchesStaff && matchesReviewStep) {
            filteredEvents[eventId] = event;
          }
        }
  
        return { ...day, events: filteredEvents };
      })
    );
  
    return { ...calendar, cells: filteredCells };
  }, [filters, calendar]);


  const hasFilters = () => {
    return filters.categories.length || filters.types.length || filters.campus.length || filters.status.length || filters.staff.length || filters.name.length || filters.reviewstep.length
  }


  return (
    <div>

      <div>
        <div className="p-3 w-full flex justify-between items-center bg-white">
          <ActionIcon onClick={() => handleNav(-1)} variant="subtle" size="lg"><IconArrowNarrowLeft className="size-7" /></ActionIcon>
          
          <div className="text-xl font-semibold flex gap-2 items-center flex-wrap">

            <div className="mr-2 flex items-center gap-2">
              <ActionIcon onClick={() => setCaltype('calendar')} variant="light" className="size-8"  >
                <IconCalendarWeek stroke={1.5} />
              </ActionIcon>
              <ActionIcon onClick={() => setCaltype('list')} variant="light" className="size-8"  >
                <IconListDetails stroke={1.5} />
              </ActionIcon>
              <ActionIcon onClick={() => setCaltype('table')} variant="light" className="size-8"  >
                <IconTable stroke={1.5} />
              </ActionIcon>
            </div>

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
              value={date.year} 
              onChange={handleYearSelect} 
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
      </div>

      <div>
        <div className="relative">
          <LoadingOverlay visible={loading} p={100} />
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
                        ? <td key={cell.date} className={`eventful ${cell.type} ${cell.type == 'today' ? 'bg-blue-50 !border-b-blue-500' : ''}`}>
                            <span className="day-num">{dayjs.unix(cell.date).format("D") }</span>
                            <ul>
                              { Object.keys(cell.events).map((ts) => {
                                const event = cell.events[ts]
                                return (
                                  <CalendarTease key={event.id} celldate={cell.date} event={event} setSelectedEvent={setSelectedEvent}/>
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
        
        <EventModal activity={selectedEvent} close={() => setSelectedEvent(null)} hideOpenButton={!getConfig().roles?.includes("staff")} />

        <FilterModal opened={filterOpened} filters={filters} setFilters={setFilters} close={() => closeFilter()} />

      </div>
    </div>

  )
}

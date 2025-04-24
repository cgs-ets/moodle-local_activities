import { ActionIcon, Button, Card, Loader, LoadingOverlay, Select, Text } from "@mantine/core";
import { IconAdjustments, IconArrowNarrowLeft, IconArrowNarrowRight, IconCalendarDue, IconCalendarWeek, IconEye, IconListDetails, IconRotateClockwise2, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import useFetch from "../../../hooks/useFetch";
import { Form } from "../../../stores/formStore";
import { useSearchParams } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { useFilterStore } from "../../../stores/filterStore";
import { ListTease } from "./ListTease";
import { User } from "../../../types/types";
import { getMonthFromTerm, getTermFromMonth, isCalReviewer } from "../../../utils/utils";
import { getConfig, statuses } from "../../../utils";
import { EventModal } from "../../../components/EventModal";

type TermYear = {
  term: string,
  year: string,
}


type Props = {
  setCaltype: (caltype: string) => void,
}

export function List({setCaltype}: Props) {

  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useFilterStore((state) => state)
  const setFilters = useFilterStore((state) => (state.setState))
  const reset = useFilterStore((state) => (state.reset))
  const [loading, {open: startLoading, close: stopLoading}] = useDisclosure(true)
  const [filterOpened, {close: closeFilter, open: openFilter}] = useDisclosure(false)
  const [showPast, setShowPast] = useState(false)

  const currterm = dayjs().format("MM-DD") > '09-28' ? 4 
    : dayjs().format("MM-DD") > '06-29' ? 3
    : dayjs().format("MM-DD") > '04-13' ? 2
    : 1
  
  const initYear = searchParams.get('year') || dayjs().format("YYYY");
  // If coming from calendar view, a certain month may have been in view. Get term based on that.
  const initTerm = searchParams.get('term') 
    ? searchParams.get('term') 
    : searchParams.get('month')
      ? getTermFromMonth(searchParams.get('month')!, initYear).toString()
      : currterm.toString()

  const [date, setDate] = useState<TermYear>({
    term: initTerm!,
    year: initYear,
  })
  
  const getCalendarAPI = useFetch()

  const [list, setList] = useState<any>({
    days: {
      current: [],
      upcoming: [],
    }
  })

  const [selectedEvent, setSelectedEvent] = useState<Form|null>(null)

  // If search params change, update the date.
  useEffect(() => {
    setDate({
      term: searchParams.get('term') || currterm.toString(), 
      year: searchParams.get('year') || initYear, 
    })
  }, [searchParams]);

  // If the date changes, get calendar.
  useEffect(() => {
    if (date && date.term && date.year) {
      getList(date)
    }
  }, [date]);

  const getList = async (date: TermYear, showPast: boolean = false) => {
    startLoading()
    const res = await getCalendarAPI.call({
      query: {
        methodname: 'local_activities-get_public_calendar',
        type: 'list',
        term: date.term,
        year: date.year,
        show_past: showPast,
      }
    }, getConfig().wwwroot + '/local/activities/service-public.php')
    setList(res.data)
    stopLoading()
  }

  const handleNav = (direction: number) => {
    if (direction > 0) {
      setSearchParams(params => {
        params.set("term", list.pagination.next.tm);
        params.set("year", list.pagination.next.yr);
        params.set("month", getMonthFromTerm(list.pagination.next.tm).toString());
        return params;
      });
    } else {
      setSearchParams(params => {
        params.set("term", list.pagination.previous.tm);
        params.set("year", list.pagination.previous.yr);
        params.set("month", getMonthFromTerm(list.pagination.next.tm).toString());
        return params;
      });
    }
  }

  const handleTermSelect = (term: string | null) => {
    setSearchParams(params => {
      params.set("year", date.year);
      params.set("term", term || '1');
      params.set("month", getMonthFromTerm(term || '1').toString());
      return params;
    });
  }

  const handleYearSelect = (year: string | null) => {
    setSearchParams(params => {
      params.set("year", year || dayjs().format("YYYY"));
      params.set("term", date.term);
      params.set("month", getMonthFromTerm(date.term).toString());
      return params;
    });
  }

  const goToToday = () => {
    setSearchParams(params => {
      params.set("year", dayjs().format("YYYY"));
      params.set("term", currterm.toString());
      params.set("month", getMonthFromTerm(currterm.toString()).toString());
      params.delete("month");
      return params;
    });
  }

  const filterEvents = (days: any[]) => {
    const filterStaff = filters.staff.map((u: string) => JSON.parse(u).un)
    return days.map((day: any) => {
      const filteredEvents = day.events.filter((event: any) => {
        const eventCategories = JSON.parse(event.categoriesjson || '[]') as string[];

        const matchesName =
            filters.name.length === 0 || 
            event.activityname.toLowerCase().includes(filters.name.toLowerCase());
  
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

        return matchesName && matchesCategory && matchesType && matchesCampus && matchesStatus && matchesStaff && matchesReviewStep;

      });
      return { ...day, events: filteredEvents, events_count: filteredEvents.length };
    })
    .filter((day: any) => {
      return !!day.events.length
    })
  }

  const filteredList = useMemo(() => {
    if (!list || !filters) return list;

    const filteredCurrent = filterEvents(list.days.current)

    const filteredUpcoming = filterEvents(list.days.upcoming)

    const newList = {
      ...list,
      days: {
        ...list.days,
        current: filteredCurrent,
        upcoming: filteredUpcoming,
      },
    };

    return newList
  }, [filters, list]);


  const hasFilters = () => {
    return filters.categories.length || filters.types.length || filters.status.length || filters.staff.length || filters.name.length || filters.reviewstep.length
  }

  const toggleShowPast = () => {
    setShowPast(!showPast)
    getList(date, !showPast)
  }

  return (
    <div>
   
        <div className="p-3 w-full flex justify-between items-center">
          <ActionIcon onClick={() => handleNav(-1)} variant="subtle" size="lg"><IconArrowNarrowLeft className="size-7" /></ActionIcon>

          <div className="text-xl font-semibold flex gap-2 items-center">
            <div className="mr-2 flex items-center gap-2">
              <ActionIcon onClick={() => setCaltype('calendar')} variant="light" aria-label="Calendar view" title="Calendar view" className="size-8"  >
                <IconCalendarWeek stroke={1.5} />
              </ActionIcon>
              <ActionIcon onClick={() => setCaltype('list')} variant="light" aria-label="List view" title="List view" className="size-8"  >
                <IconListDetails stroke={1.5} />
              </ActionIcon>
            </div>
            <Select
              placeholder="Term"
              data={[
                { value: '1', label: 'Term 1' },
                { value: '2', label: 'Term 2' },
                { value: '3', label: 'Term 3' },
                { value: '4', label: 'Term 4' },
              ]}
              value={date.term} 
              onChange={handleTermSelect} 
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
              <Button onClick={goToToday} variant="light" aria-label="Go to today" title="Go to today" className="h-8" size="compact-md">Today</Button>
              { hasFilters() 
                ? <div className="flex">
                    <Button color="orange" onClick={() => openFilter()} variant="light" aria-label="Filters" title="Filters" size="compact-md" leftSection={<IconAdjustments size={20} />} className="h-8 rounded-r-none">Filters on</Button>
                    <ActionIcon color="orange" onClick={reset} variant="light" aria-label="Clear"  size="compact-md" ml={2} className="rounded-l-none pl-1 pr-1">
                      <IconX stroke={1.5} size={18} />
                    </ActionIcon>
                  </div>
                : <ActionIcon onClick={() => openFilter()} variant="light" aria-label="Filters" title="Filters" className="size-8"  >
                    <IconAdjustments stroke={1.5} />
                  </ActionIcon>
              } 

              { !loading && date.term == currterm.toString() && date.year == dayjs().format("YYYY") && !showPast &&
                <ActionIcon variant="light" aria-label="Show past events" title="Show past events" className="size-8" onClick={() => toggleShowPast()}><IconRotateClockwise2 className="transform rotate-90 scale-x-[-1]" stroke={1.5} /></ActionIcon>
              }
            </div>



          </div>

          <ActionIcon onClick={() => handleNav(1)} variant="subtle" size="lg"><IconArrowNarrowRight className="size-7" /></ActionIcon>

        </div>
 



      <div className="relative">
        
        { filteredList.days.current.length
          ? <LoadingOverlay visible={loading} />
          : loading && <div className="p-6"><Loader size="sm" /></div>
        }

        { !loading && !filteredList.days.current.length && !filteredList.days.upcoming.length &&
          <div className="text-base italic p-6">No events in selected period. {hasFilters() ? "Try removing filters." : ""}</div>
        }

        <Card className="ev-calendar list-calendar rounded-none" p={0}>

          { !!filteredList.days.current.length && date.term == currterm.toString() && date.year == dayjs().format("YYYY") &&
            <div className="px-4 py-3 border-t">
              <span className="font-semibold text-gray-500 text-sm uppercase tracking-wider">Currently on</span>
            </div>
          }

          { filteredList.days?.current.map((day: any, i: number) => (
            !!day.events.length &&
            <div key={day.date_key} className="ev-calendar-item ev-calendar-item-current">
              <div className="flex justify-between px-4 py-2 border-t">
                { day.date_key == dayjs().format("YYYY-MM-DD")
                  ? <Text className="font-semibold text-lg">Started today</Text>
                  : <Text className="font-semibold text-lg">Started on {dayjs.unix(Number(day.date)).format("D MMM")}</Text>
                }
                { isCalReviewer() && 
                  <div className="text-gray-500 flex items-center text-center">
                    <div className="w-20"><Text className="text-sm">Approved</Text></div>
                    <div className="w-20"><Text className="text-sm">Public Now</Text></div>
                  </div>
                }
              </div>
              
              <div>
                {day.events.map((event: any) => (
                  <div key={event.id}>
                    <ListTease celldate={day.date} event={event} setSelectedEvent={setSelectedEvent}/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card className="ev-calendar list-calendar border-b rounded-none" p={0}>
          { !!filteredList.days.current.length && !!filteredList.days.upcoming.length && date.term == currterm.toString() && date.year == dayjs().format("YYYY") &&
            <div className="px-4 py-3 border-t">
              <span className="font-semibold text-gray-500 text-sm uppercase tracking-wider">{!showPast ? "Upcoming" : "All"}</span>
            </div>
          }

          { filteredList.days.upcoming.map((day: any, i: number) => (
            !!day.events.length &&
            <div key={day.date_key} className="ev-calendar-item ev-calendar-item-current">
              <div className={`flex justify-between px-4 py-2 border-t ${day.date_key == dayjs().format("YYYY-MM-DD") ? 'bg-blue-50 border-y border-blue-500' : ''}`}>
                { day.date_key == dayjs().format("YYYY-MM-DD")
                  ? <Text className="font-semibold text-xl">Today</Text>
                  : <Text className="font-semibold text-lg">{dayjs.unix(Number(day.date)).format("ddd, D MMM YYYY")}</Text>
                }
                { isCalReviewer() && 
                  <div className="text-gray-500 flex items-center text-center">
                    <div className="w-20"><Text className="text-sm">Approved</Text></div>
                    <div className="w-20"><Text className="text-sm">Public Now</Text></div>
                  </div>
                }
              </div>
              <ul>
                {day.events.map((event: any) => (
                  <div key={event.id}>
                    <ListTease celldate={day.date} event={event} setSelectedEvent={setSelectedEvent}/>
                  </div>
                ))}
              </ul>
            </div>
          ))}
        </Card>
      </div>


      <EventModal activity={selectedEvent} close={() => setSelectedEvent(null)} isPublic={true} />

      {/*<FilterModal opened={filterOpened} filters={filters} setFilters={setFilters} close={() => closeFilter()} />*/}


    </div>
  )
}
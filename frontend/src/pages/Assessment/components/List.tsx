import { ActionIcon, Anchor, Button, Card, Loader, LoadingOverlay, Select, Text } from "@mantine/core";
import { IconAdjustments, IconArrowNarrowLeft, IconArrowNarrowRight, IconCalendarDue, IconCalendarWeek, IconChecklist, IconListDetails, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { getMonthFromTerm, getTermFromMonth } from "../../../utils/utils";
import useFetch from "../../../hooks/useFetch";
import { AssessmentData } from "../Assessment";
import { User } from "../../../types/types";
import { ListTease } from "./ListTease";
import { FilterModal } from "./FilterModal";

type TermYear = {
  term: string,
  year: string,
}

type Filters = {
  categories: string[],
  staff: string[],
  courses: string[],
}

type Props = {
  setCaltype: (caltype: string) => void,
}

export function List({setCaltype}: Props) {

  const [searchParams, setSearchParams] = useSearchParams();



  //const filters = useFilterStore((state) => state)
  //const setFilters = useFilterStore((state) => (state.setState))
  //const reset = useFilterStore((state) => (state.reset))

  const defaultFilters: Filters = {
    categories: [],
    staff: [],
    courses: [],
  };
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const resetFilters = () => {
    setFilters(defaultFilters)
  }


  const [loading, {open: startLoading, close: stopLoading}] = useDisclosure(true)

  const [filterOpened, {close: closeFilter, open: openFilter}] = useDisclosure(false)

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

  const [selected, setSelected] = useState<AssessmentData|null>(null)

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

  const getList = async (date: TermYear) => {
    startLoading()
    const res = await getCalendarAPI.call({
      query: {
        methodname: 'local_activities-get_assessments',
        type: 'list',
        term: date.term,
        year: date.year,
      }
    })
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
    //return days;
    const filterStaff = filters.staff.map((u: string) => JSON.parse(u).un)
    return days.map((day: any) => {

      const filteredEvents = day.events.filter((ass: any) => {

        const matchesCourse =
        filters.courses.length === 0 ||
        filters.courses.some((course) => ass.courseid == course.split("|")[0]);

        const matchesCategory =
        filters.categories.length === 0 ||
        filters.categories.some((cat) => ass.course.category == cat.split("|")[0]);

        /*
        const eventCategories = JSON.parse(event.categoriesjson || '[]') as string[];
  
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
        */
  
        const eventStaff = [ass.creator.un]
        const matchesStaff =
          filterStaff.length === 0 || 
          filterStaff.some((staff) => eventStaff.includes(staff));

        return matchesStaff && matchesCourse && matchesCategory;

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
    return filters.categories.length || filters.courses.length || filters.staff.length
  }

  let navigate = useNavigate();

  return (
    <div>

   
        <div className="p-3 w-full flex justify-between items-center">
          <ActionIcon onClick={() => handleNav(-1)} variant="subtle" size="lg"><IconArrowNarrowLeft className="size-7" /></ActionIcon>

          <div className="text-xl font-semibold flex gap-2 items-center">

            <div className="flex mr-4">
              <Button color="dark" variant="light" aria-label="Filters" size="compact-md" leftSection={<IconChecklist size={20} />} className="h-8 rounded-r-none pointer-events-none">Assessments</Button>
              <ActionIcon color="dark" onClick={() => navigate("/")} variant="light" size="compact-md" ml={2} className="rounded-l-none pl-1 pr-1">
                <IconX stroke={1.5} size={18} />
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
              <Button onClick={goToToday} variant="light" aria-label="Filters" className="h-8" size="compact-md">Today</Button>
              { hasFilters() 
                ? <div className="flex">
                    <Button color="orange" onClick={() => openFilter()} variant="light" aria-label="Filters" size="compact-md" leftSection={<IconAdjustments size={20} />} className="h-8 rounded-r-none">Filters on</Button>
                    <ActionIcon color="orange" onClick={resetFilters} variant="light" aria-label="Clear"  size="compact-md" ml={2} className="rounded-l-none pl-1 pr-1">
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
        
        { filteredList.days.current.length
          ? <LoadingOverlay visible={loading} />
          : loading && <div className="p-6"><Loader size="sm" /></div>
        }

        { !loading && !filteredList.days.current.length && !filteredList.days.upcoming.length &&
          <div className="text-base italic p-6">No assessments in selected period. {hasFilters() ? "Try removing filters." : ""}</div>
        }

        <Card className="ev-calendar list-calendar rounded-none" p={0}>

          { !!filteredList.days.current.length &&
            <div className="hidden px-4 py-3">
              <span className="font-semibold text-gray-500 text-sm uppercase tracking-wider">Currently on</span>
            </div>
          }

          { filteredList.days?.current.map((day: any, i: number) => (
            !!day.events.length &&
            <div key={day.date_key} className="ev-calendar-item ev-calendar-item-current">
              { day.date_key == dayjs().format("YYYY-MM-DD")
                ? <Text className="font-semibold text-lg px-4 py-2 border-t">Today, {dayjs.unix(Number(day.date)).format("D MMM YYYY")}</Text>
                : <Text className="font-semibold text-lg px-4 py-2 border-t">Started on {dayjs.unix(Number(day.date)).format("D MMM")}</Text>
              }
              <div>
                {day.events.map((assessment: any) => (
                  <div key={assessment.id}>
                    <ListTease assessment={assessment} setSelected={setSelected}/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card className="ev-calendar list-calendar border-b rounded-none" p={0}>
          { !!filteredList.days.upcoming.length &&
            <div className="hidden px-4 py-3">
              <span className="font-semibold text-gray-500 text-sm uppercase tracking-wider">Upcoming</span>
            </div>
          }

          { filteredList.days.upcoming.map((day: any, i: number) => (
            !!day.events.length &&
            <div key={day.date_key} className="ev-calendar-item ev-calendar-item-current">
              { day.date_key == dayjs().format("YYYY-MM-DD")
                ? <Text className="font-semibold text-lg px-4 py-2 border-t">Today, {dayjs.unix(Number(day.date)).format("D MMM YYYY")}</Text>
                : <Text className="font-semibold text-lg px-4 py-2 border-t">{dayjs.unix(Number(day.date)).format("ddd, D MMM YYYY")}</Text>
              }
              <ul>
              {day.events.map((assessment: any) => (
                  <div key={assessment.id}>
                    <ListTease assessment={assessment} setSelected={setSelected}/>
                  </div>
                ))}
              </ul>
            </div>
          ))}
        </Card>
      </div>

      {filterOpened &&
        <FilterModal opened={true} filters={filters} setFilters={setFilters} close={() => closeFilter()} />
      }


    </div>
  )
}
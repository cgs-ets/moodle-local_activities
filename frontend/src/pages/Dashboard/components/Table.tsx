import { ActionIcon, Button, LoadingOverlay, Select, Table } from "@mantine/core";
import { IconAdjustments, IconArrowNarrowLeft, IconArrowNarrowRight, IconCalendarWeek, IconListDetails, IconSortAscendingLetters, IconSortDescendingLetters, IconTable, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState, useRef } from "react";
import useFetch from "../../../hooks/useFetch";
import { Form } from "../../../stores/formStore";
import { useSearchParams } from "react-router-dom";
import { FilterModal } from "./FilterModal";
import { useDisclosure } from "@mantine/hooks";
import { useFilterStore } from "../../../stores/filterStore";
import { User } from "../../../types/types";
import { getMonthFromTerm, getTermFromMonth, isCalReviewer } from "../../../utils/utils";
import { getConfig, statuses } from "../../../utils";
import { EventModal } from "../../../components/EventModal";
import { TableRow } from "./TableRow";


type TermYear = {
  term: string,
  year: string,
}


type Props = {
  setCaltype: (caltype: string) => void,
}

export function TableView({setCaltype}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useFilterStore((state) => state)
  const setFilters = useFilterStore((state) => (state.setState))
  const reset = useFilterStore((state) => (state.reset))
  const [loading, {open: startLoading, close: stopLoading}] = useDisclosure(true)
  const [filterOpened, {close: closeFilter, open: openFilter}] = useDisclosure(false)
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const getDataAPI = useFetch()
  const [data, setData] = useState<any>({
    data: []
  })
  const [selectedEvent, setSelectedEvent] = useState<Form|null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null);


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
  
  // If search params change, update the date.
  useEffect(() => {
    setDate({
      term: searchParams.get('term') || currterm.toString(), 
      year: searchParams.get('year') || initYear, 
    })
  }, [searchParams]);

  // If the date changes, get calendar.
  useEffect(() => {
    if (date && date.year) {
      getCalendar(date)
    }
  }, [date]);

  const getCalendar = async (date: TermYear) => {
    startLoading()
    const res = await getDataAPI.call({
      query: {
        methodname: 'local_activities-get_cal',
        type: 'table',
        year: date.year,
        term: date.term,
      }
    })
    setData(res.data)
    stopLoading()
  }

  

  const handleNav = (direction: number) => {
    if (direction > 0) {
      setSearchParams(params => {
        params.set("term", data.pagination.next.tm);
        params.set("year", data.pagination.next.yr);
        params.set("month", getMonthFromTerm(data.pagination.next.tm).toString());
        return params;
      });
    } else {
      setSearchParams(params => {
        params.set("term", data.pagination.previous.tm);
        params.set("year", data.pagination.previous.yr);
        params.set("month", getMonthFromTerm(data.pagination.previous.tm).toString());
        return params;
      });
    }
  }

  const handleYearSelect = (year: string | null) => {
    setSearchParams(params => {
      const y = year || dayjs().format("YYYY")
      params.set("year", y);
      params.set("month", getMonthFromTerm(date.term).toString());
      params.set("term", getTermFromMonth('01', y).toString());
      return params;
    });
  }

  const handleTermSelect = (term: string | null) => {
    setSearchParams(params => {
      params.set("year", date.year);
      params.set("term", term || '1');
      params.set("month", getMonthFromTerm(term || '1').toString());
      return params;
    });
  }


  const filteredEvents = useMemo(() => {
    if (!data || !filters) return data;
  
    const filterStaff = filters.staff.map((u: string) => JSON.parse(u).un);
  
    const filtered = data.data.filter((event: any) => {
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
        return event;
      }
    });
  
    if (sortConfig) {
      filtered.sort((a: any, b: any) => {
        const sortKey = `${sortConfig.key}_sort`;
    
        const valA = sortKey in a ? a[sortKey] : a[sortConfig.key];
        const valB = sortKey in b ? b[sortKey] : b[sortConfig.key];
    
        if (valA == null) return 1;
        if (valB == null) return -1;
    
        const aValue = typeof valA === 'string' ? valA.toLowerCase() : valA;
        const bValue = typeof valB === 'string' ? valB.toLowerCase() : valB;
    
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
  
    return filtered;
  }, [filters, data, sortConfig]);
  

  const hasFilters = () => {
    return filters.categories.length || filters.types.length || filters.campus.length || filters.status.length || filters.staff.length || filters.name.length || filters.reviewstep.length
  }

  const handleSort = (key: string) => {
    console.log('Sorting by', key)
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'asc' };
      }
      return {
        key,
        direction: prev.direction === 'asc' ? 'desc' : 'asc',
      };
    });
  };

  type TableHeaderProps = {
    sortKey: string;
    currentSort: { key: string; direction: 'asc' | 'desc' } | null;
    onClick: (key: string) => void;
    children: React.ReactNode;
  };
  
  const TableHeader = ({ sortKey, currentSort, onClick, children }: TableHeaderProps) => (
    <Table.Th 
      className="whitespace-nowrap min-w-max cursor-pointer" 
      onClick={(e) => {
        e.stopPropagation(); // Prevent drag initiation
        onClick(sortKey);
      }}
    >
      {children}
      {currentSort?.key === sortKey && (
        currentSort.direction === "asc" ? 
          <IconSortAscendingLetters className="inline ml-1" size={16} /> : 
          <IconSortDescendingLetters className="inline ml-1" size={16} />
      )}
    </Table.Th>
  );


  return (
    <div>
      <div>
        <div className="fixed top-[54px] left-0 right-0 p-3 w-full flex justify-between items-center bg-white">
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
              value={date.year} 
              onChange={handleYearSelect} 
              className="w-28"
              size="md"
            />

            <div className="ml-2 flex items-center gap-2 ">
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
        <div 
          ref={tableContainerRef}
          className="fixed top-[120px] left-0 right-0 bottom-0 overflow-x-auto min-h-[calc(100vh-120px)]"
        >
          <LoadingOverlay visible={loading} p={100} />
          <Table className="min-w-full bg-white">
          <Table.Thead>
            <Table.Tr className="border-t border-gray-200">
              <TableHeader 
                sortKey="timestart" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Start
              </TableHeader>
              
              <TableHeader 
                sortKey="timeend" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                End
              </TableHeader>
              
              <TableHeader 
                sortKey="timecreated" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Created
              </TableHeader>
              
              <TableHeader 
                sortKey="activityname" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Name
              </TableHeader>
              
              <TableHeader 
                sortKey="status" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Status
              </TableHeader>
              
              <TableHeader 
                sortKey="stepname" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Step
              </TableHeader>
              
              <TableHeader 
                sortKey="activitytype" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Type
              </TableHeader>
              
              <TableHeader 
                sortKey="campus" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Campus
              </TableHeader>
              
              <TableHeader 
                sortKey="location" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Location
              </TableHeader>
              
              <TableHeader 
                sortKey="transport" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Transport
              </TableHeader>
              
              <TableHeader 
                sortKey="cost" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Cost
              </TableHeader>
              
              <TableHeader 
                sortKey="permissions" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Permissions
              </TableHeader>
              
              <TableHeader 
                sortKey="creatorsortname" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Creator
              </TableHeader>
              
              <TableHeader 
                sortKey="staffinchargesortname" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Responsible
              </TableHeader>
              
              {/* Categories doesn't need sorting */}
              <Table.Th className="whitespace-nowrap min-w-max">
                Categories
              </Table.Th>
              
              <TableHeader 
                sortKey="displaypublic" 
                currentSort={sortConfig} 
                onClick={handleSort}
              >
                Public
              </TableHeader>
              
              {isCalReviewer() && (
                <>
                  <TableHeader 
                    sortKey="status" 
                    currentSort={sortConfig} 
                    onClick={handleSort}
                  >
                    Approved
                  </TableHeader>
                  <TableHeader 
                    sortKey="pushpublic" 
                    currentSort={sortConfig} 
                    onClick={handleSort}
                  >
                    Public Now
                  </TableHeader>
                </>
              )}
              <Table.Th className="whitespace-nowrap min-w-max">
                Actions
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
            <Table.Tbody>
              {filteredEvents.map((event: any) => (
                <TableRow key={event.id} event={event} />
              ))}
            </Table.Tbody>
          </Table>
        </div>
        
        <EventModal activity={selectedEvent} close={() => setSelectedEvent(null)} hideOpenButton={!getConfig().roles?.includes("staff")} />

        <FilterModal opened={filterOpened} filters={filters} setFilters={setFilters} close={() => closeFilter()} />
    </div>
  </div>
  )
}
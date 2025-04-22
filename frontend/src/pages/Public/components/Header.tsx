import { Link, useLocation } from "react-router-dom";
import { Avatar, Group, Text, Box, Button, Anchor, ActionIcon, Modal, Loader, Pill } from '@mantine/core';
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { getConfig, statuses } from "../../../utils";
import useFetch from "../../../hooks/useFetch";
import dayjs from "dayjs";
import { cn } from "../../../utils/utils";
import { useEffect, useState } from "react";
import { EventModal } from "../../../components/EventModal";

export function Header() {
  const [searchOpened, setSearchOpened] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [tab, setTab] = useState('future');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const api = useFetch()

  const location = useLocation();

  const search = async () => {
    setSearchLoading(true);
    console.log('Searching...', searchQuery);
    try {
      // Call the search API
      const res = await api.call({
        query: {
          methodname: 'local_activities-search_public',
          query: searchQuery,
        },
      }, getConfig().wwwroot + '/local/activities/service-public.php')

      setSearchResults(res.data);
      
    } catch (error) {
      console.error('Error during search:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce search function
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.length >= 2) {
        search();
      } else {
        setSearchResults([]); // Clear results when query is empty
      }
    }, 500); // Delay in milliseconds

    return () => {
      clearTimeout(handler); // Clear timeout if query changes
    };
  }, [searchQuery]);

  const clearAndCloseSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpened(false);
  }

  const futureEvents = () => {
    // An event is future if it's timestart OR timeend is after the current time
    const sortedResults = searchResults.sort((a: any, b: any) => dayjs.unix(a.timestart).diff(dayjs.unix(b.timestart)));
    return sortedResults.filter((result: any) => dayjs.unix(result.timestart).isAfter(dayjs()) || dayjs.unix(result.timeend).isAfter(dayjs()));
  }

  const pastEvents = () => {
    // An event is past if it's timestart AND timeend are before the current time
    const sortedResults = searchResults.sort((a: any, b: any) => dayjs.unix(b.timestart).diff(dayjs.unix(a.timestart)));
    return sortedResults.filter((result: any) => dayjs.unix(result.timestart).isBefore(dayjs()) && dayjs.unix(result.timeend).isBefore(dayjs()));
  }

  useEffect(() => {
    if (futureEvents().length > 0) {
      setTab('future');
    } else if (pastEvents().length > 0) {
      setTab('past');
    }
  }, [searchResults]);

  return (
  <>
    <Box bg={getConfig().headerbg}>
      <div className="px-6">
        <Group h={54} justify="space-between">
          <Group gap="md">
            <a href="/" className="no-underline">
              <Text className="text-lg font-semibold" c={getConfig().headerfg}>CGS Calendar</Text>
            </a>
          </Group>
          <div className="flex items-center gap-4">

            <ActionIcon
              variant="transparent"
              color="white"
              className="mr-2"
              onClick={() => setSearchOpened(true)}
            >
              <IconSearch size={20} />
            </ActionIcon>

            <Anchor className="text-gray-200 hover:no-underline mr-4 text-md font-normal" href="/">{getConfig().sitename}</Anchor>

            { !location.pathname.includes("/assessment") 
              ? getConfig().roles.includes('staff') && <Anchor href="/local/activities/assessments" className="text-white hover:no-underline mr-4 text-md font-semibold">Assessments</Anchor> 
              : <Anchor href="/local/activities" className="text-white hover:no-underline mr-4 text-md font-semibold">Activities</Anchor>
            }

            { getConfig().roles?.includes('staff') 
              ? location.pathname.includes("/assessment") 
                ? <Button component={Link} to={"/assessment"} size="compact-md" radius="lg" color="blue" leftSection={<IconPlus size={20} />}>Assessment</Button> 
                : <Button component={Link} to={"/new"} size="compact-md" radius="lg" color="blue" leftSection={<IconPlus size={20} />}>Create new</Button> 
              : null
            }
            
          </div>
          
        </Group>
      </div>

      <Modal
        opened={searchOpened} 
        withCloseButton={false}
        onClose={() => clearAndCloseSearch()} 
        size="xl"
        styles={{
          header: {
            borderBottom: '0.0625rem solid #dee2e6',
          },
          title: {
            fontWeight: 600,
          },
          body: {
            padding: 0,
          }
        }}
      >
        <div className="flex border-b border-gray-200 relative">
          <input
            placeholder="Search" 
            className="flex-1 px-4 py-4 outline-none text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ActionIcon variant="transparent" color="gray" className="absolute right-4 top-1/2 -translate-y-1/2" onClick={() => clearAndCloseSearch()}>
            <IconX size={20} />
          </ActionIcon>
        </div>


        {searchLoading && (
          <div className="px-4 h-12 flex items-center">
            <Loader size="sm" />
          </div>
        )}

        {debouncedQuery.length > 2 && searchResults.length == 0 && !searchLoading && (
          <div className="px-4 h-12 flex items-center">
            <Text>No results found</Text>
          </div>
        )}

        {/* Tabs */}
        {!!searchResults.length && !searchLoading && (
          <div className="pl-4 pr-5 h-12 flex items-center">
            <div className="flex gap-2">
              {futureEvents().length > 0 && 
                <Button 
                  radius="xl"
                  variant="outline"
                  size="compact-sm"
                  className={`transition-colors ${tab === 'future' ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-400 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => setTab('future')}
                >
                  <span>Future </span>
                  { futureEvents().length > 0 && !searchLoading && <span className="ml-1">({futureEvents().length})</span>}
                </Button>
              }
              {pastEvents().length > 0 && 
                <Button 
                  radius="xl"
                  variant="outline"
                  size="compact-sm"
                  className={`transition-colors ${tab === 'past' ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-400 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => setTab('past')}
                >
                  <span>Past </span>
                  { pastEvents().length > 0 && !searchLoading && <span className="ml-1">({pastEvents().length})</span>}
                </Button>
              }
            </div>
          </div>
        )}

        {/* Results */}
        {tab == 'future' && futureEvents().length > 0 && (
          <div>
            {futureEvents().map((result: any) => (
              <Anchor href={`/local/activities/${result.id}`} className="!no-underline text-gray-800">
                <div key={result.id} className={cn("px-4 py-2 border-b border-gray-200", result.status == statuses.approved ? "bg-[#d4edda]" : "bg-[#fff5eb]")}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={cn("size-2 rounded-full min-w-2 mt-1", result.status == statuses.approved ? "bg-[#4aa15d]" : "bg-[#ffa94d]")}></div>
                        <Anchor href={`/local/activities/${result.id}`}>{result.activityname}</Anchor>
                        
                      </div>
                      <span className="text-xs">{dayjs.unix(result.timestart).format('DD MMM YY HH:mm')} - {dayjs.unix(result.timeend).format('DD MMM YY HH:mm')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.status < statuses.approved && result.stepname && result.stepname != 'Calendar Approval' && <Pill color="gray.2" className="text-black capitalize">{result.stepname}</Pill>}
                      {result.campus && <Pill className="capitalize">{result.campus}</Pill>}
                      <Pill className="capitalize">{result.activitytype}</Pill>
                      <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + result.staffincharge} />
                    </div>
                  </div>
                </div>
              </Anchor>
            ))}
          </div>
        )}

        {tab == 'past' && pastEvents().length > 0 && (
          <div>
            {pastEvents().map((result: any) => (
              <div className="!no-underline text-gray-800" onClick={() => setSelectedEvent(result)}>
                <div key={result.id} className={cn("px-4 py-2 border-b border-gray-200")}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Anchor className="first-letter:capitalize" onClick={() => setSelectedEvent(result)}>{result.activityname}</Anchor>
                      </div>
                      <span className="text-xs">{dayjs.unix(result.timestart).format('DD MMM YY HH:mm')} - {dayjs.unix(result.timeend).format('DD MMM YY HH:mm')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.campus && <Pill className="capitalize">{result.campus}</Pill>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


      </Modal>

      <EventModal activity={selectedEvent} close={() => setSelectedEvent(null)} isPublic={true} />


      
    </Box>
  </>
  );
}
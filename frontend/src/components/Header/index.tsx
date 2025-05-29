import { Link, useLocation } from "react-router-dom";
import { Avatar, Menu, UnstyledButton, Group, Text, Box, Button, Anchor, ActionIcon, Modal, Pill, Loader, Drawer } from '@mantine/core';
import { IconHome2, IconLogout, IconPlus, IconSearch, IconX, IconMenu, IconExternalLink } from '@tabler/icons-react';
import { useInterval } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { fetchData, getConfig, statuses } from "../../utils";
import useFetch from "../../hooks/useFetch";
import dayjs from "dayjs";
import { cn } from "../../utils/utils";
import { StatusDot } from "../StatusDot";

export function Header() {
  const [searchOpened, setSearchOpened] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [tab, setTab] = useState('future');
  const [menuOpened, setMenuOpened] = useState(false);

  const api = useFetch()

  const checkAuthStatus = async () => {
    const response = await fetchData({
      query: {
        methodname: 'local_activities-check_login',
      }
    })
    if (response.error && (response.exception?.errorcode === 'requireloginerror' || response.errorcode === 'requireloginerror')) {
      window.location.replace(getConfig().loginUrl)
    }
  }
  const interval = useInterval(() => checkAuthStatus(), 30000); // 30 seconds.
  useEffect(() => {
    interval.start();
    return interval.stop;
  }, []);

  const location = useLocation();

  const search = async () => {
    setSearchLoading(true);
    console.log('Searching...', searchQuery);
    try {
      // Call the search API
      const res = await api.call({
        query: {
          methodname: 'local_activities-search',
          query: searchQuery,
        },
      });

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
    <Box bg={getConfig().headerbg} className="fixed w-full left-0 top-0 z-50">
      <div className="px-6">
        <Group h={54} justify="space-between">

          <Group gap="md">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Text className="text-lg font-semibold" c={getConfig().headerfg}>{getConfig().toolname}</Text>
            </Link>
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


            <ActionIcon
              variant="transparent"
              color="white"
              className="mr-2 md:hidden"
              onClick={() => setMenuOpened(true)}
            >
              <IconMenu size={20} />
            </ActionIcon>


            <div className="items-center gap-4 hidden md:flex">
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

            <Menu position="bottom-end" width={200} shadow="md">
              <Menu.Target>
                <UnstyledButton> 
                  <Group>
                    <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + getConfig().user.un} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconHome2 size={14} />} onMouseDown={() => window.location.replace('/')}>{getConfig().sitename}</Menu.Item>
                <Menu.Item leftSection={<IconLogout size={14} />} onMouseDown={() => window.location.replace(getConfig().logoutUrl)}>Logout</Menu.Item>
              </Menu.Dropdown>
            </Menu>

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
                        <StatusDot status={result.status} />
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
              <Anchor href={`/local/activities/${result.id}`} className="!no-underline text-gray-800">
                <div key={result.id} className={cn("px-4 py-2 border-b border-gray-200", result.status == statuses.approved ? "bg-[#d4edda]" : "bg-[#fff5eb]")}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusDot status={result.status} />
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


      </Modal>



      <Drawer position="right" opened={menuOpened} onClose={() => setMenuOpened(false)}>
        <div className="flex flex-col gap-4">
          <Anchor className="hover:no-underline mr-4 text-md font-normal flex items-center gap-1" href="/">{getConfig().sitename} <IconExternalLink size={13} /></Anchor>
          { !location.pathname.includes("/assessment") 
            ? getConfig().roles.includes('staff') && <Anchor href="/local/activities/assessments" className="hover:no-underline mr-4 text-md font-semibold">Assessments</Anchor> 
            : <Anchor href="/local/activities" className="hover:no-underline mr-4 text-md font-semibold">Activities</Anchor>
          }
          { getConfig().roles?.includes('staff') 
            ? location.pathname.includes("/assessment") 
              ? <Button component={Link} to={"/assessment"} size="md" radius="lg" color="blue" leftSection={<IconPlus size={20} />}>Assessment</Button> 
              : <Button component={Link} to={"/new"} size="md" radius="lg" color="blue" leftSection={<IconPlus size={20} />}>Create activity</Button> 
            : null
          }
        </div>
      </Drawer>

          
      
    </Box>
    <div className="h-[54px]"></div>
  </>
  );
}
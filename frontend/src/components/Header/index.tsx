import { Link, useLocation } from "react-router-dom";
import { Container, Avatar, Menu, UnstyledButton, Group, Text, Box, Button, Anchor, ActionIcon, Modal, TextInput, Input, Table, Badge, Pill, Loader } from '@mantine/core';
import { IconCalendarPlus, IconExternalLink, IconHome2, IconLogout, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { useInterval } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { fetchData, getConfig, statuses } from "../../utils";
import useFetch from "../../hooks/useFetch";
import dayjs from "dayjs";
import { cn } from "../../utils/utils";

export function Header() {
  const [searchOpened, setSearchOpened] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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

  return (
  <>
    <Box bg={getConfig().headerbg}>
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

            <Anchor className="text-gray-200 hover:no-underline mr-4 text-md font-normal" href="/">{getConfig().sitename}</Anchor>

            { !location.pathname.includes("/assessment") 
              ? <Anchor href="/local/activities/assessments" className="text-white hover:no-underline mr-4 text-md font-semibold">Assessments</Anchor>
              : <Anchor href="/local/activities" className="text-white hover:no-underline mr-4 text-md font-semibold">Activities</Anchor>
            }

            { getConfig().roles?.includes('staff') 
              ? location.pathname.includes("/assessment") 
                ? <Button component={Link} to={"/assessment"} size="compact-md" radius="lg" color="blue" leftSection={<IconPlus size={20} />}>Assessment</Button> 
                : <Button component={Link} to={"/new"} size="compact-md" radius="lg" color="blue" leftSection={<IconPlus size={20} />}>Create new</Button> 
              : null
            }
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
          {searchResults.length && searchLoading ? (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader size="sm" />
            </div>
          ) : (
            <ActionIcon variant="transparent" color="gray" className="absolute right-4 top-1/2 -translate-y-1/2" onClick={() => clearAndCloseSearch()}>
              <IconX size={20} />
            </ActionIcon>
          )}
        </div>
        {!searchResults.length && searchLoading && (
          <div className="p-4 text-center">
            <Loader />
          </div>
        )}
        {searchResults.length > 0 && (
          <div>
            {searchResults.map((result: any) => (
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
      </Modal>

          
      
    </Box>
  </>
  );
}
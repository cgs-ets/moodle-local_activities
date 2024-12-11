import { Link } from "react-router-dom";
import { Container, Avatar, Menu, UnstyledButton, Group, Text, Box, Button } from '@mantine/core';
import { IconCalendarPlus, IconHome2, IconLogout, IconPlus } from '@tabler/icons-react';
import { useInterval } from "@mantine/hooks";
import { useEffect } from "react";
import { fetchData, getConfig } from "../../utils";

export function Header() {

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

  return (
  <>
    <Box bg={getConfig().headerbg}>
      <Container size="xl">
        <Group h={54} justify="space-between">
          <Group gap="md">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Text className="text-lg" c={getConfig().headerfg}>{getConfig().toolname}</Text>
            </Link>
          </Group>
          <div className="flex items-center gap-4">
            { getConfig().roles.includes('staff') 
              ? <Button component={Link} to="/new" size="compact-md" radius="lg" color="blue" leftSection={<IconCalendarPlus size={14} />}>Create new</Button> : null
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
                <Menu.Item leftSection={<IconHome2 size={14} />} onMouseDown={() => window.location.replace('/')}>CGS Connect</Menu.Item>
                <Menu.Item leftSection={<IconLogout size={14} />} onMouseDown={() => window.location.replace(getConfig().logoutUrl)}>Logout</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
          
        </Group>
      </Container>
      {getConfig().headerlogourl &&
        <div className="hidden 3xl:block absolute right-0 top-0 w-[170px]">
          <a href="/"><img className="w-full" src={getConfig().headerlogourl} /></a>
        </div>
      }
    </Box>
  </>
  );
}
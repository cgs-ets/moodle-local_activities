import { Link } from "react-router-dom";
import { Container, Avatar, Menu, UnstyledButton, Group, Text, Box, Button, Anchor } from '@mantine/core';
import { IconCalendarPlus, IconExternalLink, IconHome2, IconLogout, IconPlus } from '@tabler/icons-react';
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
      <div className="px-6">
        <Group h={54} justify="space-between">
          <Group gap="md">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Text className="text-lg font-semibold" c={getConfig().headerfg}>{getConfig().toolname}</Text>
            </Link>
          </Group>
          <div className="flex items-center gap-4">
            <Anchor className="text-white hover:no-underline mr-4 text-md font-normal" href="/local/activities/assessments">Assessments</Anchor>
            <Anchor className="text-white hover:no-underline mr-4 text-md font-normal" href="/">{getConfig().sitename}</Anchor>
            { getConfig().roles.includes('staff') 
              ? <Button component={Link} to="/new" size="compact-md" radius="lg" color="blue" leftSection={<IconPlus size={20} />}>Create new</Button> : null
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
      {false && getConfig().headerlogourl &&
        <div className="hidden 3xl:block absolute left-0 top-0 h-[54px]">
          <a href="/"><img className="h-full" src={getConfig().headerlogourl} /></a>
        </div>
      }
    </Box>
  </>
  );
}
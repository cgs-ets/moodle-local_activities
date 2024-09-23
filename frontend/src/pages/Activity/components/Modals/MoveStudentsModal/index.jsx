
import { Box, Button, Flex, Modal, Tabs } from '@mantine/core';
import { useState } from 'react';
import { ActivitySearch } from '/src/components/ActivitySearch';
import { ActivityBrowser } from '/src/components/ActivityBrowser';
import { IconCheck, IconFolderSymlink, IconFolderUp, IconPlus, IconSearch } from '@tabler/icons-react';

export function MoveStudentsModal({opened, close, category, callback}) {

  const [moveToActivity, setMoveToActivity] = useState(null)

  const moveAndClose = () => {
    callback(moveToActivity)
    setMoveToActivity(null)
    close()
  }

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Select a activity" 
      size="xl"
      styles={{
        content: {
          overflowY: 'visible !important',
        },
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        }
      }}
      >
        <Box pt="md">
          <Tabs defaultValue="search"  orientation="vertical">
            <Tabs.List>
              <Tabs.Tab value="search" icon={<IconSearch size="0.8rem" />}>Search</Tabs.Tab>
              <Tabs.Tab value="browse" icon={<IconFolderSymlink size="0.8rem" />}>Browse</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="search" px="md" pb="md" mih={150}>
              <ActivitySearch callback={setMoveToActivity} />
            </Tabs.Panel>
            <Tabs.Panel value="browse" px="md" pb="md" mih={150}>
              <ActivityBrowser category={opened ? category : null} callback={setMoveToActivity} />
            </Tabs.Panel>
          </Tabs>
          <Flex pt="sm" justify="end">
            <Button onClick={moveAndClose} disabled={!moveToActivity} type="submit" leftIcon={<IconCheck size="1rem" />} radius="xl" >Move to this activity</Button>
          </Flex>
        </Box>
    </Modal>
  );
};
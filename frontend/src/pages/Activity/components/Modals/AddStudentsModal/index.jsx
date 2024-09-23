
import { Box, Button, Flex, Modal, Tabs } from '@mantine/core';
import { useState } from 'react';
import { StudentSelector } from '/src/components/StudentSelector';
import { ActivityBrowser } from '/src/components/ActivityBrowser/index.jsx';
import { IconShirtSport, IconUser, IconUsersPlus } from '@tabler/icons-react';
import { fetchData } from '/src/utils';

export function AddStudentsModal({opened, close, insert}) {
  const [students, setStudents] = useState([]);
  const [activity, setActivity] = useState(0);

  const insertAndClose = async () => {
    let studentObjects = [];
    if (activity.length) {
      const response = await fetchData({
        query: {
          methodname: 'local_activities-get_activity_students',
          id: JSON.parse(activity).id,
        }
      })
      studentObjects = response.data
    } else {
      studentObjects = students.map(student => JSON.parse(student))
    }
    insert(studentObjects)
    setStudents([])
    close()
  }

  const handleActivitySelect = (value) => {
    setStudents([]) // Clear students
    setActivity(value)
  }

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Add students" 
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
          <Tabs defaultValue="students"  orientation="vertical">
            <Tabs.List>
              <Tabs.Tab value="students" icon={<IconUser size="0.8rem" />}>Individuals</Tabs.Tab>
              <Tabs.Tab value="activities" icon={<IconShirtSport size="0.8rem" />}>activities</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="students" px="md" pb="md" mih={150}>
              <StudentSelector students={students} setStudents={setStudents} />
            </Tabs.Panel>
            <Tabs.Panel value="activities" px="md" pb="md" mih={150}>
              <ActivityBrowser category={-1} callback={handleActivitySelect} showCheckbox={true} />
            </Tabs.Panel>
          </Tabs>
          <Flex pt="sm" justify="end">
            <Button onClick={insertAndClose} disabled={!students.length && !activity} type="submit" leftIcon={<IconUsersPlus size="1rem" />} radius="xl" >Insert students</Button>
          </Flex>
        </Box>
    </Modal>
  );
};
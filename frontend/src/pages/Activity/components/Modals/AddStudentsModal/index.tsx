
import { Box, Button, Flex, Modal, Tabs } from '@mantine/core';
import { useState } from 'react';
import { IconShirtSport, IconUser, IconUsersPlus } from '@tabler/icons-react';
import { User } from '../../../../../types/types';
import { StudentSelector } from '../../../../../components/StudentSelector';

type Props = {
  opened: boolean,
  close: () => void,
  insert: (students: User[]) => void,
}

export function AddStudentsModal({opened, close, insert}: Props) {
  const [students, setStudents] = useState<User[]>([]);

  const insertAndClose = async () => {
    let studentObjects = [] as User[];

    /* 
    if (course has been selected) {
      const response = await fetchData({
        query: {
          methodname: 'local_activities-get_activity_students',
          id: JSON.parse(activity).id,
        }
      })
      studentObjects = response.data
    } else {
      
    }
    */
    if (students.length) {
      studentObjects = students
    }
    insert(studentObjects)
    setStudents([])
    close()
  }



  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Add students" 
      size="xl"
      styles={{
        content: {
          overflowY: 'visible',
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
          <Tabs defaultValue="courses"  orientation="vertical">
            <Tabs.List>
              <Tabs.Tab value="courses" leftSection={<IconShirtSport size="0.8rem" />}>Courses</Tabs.Tab>
              <Tabs.Tab value="groups" leftSection={<IconShirtSport size="0.8rem" />}>Groups</Tabs.Tab>
              <Tabs.Tab value="students" leftSection={<IconUser size="0.8rem" />}>Individuals</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="courses" px="md" pb="md" mih={150}>
              <div>addsadasdas</div>
            </Tabs.Panel>
            <Tabs.Panel value="students" px="md" pb="md" mih={150}>
              <StudentSelector students={students} setStudents={setStudents} />
            </Tabs.Panel>
          </Tabs>
          <Flex pt="sm" justify="end">
            <Button onClick={insertAndClose} disabled={!students.length} type="submit" leftSection={<IconUsersPlus size="1rem" />} radius="xl" >Insert students</Button>
          </Flex>
        </Box>
    </Modal>
  );
};
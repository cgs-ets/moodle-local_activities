
import { Box, Button, Flex, Modal, ScrollArea, Tabs } from '@mantine/core';
import { useState } from 'react';
import { IconSchool, IconTag, IconUser, IconUsers, IconUsersPlus } from '@tabler/icons-react';
import { Student, User } from '../../../../../types/types';
import { StudentSelector } from '../../../../../components/StudentSelector';
import { CourseBrowser } from '../../../../../components/CourseBrowser';
import { fetchData } from '../../../../../utils';
import { GroupsBrowser } from '../../../../../components/GroupsBrowser';
import { TagListSelector } from '../../../../../components/TagListSelector';

type Props = {
  opened: boolean,
  close: () => void,
  insert: (students: Student[]) => void,
}

export function AddStudentsModal({opened, close, insert}: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [selectedTaglist, setSelectedTaglist] = useState<number>(0);

  const insertAndClose = async () => {
    let studentObjects = [] as Student[];
    if (selectedCourses.length) {
      const response = await fetchData({
        query: {
          methodname: 'local_activities-get_courses_students',
          ids: selectedCourses,
        }
      })
      studentObjects = response.data
    } 
    else if (selectedGroups.length) {
      const response = await fetchData({
        query: {
          methodname: 'local_activities-get_group_students',
          ids: selectedGroups,
        }
      })
      studentObjects = response.data
    }
    else if (students.length) {
      studentObjects = students
    }
    insert(studentObjects)
    setStudents([])
    setSelectedCourses([])
    setSelectedGroups([])
    setSelectedTaglist(0)
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
          //overflowY: 'visible',
          overflow: 'hidden',
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
              <Tabs.Tab value="students" leftSection={<IconUser size="0.8rem" />}>Individuals</Tabs.Tab>
              <Tabs.Tab value="courses" leftSection={<IconSchool size="0.8rem" />}>Courses</Tabs.Tab>
              <Tabs.Tab value="groups" leftSection={<IconUsers size="0.8rem" />}>Groups</Tabs.Tab>
              <Tabs.Tab value="taglist" leftSection={<IconTag size="0.8rem" />}>Taglist</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="students" px="md" pb="md" mih={150}>
              <StudentSelector students={students} setStudents={setStudents} />
            </Tabs.Panel>
            <Tabs.Panel value="courses" px="md" pb="md" mih={150}>
              <CourseBrowser selectedIds={selectedCourses} setSelectedIds={setSelectedCourses}/>
            </Tabs.Panel>
            <Tabs.Panel value="groups" px="md" pb="md" mih={150}>
              <GroupsBrowser selectedIds={selectedGroups} setSelectedIds={setSelectedGroups}/>
            </Tabs.Panel>
            <Tabs.Panel value="taglist" px="md" pb="md" mih={150}>
              <TagListSelector selectedId={selectedTaglist} setSelectedId={setSelectedTaglist}/>
            </Tabs.Panel>
          </Tabs>
          <Flex pt="sm" justify="end">
            <Button onClick={insertAndClose} disabled={!students.length && !selectedCourses.length && !selectedGroups.length} type="submit" leftSection={<IconUsersPlus size="1rem" />} radius="xl" >Insert students</Button>
          </Flex>
        </Box>
    </Modal>
  );
};
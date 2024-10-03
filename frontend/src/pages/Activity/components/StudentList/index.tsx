import { Card, Flex, Group, Text, Button, Loader, Center, Tooltip, MantineTheme } from '@mantine/core';
import { IconPlus, IconMinus, IconMail, IconArrowBounce } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { MantineReactTable } from 'mantine-react-table';
import { useParams } from 'react-router-dom';
import { statuses } from '../../../../utils';
import { studentColumn } from './columns';
import { AddStudentsModal } from '../Modals/AddStudentsModal';
import { useDisclosure } from '@mantine/hooks';
import { SendMessageModal } from '../../../../components/SendMessageModal';
import { useStudentListStore } from '../../../../stores/formStore';
import { useFormMetaStore } from '../../../../stores/metaStore';
import { useStateStore } from '../../../../stores/stateStore';
import { useAjax } from '../../../../hooks/useAjax';
import { User } from '../../../../types/types';

type Props = {
  reload: boolean
}

export function StudentList({reload}: Props) {
  let { id } = useParams();

  const status = useFormMetaStore((state) => state.status)
  const studentListStore = useStudentListStore()
  const studentsLoaded = useStateStore((state) => (state.setStudentsLoaded))
  const baselineHash = useStateStore((state) => (state.baselineHash))
  const haschanges = useStateStore((state) => (state.haschanges))

  const [isOpenAddStudentsModal, addStudentsModalHandlers] = useDisclosure(false)
  const [isOpenMessageModal, messageModalHandlers] = useDisclosure(false);
  
  const [fetchResponse, fetchError, fetchLoading, fetchAjax] = useAjax(); // destructure state and fetch function
  useEffect(() => {
    if (id) {
      // Only load once.
      if (!reload && fetchResponse && !fetchError) {
        return
      }
      // Fetch student list for this activity.
      fetchAjax({
        query: {
          methodname: 'local_activities-get_activity_students',
          id: id,
        }
      })
    }
  }, [reload])

  useEffect(() => { 
    if (fetchResponse && !fetchError) {
      const usernames = fetchResponse.data.map((student: User) => (student.un))
      studentListStore.setState({data: fetchResponse.data, usernames: usernames})
      baselineHash()
      studentsLoaded()
    }
  }, [fetchResponse]);

  const insertStudents = (students: User[]) => {
    // Deduplicate.
    const newStudents = students.filter(student => !studentListStore.usernames.includes(student.un))

    // Merge usernames.
    const newusernames = newStudents.map(student => student.un)

    // Merge data.
    const newStudentData = newStudents.map((student) => {
      return {
        ...student,
        attributes: [],
      }
    })

    studentListStore.setState({data: studentListStore.data.concat(newStudentData), usernames: studentListStore.usernames.concat(newusernames)})
  }

  const removeStudents = () => {
    const selectedUsernames = Object.keys(rowSelection)

    const filteredUsernames = studentListStore.usernames.filter(username => !selectedUsernames.includes(username))

    const filteredData = studentListStore.data.filter(udata => !selectedUsernames.includes(udata.un))
    studentListStore.setState({data: filteredData, usernames: filteredUsernames})

    setRowSelection({})
  }

  const columns = useMemo(() => ([studentColumn()]), [])
  const [rowSelection, setRowSelection] = useState({});

  return (
    <>
      <Card withBorder radius="sm" mb="lg" className="p-0">

        <div className="px-4 py-3">
          <Group justify="space-between">
            <Text fz="md" w={500}>Students</Text>
              <Text c='dimmed'> {
                Object.keys(rowSelection).length
                ? Object.keys(rowSelection).length + ' selected'
                : studentListStore.data?.length + ' students'
              } </Text>
          </Group>
        </div>
        
        { fetchLoading 
          ? <div className="border-t border-gray-300 py-4"><Center><Loader size="sm" /></Center></div>
          : (
            studentListStore.data?.length == 0 
            ? <div className="p-4 border-t border-gray-300">
                <Button onClick={addStudentsModalHandlers.open} variant="filled" radius="xl" leftSection={<IconPlus size={14} />} >Add students</Button>
              </div>
            : <>
                <div className="border-t border-gray-300">
                  <MantineReactTable
                    columns={columns}
                    data={studentListStore.data}

                    enableRowSelection
                    //clicking anywhere on the row will select it
                    mantineTableBodyRowProps={({ row }) => ({
                      onClick: row.getToggleSelectedHandler(),
                      style: { cursor: 'pointer' },
                    })}

                    getRowId={(row) => row.un} //give each row a more useful id
                    onRowSelectionChange={setRowSelection} //connect internal row selection state to your own
                    state={{ rowSelection }} //pass our managed row selection state to the table to use
                    initialState={{ density: 'xs' }}
                    displayColumnDefOptions={{ 'mrt-row-select': { size: 30 } }} //change width of select column to 30px
                    enableColumnActions={false}
                    enableColumnFilters={false}
                    enablePagination={false}
                    enableSorting={false}
                    enableBottomToolbar={false}
                    enableTopToolbar={false}
                    mantinePaperProps={{
                      withBorder: false,
                      shadow: undefined,
                    }}
                    mantineTableProps={{
                      highlightOnHover: false,
                      withColumnBorders: false,
                      horizontalSpacing: 'md',
                      verticalSpacing: 'xs',
                      className: 'student-list-table',
                    }}

                    mantineTableHeadCellProps={{
                      style: {
                        backgroundColor: '#f8f9fa',
                        textTransform: 'none',
                        letterSpacing: 0,
                        fontWeight: '500!important',
                        fontSize: '0.875rem',
                        color: '#000!important',
                      },
                      className: 'student-list-table-headcell',
                    }}

                    mantineSelectAllCheckboxProps={{
                      size: "xs",
                    }}

                    mantineSelectCheckboxProps={{
                      size: "xs",
                    }}
                  />
                </div>

                <div className="p-4">
                  <Group justify="space-between">
                    <Flex gap="sm">
                      <Button onClick={addStudentsModalHandlers.open} size="compact-sm" variant="light" radius="xl" leftSection={<IconPlus size={14} />} >Add students</Button>
                      { Object.keys(rowSelection).length > 0 && 
                        <>
                          <Button onClick={removeStudents} variant="light" size="compact-sm" radius="xl" leftSection={<IconMinus size={14} />}>Remove</Button>
                        </>
                      }
                    </Flex>
                    { status == statuses.approved &&
                      <Tooltip.Floating disabled={!haschanges} label="You must save changes before you may send messages.">
                        <Button variant="filled" color={haschanges ? "gray.4" : undefined} onClick={() => (haschanges ? null : messageModalHandlers.open())} size="compact-sm" radius="xl" leftSection={<IconMail size={14} />}>Send a message</Button>
                      </Tooltip.Floating>
                    }
                  </Group>
                </div>
              </>
          )
        }
      </Card>
      <AddStudentsModal opened={isOpenAddStudentsModal} close={addStudentsModalHandlers.close} insert={insertStudents} />
      <SendMessageModal
        students={
          Object.keys(rowSelection).length 
          ? studentListStore.data.filter(s => Object.keys(rowSelection).includes(s.un))
          : studentListStore.data
        } 
        activityid={id}
        opened={isOpenMessageModal} close={messageModalHandlers.close} />

    </>
  );
};
import { Card, Flex, Group, Text, Button, Tooltip } from '@mantine/core';
import { IconPlus, IconMinus, IconMail } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { MantineReactTable } from 'mantine-react-table';
import { statuses } from '../../../../utils';
import { studentColumn } from './columns';
import { AddStudentsModal } from '../Modals/AddStudentsModal';
import { useDisclosure } from '@mantine/hooks';
import { useStateStore } from '../../../../stores/stateStore';
import { User } from '../../../../types/types';
import { showExcursionFields } from '../../../../utils/utils';
import { Form, useFormStore } from '../../../../stores/formStore';


export function StudentList() {

  const status = useFormStore((state) => state.status)
  const studentlist = useFormStore((state) => state.studentlist) 
  const setState = useFormStore(state => state.setState)
  const haschanges = useStateStore((state) => (state.haschanges))

  const [isOpenAddStudentsModal, addStudentsModalHandlers] = useDisclosure(false)

  const insertStudents = (students: User[]) => {
    // Deduplicate.
    const newStudents = students.filter(student => !studentlist.map(u => u.username).includes(student.un))

    setState({['studentlist']: newStudents} as Form)
  }

  const removeStudents = () => {
    const selectedUsernames = Object.keys(rowSelection)

    const filtered = studentlist.filter(u => !selectedUsernames.includes(u.un))
    setState({['studentlist']: filtered} as Form)

    setRowSelection({})
  }

  const columns = useMemo(() => ([studentColumn()]), [])
  const [rowSelection, setRowSelection] = useState({});

  return (
    showExcursionFields() 
    ? <div>
        <Card withBorder radius="sm" mb="lg" className="p-0">
          <div className="px-4 py-3">
            <Group justify="space-between">
              <Text fz="md">Students</Text>
                <Text c='dimmed'> {
                  Object.keys(rowSelection).length
                  ? Object.keys(rowSelection).length + ' selected'
                  : studentlist?.length + ' students'
                } </Text>
            </Group>
          </div>
          
          {studentlist?.length == 0 
              ? <div className="p-4 border-t border-gray-300">
                  <Button onClick={addStudentsModalHandlers.open} variant="filled" radius="xl" leftSection={<IconPlus size={14} />} >Add students</Button>
                </div>
              : <>
                  <div className="border-t border-gray-300">
                    <MantineReactTable
                      columns={columns}
                      data={studentlist}

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
                          <Button variant="filled" color={haschanges ? "gray.4" : undefined} onClick={() => (haschanges ? null : null)} size="compact-sm" radius="xl" leftSection={<IconMail size={14} />}>Send a message</Button>
                        </Tooltip.Floating>
                      }
                    </Group>
                  </div>
                </>
          }
        </Card>
        <AddStudentsModal opened={isOpenAddStudentsModal} close={addStudentsModalHandlers.close} insert={insertStudents} />
        

      </div>
    : null
  );
};
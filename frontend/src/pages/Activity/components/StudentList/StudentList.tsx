import { Card, Flex, Group, Text, Button, Tooltip, Chip, Loader } from '@mantine/core';
import { IconPlus, IconMinus, IconMail, IconChecks } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { MantineReactTable } from 'mantine-react-table';
import { statuses } from '../../../../utils';
import { parentColumn, studentColumn } from './columns';
import { AddStudentsModal } from '../Modals/AddStudentsModal';
import { useDisclosure } from '@mantine/hooks';
import { useStateStore } from '../../../../stores/stateStore';
import { User } from '../../../../types/types';
import { Form, useFormStore } from '../../../../stores/formStore';
import { isExcursion } from '../../../../utils/utils';
import { useAjax } from '../../../../hooks/useAjax';
import { PermissionsEmailModal } from '../PermissionsEmailModal/PermissionsEmailModal';
import { EmailModal } from '../EmailModal/EmailModal';


export function StudentList() {

  const status = useFormStore((state) => state.status)
  const studentlist = useFormStore((state) => state.studentlist) 
  const setState = useFormStore(state => state.setState)
  const haschanges = useStateStore((state) => (state.haschanges))
  const setStudentsLoaded = useStateStore((state) => (state.setStudentsLoaded))
  const id = useFormStore((state) => (state.id))
  const activitytype = useFormStore((state) => (state.activitytype))
  const permissionsrequired = useFormStore((state) => (state.permissions))
  const [isOpenAddStudentsModal, addStudentsModalHandlers] = useDisclosure(false)
  const [isOpenMessageModal, messageModalHandlers] = useDisclosure(false);


  const [fetchResponse, fetchError, fetchLoading, fetchAjax] = useAjax(); // destructure state and fetch function
  useEffect(() => {
    if (id) {
      // Only load once. If the user changes permissions value, they will need to save to refresh.
      if (fetchResponse && !fetchError) {
        console.log("Save changes to refresh the student list")
        return
      }
      // Fetch student list for this activity.
      fetchAjax({
        query: {
          methodname: 'local_activities-get_students',
          id: id,
          withpermissions: true,
        }
      })
    }
  }, [id])

  useEffect(() => { 
    if (fetchResponse && !fetchError) {
      setState({['studentlist']: fetchResponse.data} as Form)
      setStudentsLoaded()
      console.log("stulist", fetchResponse.data)
    }
  }, [fetchResponse]);






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
  
  const showPermissions = permissionsrequired && status == statuses.approved;
  const columns = useMemo(
    () => (showPermissions
          ? [studentColumn(showPermissions), parentColumn]
          : [studentColumn(showPermissions)]),
    [showPermissions]
  )

  const [rowSelection, setRowSelection] = useState({});
  /*useEffect(() => {
    console.info("rowSelection", rowSelection);
  }, [rowSelection]);*/



  //const allFilters = ['all', 'granted', 'denied', 'noresponse'];
  const [listFilter, setListFilter] = useState<string>('all');
  const handleFilterChange = (val: string) => { 
    setListFilter(val)
    setRowSelection({})
  }
  const resetFilters = () => {
    setListFilter('all');
  }

  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  useEffect(() => {
    //console.log("studentlist", studentlist)
    //filter students when filters change.
    const filtered = studentlist.filter((student) => {
      return (
        !permissionsrequired ||
         listFilter.includes('all') || 
        (listFilter.includes('noresponse') && student.permission < 1) || 
        (listFilter.includes('granted') && student.permission == 1) ||
        (listFilter.includes('denied') && student.permission == 2)
      )
    })
    setFilteredStudents(filtered)
  }, [listFilter, studentlist, permissionsrequired])


  return (
    isExcursion(activitytype)
    ? <>
        <Card withBorder radius="sm" className="p-0">
          <div className="px-4 py-3">
            <Group justify="space-between">
              <Text fz="md">Students</Text>
                {!permissionsrequired &&
                  <Text c='dimmed'> 
                    { 
                      Object.keys(rowSelection).length
                      ? Object.keys(rowSelection).length + ' selected'
                      : filteredStudents?.length + ' students'
                    } 
                  </Text>
                }
            </Group>
          </div>

          { fetchLoading 
            ? <div className="p-4 border-t border-gray-300"><Loader size="sm" /></div>
            : (
                studentlist?.length == 0 
                  ? <div className="p-4 border-t border-gray-300">
                      <Button onClick={addStudentsModalHandlers.open} size="compact-md" radius="xl" leftSection={<IconPlus size={14} />} >Add students</Button>
                    </div>
                  : <>


                      { permissionsrequired &&
                        <div className="border-t border-gray-300 px-4 py-1">
                          <div className='flex justify-between items-center'>
                            <Text c='dimmed'> 
                              {
                                Object.keys(rowSelection).length
                                ? Object.keys(rowSelection).length + ' selected'
                                : filteredStudents?.length + ' students'
                              } 
                            </Text>
                            <div className='text-center flex gap-2 items-center'>
                              { 
                                listFilter.length < 3 
                                ? <button onClick={resetFilters} className="cursor-pointer"><IconChecks size="1rem" /></button>
                                : '' 
                              }
                              <Chip.Group 
                                multiple={false}
                                value={listFilter} 
                                onChange={handleFilterChange}
                                >
                                <Group>
                                  <Chip value="all" variant="light" size="xs">All</Chip>
                                  <Chip value="granted" variant="light" size="xs" color="apprgreen" checked={listFilter == 'all'}>Granted</Chip>
                                  <Chip value="denied" variant="light" size="xs" color="red" checked={listFilter == 'all'}>Denied</Chip>
                                  <Chip value="noresponse" variant="light" size="xs" color="orange" checked={listFilter == 'all'}>No resopnse</Chip>
                                </Group>
                              </Chip.Group>
                            </div>
                          </div>
                        </div>
                      }




                      <div className="border-t border-gray-300">
                        <MantineReactTable
                          columns={columns}
                          data={filteredStudents}

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
                            className: 'student-list-table' + ' showpermissions-' + showPermissions,
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
        <EmailModal
          students={
            !!Object.keys(rowSelection).length 
            ? studentlist.filter(s => Object.keys(rowSelection).includes(s.un))
            : !!studentlist.length ? studentlist : []
          } 
          opened={isOpenMessageModal} close={messageModalHandlers.close} />
      </>
    : null
  );
};
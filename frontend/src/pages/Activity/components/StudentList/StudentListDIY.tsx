import { Card, Flex, Group, Text, Button, Tooltip, Chip, Loader, Table, Checkbox } from '@mantine/core';
import { IconPlus, IconMinus, IconMail, IconChecks, IconReport } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { MantineReactTable } from 'mantine-react-table';
import { statuses } from '../../../../utils';
import { parentColumn, studentColumn } from './columns';
import { AddStudentsModal } from '../Modals/AddStudentsModal';
import { useDisclosure } from '@mantine/hooks';
import { useStateStore } from '../../../../stores/stateStore';
import { Student, User } from '../../../../types/types';
import { Form, useFormStore } from '../../../../stores/formStore';
import { cn, isActivity } from '../../../../utils/utils';
import { useAjax } from '../../../../hooks/useAjax';
import { EmailModal } from '../EmailModal/EmailModal';
import { StuListReports } from './StuListReports';


export function StudentListDIY() {

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
  const [isOpenReports, {close: closeReports, open: openReports}] = useDisclosure(false);
  const savedtime = useStateStore((state) => (state.savedtime))
  const viewStateProps = useStateStore((state) => (state.viewStateProps))
  const [rowSelection, setRowSelection] = useState({});


  const [fetchResponse, fetchError, fetchLoading, fetchAjax] = useAjax(); // destructure state and fetch function
  useEffect(() => {
    if (id) {
      console.log("get student list")
      // Fetch student list for this activity.
      fetchAjax({
        query: {
          methodname: 'local_activities-get_students',
          id: id,
          withpermissions: true,
        }
      })
    }
  }, [id, savedtime])

  useEffect(() => { 
    if (fetchResponse && !fetchError) {
      setState({['studentlist']: fetchResponse.data} as Form)
      setStudentsLoaded()
    }
  }, [fetchResponse]);


  const insertStudents = (students: User[]) => {
    // Deduplicate.
    const newStudents = students.filter(student => !studentlist.map(u => u.un).includes(student.un))
    console.log('existing', studentlist)
    console.log('new students', newStudents)
    setState({['studentlist']: [...studentlist, ...newStudents]} as Form)
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

  const handleStudentSelect = (student: Student) => {
    console.log("student", student)
    setRowSelection((current: {[key: string]: any}) => {
      if (Object.keys(current).includes(student.un)) {
        const { [student.un]: _, ...rest } = current; // Destructure the property to remove and use the rest operator to get the remaining properties
        return rest
      } else {
        return {...current, [student.un]: true}
      }
    })
  }
  /*useEffect(() => {
    console.info("rowSelection", rowSelection);
  }, [rowSelection]);*/

  const allSelected = () => {
    return Object.keys(rowSelection).length == filteredStudents.length
  }
  const someSelected = () => {
    return !!Object.keys(rowSelection).length && !allSelected()
  }
  const deselectAll = () => {
    setRowSelection({})
  }
  const selectAll = () => {
    setRowSelection(
      filteredStudents.reduce((acc, item) => {
        acc[item.un] = true;
        return acc;
      }, {})
    )
  }
  const handleGlobalAction = (s: boolean) => {
    console.log(s)
    if (allSelected()) {
      deselectAll()
    } else {
      selectAll()
    }
  }


  return (
    isActivity(activitytype)
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
                  ? viewStateProps.editable 
                    ? <div className="p-4 border-t border-gray-300">
                        <Button onClick={addStudentsModalHandlers.open} size="compact-md" radius="xl" leftSection={<IconPlus size={14} />} >Add students</Button>
                      </div>
                    : <div className="p-4 border-t border-gray-300 italic">No students</div>
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

                        {/* Table Header */}
                        <div>
                          <div className='flex h-11 items-center bg-[#f8f9fa] border-b ps-4'>
                            <div className='w-12'><Checkbox onChange={(event) => handleGlobalAction(event.currentTarget.checked)} size="xs" checked={allSelected()} indeterminate={someSelected()} /></div>
                            <div className='w-72 font-semibold'>Student</div>
                            {columns[1] ? <div className='flex-1 font-semibold'>Permissions</div> : null }
                          </div>
                        </div>

                        {/* Students */}
                        <div>
                          {filteredStudents.map((student) => {
                            const selected = Object.keys(rowSelection).includes(student.un)
                            return (
                              <div key={student.un} onClick={() => handleStudentSelect(student)} className={cn('flex h-11 items-center border-b ps-4 cursor-pointer', selected ? 'bg-[rgba(34,139,230,0.1)]' : '')}>
                                <div className='w-12'><Checkbox size="xs" checked={selected} onChange={() => {}} /></div>
                                <div className='w-72'>{columns[0]?.accessorFn(student)}</div>
                                <div className='flex-1'>{columns[1]?.accessorFn(student)}</div>
                              </div>
                            )
                          })}
                        </div>
              

                      </div>

                      
                      <div className="p-4">
                        <Group justify="space-between">
                          { viewStateProps.editable &&
                            <Flex gap="sm">
                              <Button onClick={addStudentsModalHandlers.open} size="compact-sm" variant="light" radius="xl" leftSection={<IconPlus size={14} />} >Add students</Button>
                              { Object.keys(rowSelection).length > 0 && 
                                <>
                                  <Button onClick={removeStudents} variant="light" size="compact-sm" radius="xl" leftSection={<IconMinus size={14} />}>Remove</Button>
                                </>
                              }
                            </Flex>
                          }
                          <Flex gap="sm">
                            <Button variant="light" onClick={openReports} size="compact-sm" radius="xl" leftSection={<IconReport size={14} />}>Reports</Button>
                            { viewStateProps.editable && status == statuses.approved &&
                              <Tooltip.Floating disabled={!haschanges} label="You must save changes before you may send messages.">
                                <Button variant="filled" color={haschanges ? "gray.4" : undefined} onClick={() => (haschanges ? null : messageModalHandlers.open())} size="compact-sm" radius="xl" leftSection={<IconMail size={14} />}>Send a message</Button>
                              </Tooltip.Floating>
                            }
                          </Flex>
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
          opened={isOpenMessageModal} close={messageModalHandlers.close} 
        />
        <StuListReports opened={isOpenReports} close={closeReports} />

      </>
    : null
  );
};
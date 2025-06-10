import { Card, Flex, Group, Text, Button, Loader, Checkbox } from '@mantine/core';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useAjax } from '../../../hooks/useAjax';
import { useStateStore } from '../../../stores/stateStore';
import { useDisclosure } from '@mantine/hooks';
import { Student, User } from '../../../types/types';
import { studentColumn } from '../../Activity/components/StudentList/columns';
import { cn } from '../../../utils/utils';
import { AddStudentsModal } from '../../Activity/components/Modals/AddStudentsModal';



type StudentListProps = {
  id: number;
  studentlist: any[];
  setStudents: (students: Student[]) => void;
}

export function StudentList({id, studentlist, setStudents}: StudentListProps) {

  const [isOpenAddStudentsModal, addStudentsModalHandlers] = useDisclosure(false)
  const viewStateProps = useStateStore((state) => (state.viewStateProps))
  const [rowSelection, setRowSelection] = useState({});

  const insertStudents = (students: User[]) => {
    // Deduplicate.
    const newStudents = students.filter(student => !studentlist.map(u => u.un).includes(student.un))
    setStudents([...studentlist, ...newStudents])
  }

  const removeStudents = () => {
    const selectedUsernames = Object.keys(rowSelection)

    const filtered = studentlist.filter(u => !selectedUsernames.includes(u.un))
    setStudents(filtered)

    setRowSelection({})
  }
  
  const columns = useMemo(() => [studentColumn(false)], [])



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

  const allSelected = () => {
    console.log("rowSelection", rowSelection)
    console.log("studentlist", studentlist)
    return Object.keys(rowSelection).length == studentlist.length
  }
  const someSelected = () => {
    return !!Object.keys(rowSelection).length && !allSelected()
  }
  const deselectAll = () => {
    setRowSelection({})
  }
  const selectAll = () => {
    setRowSelection(
      studentlist.reduce((acc, item) => {
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
    <>
      <Card withBorder radius="sm" className="p-0">
        <div className="px-4 py-3">
          <Group justify="space-between">
            <Text fz="md">Students</Text>
              <Text c='dimmed'> 
                { 
                  Object.keys(rowSelection).length
                  ? Object.keys(rowSelection).length + ' selected'
                  : studentlist?.length + ' students'
                } 
              </Text>
          </Group>
        </div>

        { false 
          ? <div className="p-4 border-t border-gray-300"><Loader size="sm" /></div>
          : (
              studentlist?.length == 0 
                ? viewStateProps.editable 
                  ? <div className="p-4 border-t border-gray-300">
                      <Button onClick={addStudentsModalHandlers.open} size="compact-md" radius="xl" leftSection={<IconPlus size={14} />} >Add students</Button>
                    </div>
                  : <div className="p-4 border-t border-gray-300 italic">No students</div>
                : <>

                    <div className="border-t border-gray-300">

                      {/* Table Header */}
                      <div>
                        <div className='flex h-11 items-center bg-[#f8f9fa] border-b ps-4'>
                          <div className='w-12'><Checkbox onChange={(event) => handleGlobalAction(event.currentTarget.checked)} size="xs" checked={allSelected()} indeterminate={someSelected()} /></div>
                          <div className='w-72 font-semibold'>Student</div>
                        </div>
                      </div>

                      {/* Students */}
                      <div>
                        {studentlist.map((student) => {
                          const selected = Object.keys(rowSelection).includes(student.un)
                          return (
                            <div key={student.un} onClick={() => handleStudentSelect(student)} className={cn('flex h-11 items-center border-b ps-4 cursor-pointer', selected ? 'bg-[rgba(34,139,230,0.1)]' : '')}>
                              <div className='w-12'><Checkbox size="xs" checked={selected} onChange={() => {}} /></div>
                              <div className='w-72'>{columns[0]?.accessorFn(student)}</div>
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

                        </Flex>
                      </Group>
                    </div>
                  </>
          )
        }
      </Card>
      <AddStudentsModal opened={isOpenAddStudentsModal} close={addStudentsModalHandlers.close} insert={insertStudents} />
      
    </>
  );
};
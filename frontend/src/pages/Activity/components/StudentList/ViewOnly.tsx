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
import { Form, useFormStore } from '../../../../stores/formStore';


export function StudentListViewOnly() {

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
    <div>
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
        <div className="border-t border-gray-300">
          <MantineReactTable
            columns={columns}
            data={studentlist}
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
      </Card>
    </div>
  );
};
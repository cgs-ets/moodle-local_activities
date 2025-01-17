import { Button, Card, Checkbox, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {  IconCategoryFilled, IconFilterX, IconX } from '@tabler/icons-react';
import { StaffSelector } from '../../Activity/components/StaffDetails/components/StaffSelector/StaffSelector';
import { User } from '../../../types/types';
import { CoursesModal } from './CoursesModal';
import { CategoriesModal } from './CategoriesModal';

type Props = {
  opened: boolean;
  filters: any;
  setFilters: (filters: any) => void;
  close: () => void;
}

export function FilterModal({opened, filters, setFilters, close}: Props) {
  const [catsModalOpened, {open: openCatsModal, close: closeCatsModal}] = useDisclosure(false);
  const [coursesModalOpened, {open: openCoursesModal, close: closeCoursesModal}] = useDisclosure(false);

  const handleFilterChange  = (key: string, values: string[]) => {
    setFilters({...filters, [key]: values})
  } 

  const handleStaffChange = (values: User[]) => {
    setFilters({...filters, staff: values.map((u: User) => JSON.stringify(u))})
  }

  return (
    <>
    <Modal.Root 
      opened={opened} 
      onClose={() => {
        close()
      }} 
      size="xl"
      >
        <Modal.Overlay />
        <Modal.Content pos="relative" mih={200}>
          <>
            <Modal.Header>
              <Modal.Title>
                <div className='flex items-center gap-4'>
                  <Text fz="xl" fw={600}>Filters</Text>
                </div>
              </Modal.Title>
              <Modal.CloseButton mt={-15} />
            </Modal.Header>
            <Modal.Body p={0}>
              <Card radius={0} className="p-0 pb-4">



                <Card.Section pos="relative" className='m-0 border-b flex items-start gap-1 px-4 py-4'>
                  <div className='w-36 font-bold'>Courses</div>

                  <div>
                    { !!filters.courses?.length &&
                      <>
                        <Checkbox.Group value={filters.courses} onChange={(values) => handleFilterChange('courses', values)}>
                          <div className="flex flex-col gap-1 mb-4">
                            {filters.courses.map((course: string) => (
                              <Checkbox key={course} value={course} label={course.split("|")[1]} />
                            ))}
                          </div>
                        </Checkbox.Group>
                      </>
                    }
                    <div className="flex gap-2">
                      <Button onClick={openCoursesModal} size="compact-md" className="rounded-full" variant="light" rightSection={<IconCategoryFilled className="size-5" />}>{filters.courses?.length ? "Change" : "Select"}</Button>
                      { !!filters.courses?.length && <Button onClick={() => handleFilterChange('courses', [])} size="compact-md" className="rounded-full" variant="light" leftSection={<IconX className="size-5" />}>Clear</Button>}
                    </div>
                  </div>
                
                </Card.Section>


                

                <Card.Section pos="relative" className='m-0 border-b flex items-start gap-1 px-4 py-4'>
                  <div className='w-36 font-bold'>Categories</div>

                  <div>
                    { !!filters.categories?.length &&
                      <>
                        <Checkbox.Group value={filters.categories} onChange={(values) => handleFilterChange('categories', values)}>
                          <div className="flex flex-col gap-1 mb-4">
                            {filters.categories.map((cat: string) => (
                              <Checkbox key={cat} value={cat} label={cat.replace('/', ' > ')} />
                            ))}
                          </div>
                        </Checkbox.Group>
                      </>
                    }
                    <div className="flex gap-2">
                      <Button onClick={openCatsModal} size="compact-md" className="rounded-full" variant="light" rightSection={<IconCategoryFilled className="size-5" />}>{filters.categories?.length ? "Change" : "Select"}</Button>
                      { !!filters.categories?.length && <Button onClick={() => handleFilterChange('categories', [])} size="compact-md" className="rounded-full" variant="light" leftSection={<IconX className="size-5" />}>Clear</Button>}
                    </div>
                  </div>
                
                </Card.Section>




                <Card.Section pos="relative" className='m-0 border-b flex items-start gap-1 px-4 py-4'>
                  <div className='w-36 font-bold mt-1'>Staff</div>

                  <div className='flex-1'>
                    <StaffSelector staff={filters.staff.map((a: string) => JSON.parse(a))} setStaff={handleStaffChange} label="" multiple={true} readOnly={false} />
                    { !!filters.staff?.length && <Button onClick={() => handleFilterChange('staff', [])} size="compact-md" className="rounded-full mt-3" variant="light" leftSection={<IconX className="size-5" />}>Clear</Button>}
                  </div>

                </Card.Section>






              </Card>

              <div className="flex justify-end pt-0 p-4">
                <Button onClick={close} type="submit" radius="xl">Done</Button>
              </div>

            </Modal.Body>
          </>
        </Modal.Content>
      </Modal.Root>

      <CategoriesModal categories={filters.categories} opened={catsModalOpened} close={closeCatsModal} handleChange={(cats) => handleFilterChange('categories', cats)} />
      <CoursesModal courses={filters.courses} opened={coursesModalOpened} close={closeCoursesModal} handleChange={(courses) => handleFilterChange('courses', courses)} />
</>




        
  );
};
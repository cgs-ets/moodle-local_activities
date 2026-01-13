import { Button, Card, Checkbox, Modal, Text, TextInput } from '@mantine/core';
import { CategoriesModal } from '../../Activity/components/Modals/CategoriesModal/CategoriesModal';
import { useDisclosure } from '@mantine/hooks';
import {  IconCategoryFilled, IconX } from '@tabler/icons-react';
import { StaffSelector } from '../../Activity/components/StaffDetails/components/StaffSelector/StaffSelector';
import { User } from '../../../types/types';

type Props = {
  opened: boolean;
  filters: any;
  setFilters: (filters: any) => void;
  close: () => void;
}

export function FilterModal({opened, filters, setFilters, close}: Props) {
  const [catsModalOpened, {open: openCatsModal, close: closeCatsModal}] = useDisclosure(false);

  const handleFilterChange  = (key: string, values: string[] | string) => {
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


                <Card.Section pos="relative" className='m-0 border-b flex items-start gap-1 px-4 pb-4'>
                  <div className='w-36 font-bold mt-1'>Activity name</div>

                  <div className='flex-1'>
                    <TextInput value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} placeholder="Search by activity title" />
                    { !!filters.name?.length && <Button onClick={() => handleFilterChange('name', '')} size="compact-md" className="rounded-full mt-3" variant="light" leftSection={<IconX className="size-5" />}>Clear</Button>}
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



              </Card>

              <div className="flex justify-end pt-0 p-4">
                <Button onClick={close} type="submit" radius="xl" >Done</Button>
              </div>

            </Modal.Body>
          </>
        </Modal.Content>
      </Modal.Root>

      <CategoriesModal categories={filters.categories} opened={catsModalOpened} close={closeCatsModal} handleChange={(cats) => handleFilterChange('categories', cats)} />
</>




        
  );
};
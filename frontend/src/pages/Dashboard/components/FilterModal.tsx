import { Badge, Button, Card, Checkbox, Flex, Modal, Text } from '@mantine/core';
import { CategoriesModal } from '../../Activity/components/Modals/CategoriesModal/CategoriesModal';
import { useDisclosure } from '@mantine/hooks';
import { IconCategory2, IconCategoryFilled, IconClearAll, IconFilterX } from '@tabler/icons-react';

type Props = {
  opened: boolean;
  filters: any;
  setFilters: (filters: any) => void;
  close: () => void;
}

export function FilterModal({opened, filters, setFilters, close}: Props) {
  const [catsModalOpened, {open: openCatsModal, close: closeCatsModal}] = useDisclosure(false);

  const handleCatsChange = (cats: string[]) => {
    setFilters({...filters, categories: cats})
  }  
  
  const handleTypeChange = (types: string[]) => {
    setFilters({...filters, types: types})
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

                <Card.Section pos="relative" className='m-0 border-b  flex items-start gap-1 px-4 pb-4'>
                  <div className='w-36 font-bold'>Type</div>
                  <div>
                    <Checkbox.Group value={filters.types} onChange={handleTypeChange}>
                      <div className="flex flex-col gap-1">
                        <Checkbox value="excursion" label="Excursion" />
                        <Checkbox value="incursion" label="Incursion" />
                        <Checkbox value="calendar" label="Calendar entry" />
                        <Checkbox value="commercial" label="Commercial" />
                      </div>
                    </Checkbox.Group>
                  </div>
                </Card.Section>

                <Card.Section pos="relative" className='m-0 border-b flex items-start gap-1 px-4 py-4'>
                  <div className='w-36 font-bold'>Categories</div>

                  <div>
                    { !!filters.categories?.length &&
                      <>
                        <Checkbox.Group value={filters.categories} onChange={handleCatsChange}>
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
                      { !!filters.categories?.length && <Button onClick={() => handleCatsChange([])} size="compact-md" className="rounded-full" variant="light" rightSection={<IconFilterX className="size-5" />}>Clear all</Button>}
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

      <CategoriesModal categories={filters.categories} opened={catsModalOpened} close={closeCatsModal} handleChange={handleCatsChange} />
</>




        
  );
};
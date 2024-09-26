
import { Box, Button, Checkbox, Flex, Modal } from '@mantine/core';

export function CategoriesModal({opened, close, categories, handleChange}: {opened: boolean, close: () => void, categories: string[], handleChange: (cats: string[]) => void}) {

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Select a category" 
      size="xl"
      styles={{
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        }
      }}
      >
        <Box pt="md">

          <Checkbox.Group value={categories} onChange={handleChange}>
            <div className="categories-selector flex justify-between">

              <div className="category-group flex flex-col gap-1">
                <Checkbox value="Primary School" label={<b>Primary School</b>} />
                <Checkbox value="Primary School/Staff" label="Staff" />
                <Checkbox value="Primary School/Sports" label="Sports" />
                <Checkbox value="Primary School/Creative & Performing Arts" label="Creative & Performing Arts" />
                <Checkbox value="Primary School/Outdoor Education" label="Outdoor Education" />
                <Checkbox value="Primary School/Educational Opportunity" label="Educational Opportunity" />
                <Checkbox value="Primary School/Community" label="Community" />
                <Checkbox value="Primary School/ELC" label="ELC" />
                <Checkbox value="Primary School/Red Hill" label="Red Hill" />
                <Checkbox value="Primary School/Northside" label="Northside" />
                <Checkbox value="Primary School/Pre-School" label="Pre-School" />
                <Checkbox value="Primary School/Pre-Kindergarten" label="Pre-Kindergarten" />
                <Checkbox value="Primary School/Kindergarten" label="Kindergarten" />
                <Checkbox value="Primary School/Year 1" label="Year 1" />
                <Checkbox value="Primary School/Year 2" label="Year 2" />
                <Checkbox value="Primary School/Year 3" label="Year 3" />
                <Checkbox value="Primary School/Year 4" label="Year 4" />
                <Checkbox value="Primary School/Year 5" label="Year 5" />
                <Checkbox value="Primary School/Year 6" label="Year 6" />
                <Checkbox value="Primary School/Website External" label="Website External" />
                <Checkbox value="Primary School/Alumni Website" label="Alumni Website" />
              </div>

              <div className="category-group flex flex-col gap-1">
                <Checkbox value="Senior School" label={<b>Senior School</b>} />
                <Checkbox value="Senior School/Staff" label="Staff" />
                <Checkbox value="Senior School/Sports" label="Sports" />
                <Checkbox value="Senior School/Creative & Performing Arts" label="Creative & Performing Arts" />
                <Checkbox value="Senior School/Outdoor Education" label="Outdoor Education" />
                <Checkbox value="Senior School/Educational Opportunity" label="Educational Opportunity" />
                <Checkbox value="Senior School/Community" label="Community" />
                <Checkbox value="Senior School/Academic" label="Academic" />
                <Checkbox value="Senior School/House" label="House" />
                <Checkbox value="Senior School/Boarding" label="Boarding" />
                <Checkbox value="Senior School/Year 7" label="Year 7" />
                <Checkbox value="Senior School/Year 8" label="Year 8" />
                <Checkbox value="Senior School/Year 9" label="Year 9" />
                <Checkbox value="Senior School/Year 10" label="Year 10" />
                <Checkbox value="Senior School/Year 11" label="Year 11" />
                <Checkbox value="Senior School/Year 12" label="Year 12" />
                <Checkbox value="Senior School/Website External" label="Website External" />
                <Checkbox value="Senior School/Alumni Website" label="Alumni Website" />
              </div>

              <div className="category-group flex flex-col gap-1">
                <Checkbox value="Whole School" label={<b>Whole School</b>} checked />
                <Checkbox value="Whole School/Staff" label="Staff" />
                <Checkbox value="Whole School/Sports" label="Sports" />
                <Checkbox value="Whole School/Creative & Performing Arts" label="Creative & Performing Arts" />
                <Checkbox value="Whole School/Outdoor Education" label="Outdoor Education" />
                <Checkbox value="Whole School/Educational Opportunity" label="Educational Opportunity" />
                <Checkbox value="Whole School/Community" label="Community" />
                <Checkbox value="Whole School/CGS Board" label="CGS Board" />
                <Checkbox value="Whole School/Website External" label="Website External" />
                <Checkbox value="Whole School/Alumni Website" label="Alumni Website" />
              </div>
            </div>
          </Checkbox.Group>

          <Flex pt="sm" justify="end">
            <Button onClick={close} type="submit" radius="xl" >{"Close"}</Button>
          </Flex>
        </Box>
    </Modal>
  );
};
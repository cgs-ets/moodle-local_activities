import { Box, Button, Checkbox, Flex, Modal } from '@mantine/core';
import { useEffect, useRef } from 'react';

export function CategoriesModal({opened, close, categories, handleChange}: {opened: boolean, close: () => void, categories: string[], handleChange: (cats: string[]) => void}) {
  // Keep track of explicitly unselected parents
  const unselectedParents = useRef<Set<string>>(new Set());
  
  // Helper function to check if any child categories are selected
  const hasSelectedChildren = (parent: string, values: string[] = categories) => {
    return values.some(cat => cat.startsWith(parent + '/'));
  };

  // Helper to check which campuses have selected categories
  const getSelectedCampuses = (values: string[]) => {
    const parents = ['Primary School', 'Senior School', 'Whole School'];
    return parents.filter(parent => 
      values.some(cat => cat === parent || cat.startsWith(parent + '/'))
    );
  };

  // Handle checkbox changes including parent-child relationships
  const handleCheckboxChange = (newValues: string[]) => {
    let updatedValues = [...newValues];
    const parents = ['Primary School', 'Senior School', 'Whole School'];

    // Check if a parent was just unselected
    parents.forEach(parent => {
      if (categories.includes(parent) && !updatedValues.includes(parent)) {
        unselectedParents.current.add(parent);
      }
      // Remove from unselected if it was just selected
      if (!categories.includes(parent) && updatedValues.includes(parent)) {
        unselectedParents.current.delete(parent);
      }
    });

    // Add parent categories if children are selected and parent wasn't explicitly unselected
    parents.forEach(parent => {
      if (hasSelectedChildren(parent, updatedValues) && 
          !unselectedParents.current.has(parent) && 
          !updatedValues.includes(parent)) {
        updatedValues.push(parent);
      }
    });

    // Check if categories are from multiple campuses
    const selectedCampuses = getSelectedCampuses(updatedValues);
    if (selectedCampuses.length > 1 && !updatedValues.includes('Whole School')) {
      updatedValues.push('Whole School');
      unselectedParents.current.delete('Whole School');
    }
    
    handleChange(updatedValues);
  };

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
          <Checkbox.Group value={categories} onChange={handleCheckboxChange}>
            <div className="categories-selector flex justify-between">
              <div className="category-group flex flex-col gap-1">
                <Checkbox 
                  value="Primary School" 
                  label={<b>Primary School</b>} 
                />
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
                <Checkbox value="Primary School/Music" label="Music" />
              </div>

              <div className="category-group flex flex-col gap-1">
                <Checkbox 
                  value="Senior School" 
                  label={<b>Senior School</b>} 
                />
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
                <Checkbox value="Senior School/Music" label="Music" />
              </div>

              <div className="category-group flex flex-col gap-1">
                <Checkbox 
                  value="Whole School" 
                  label={<b>Whole School</b>} 
                />
                <Checkbox value="Whole School/Staff" label="Staff" />
                <Checkbox value="Whole School/Sports" label="Sports" />
                <Checkbox value="Whole School/Creative & Performing Arts" label="Creative & Performing Arts" />
                <Checkbox value="Whole School/Outdoor Education" label="Outdoor Education" />
                <Checkbox value="Whole School/Educational Opportunity" label="Educational Opportunity" />
                <Checkbox value="Whole School/Community" label="Community" />
                <Checkbox value="Whole School/CGS Board" label="CGS Board" />
                <Checkbox value="Whole School/External Events" label="External Events" />
                <Checkbox value="Whole School/Campus Management" label="Campus Management" />
                <Checkbox value="Whole School/Website External" label="Website External" />
                <Checkbox value="Whole School/Alumni Website" label="Alumni Website" />
                <Checkbox value="Whole School/Music" label="Music" />
              </div>
            </div>
          </Checkbox.Group>

          <Flex pt="sm" justify="end">
            <Button onClick={close} type="submit" radius="xl">Done</Button>
          </Flex>
        </Box>
    </Modal>
  );
};
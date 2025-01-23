
import { Box, Button, Checkbox, Flex, Modal } from '@mantine/core';
import { useEffect, useState } from 'react';
import useFetch from '../../../hooks/useFetch';

export function CategoriesModal({opened, close, categories, handleChange}: {opened: boolean, close: () => void, categories: string[], handleChange: (cats: string[]) => void}) {
  
  const api = useFetch()
  const [dbcats, setCategories] = useState([])

  useEffect(() => {
    getCourseCats()
  }, []);

  const getCourseCats = async () => {
    const fetchResponse = await api.call({
      query: {
        methodname: 'local_activities-get_course_cats',
      }
    })
    if (!fetchResponse.error && fetchResponse?.data) {
      setCategories(fetchResponse.data)
    }
  }


  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Select categories" 
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
            <div className="courses-selector flex justify-between">
              {dbcats.map((cat: any) => (
                <Checkbox key={cat.value} value={`${cat.value}|${cat.label}`} label={cat.label} />
              ))}
             </div>
          </Checkbox.Group>

          <Flex pt="sm" justify="end">
            <Button onClick={close} type="submit" radius="xl" >Done</Button>
          </Flex>
        </Box>
    </Modal>
  );
};
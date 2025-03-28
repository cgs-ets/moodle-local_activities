
import { Box, Button, Checkbox, Flex, Modal } from '@mantine/core';
import { useEffect, useState } from 'react';
import useFetch from '../../../hooks/useFetch';

export function CoursesModal({opened, close, courses, handleChange}: {opened: boolean, close: () => void, courses: string[], handleChange: (cats: string[]) => void}) {
  
  const api = useFetch()
  const [dbcourses, setCourses] = useState([])

  useEffect(() => {
    getCourses()
  }, []);

  const getCourses = async () => {
    const fetchResponse = await api.call({
      query: {
        methodname: 'local_activities-get_courses',
      }
    })
    if (!fetchResponse.error && fetchResponse?.data) {
      setCourses(fetchResponse.data)
    }
  }


  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Select courses" 
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

          <Checkbox.Group value={courses} onChange={handleChange}>
            <div className="courses-selector flex justify-between">
              {dbcourses.map((course: any) => (
                <Checkbox key={course.value} value={`${course.value}|${course.label}`} label={course.label} />
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
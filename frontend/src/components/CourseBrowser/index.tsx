import { LoadingOverlay, Checkbox, Group, Text, UnstyledButton, Box, TextInput } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { fetchData } from "../../utils";
import { Course } from "../../types/types";

type Props = {
  selectedIds: number[],
  setSelectedIds: (ids: number[]) => void,
}

export function CourseBrowser({selectedIds, setSelectedIds}: Props) {
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadCourses()
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    const response = await fetchData({
      query: {
        methodname: 'local_activities-get_users_courses',
      }
    })
    setCourseList(response.data)
    setIsLoading(false)
  };

  const handleItemSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((v: number) => v !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  };

  const filtered = useMemo(() => {
    if (!courseList || !filter) return courseList;

    // Convert the filter to lowercase for case-insensitive comparison
    const lowerCaseFilter = filter.toLowerCase();

    // Filter the courseList based on whether the fullname contains the filter value
    return courseList.filter(course => 
        course.fullname.toLowerCase().includes(lowerCaseFilter)
    );
  }, [filter, courseList]);


  
  console.log("courseList", courseList)


  return (
    <Box className="overflow-auto max-h-56">
      <LoadingOverlay loaderProps={{size:"sm"}} visible={isLoading} overlayProps={{blur: 2}} />
      {!!courseList.length && 
        <TextInput 
          placeholder="Filter"
          className="mb-2"
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
        /> 
      }
      <div className="flex flex-col">
        {filtered.map((item, i) => (
          <UnstyledButton 
            key={i} 
            className="py-1 text-sm"
            onClick={() => handleItemSelect(item.id)}
            >
            <Group>
              <Checkbox size={'15'} checked={selectedIds?.includes(item.id) ? true : false} onChange={() => {}}/>
              <Text c="tablrblue">{item.fullname}</Text>
            </Group>
          </UnstyledButton>
        ))}
      </div>
    </Box>
  );
};
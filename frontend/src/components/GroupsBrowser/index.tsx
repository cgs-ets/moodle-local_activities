import { LoadingOverlay, Checkbox, Group, Text, UnstyledButton, Box } from "@mantine/core";
import { useEffect, useState } from "react";
import { fetchData } from "../../utils";
import { Course } from "../../types/types";

type Props = {
  selectedIds: number[],
  setSelectedIds: (ids: number[]) => void,
}

export function GroupsBrowser({selectedIds, setSelectedIds}: Props) {
  const [groupList, setGroupList] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadGroups()
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    const response = await fetchData({
      query: {
        methodname: 'local_activities-get_users_groups',
      }
    })
    setGroupList(response.data)
    setIsLoading(false)
  };

  const handleItemSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((v: number) => v !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  };

  return (
    <Box className="overflow-auto max-h-56">
      <LoadingOverlay loaderProps={{size:"sm"}} visible={isLoading} overlayProps={{blur: 2}} />
      <div className="flex flex-col">
        {groupList.map((item, i) => (
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
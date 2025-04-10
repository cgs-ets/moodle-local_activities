import { useEffect, useState } from "react";
import { Loader, Select } from '@mantine/core';
import { Taglist } from "../types/types";
import { fetchData } from "../utils";

type Props = {
  selectedId: string,
  setSelectedId: (id: string) => void,
}

export function TagListSelector({selectedId, setSelectedId}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [taglists, setTaglists] = useState<Taglist[]>([]);

  useEffect(() => {
    loadTaglist()
  }, []);

  const loadTaglist = async () => {
    setIsLoading(true);
    const response = await fetchData({
      query: {
        methodname: 'local_activities-get_user_taglists',
      }
    })
    if (response.data && response.data.length) {
      setTaglists(response.data);
    }
    setIsLoading(false);
  }

  const taglistOptions = () => {
    return taglists.map((item) => ({ value: item.id, label: item.name }));
  }

  return (
    <>
      <Select
        label="User taglists"
        leftSection={ isLoading ? <Loader size="1rem" /> : null}
        placeholder="Select taglist"
        data={taglistOptions()}
        value={selectedId.toString()}
        onChange={(value) => {
          console.log("Selected Value:", value);  // Debug log
          if (value) {
            setSelectedId(value);
          } else {
            setSelectedId("");
          }
        }}
      />
    </>
  );
};

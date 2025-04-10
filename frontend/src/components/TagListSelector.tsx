import { useEffect, useState } from "react";
import { Select } from '@mantine/core';
import { Taglist } from "../types/types";
import { fetchData } from "../utils";

type Props = {
  selectedId: number,
  setSelectedId: (id: number) => void,
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
    setTaglists(response.data)
    setIsLoading(false)
  }

  const taglistOptions = () => {
    if (!taglists) {
      return []
    }
    return taglists.map((item) => ({value: item.id.toString(), label: item.name}))
  }


  return (
    <>
      <Select
        label="User taglists"
        placeholder="Select taglist"
        data={taglistOptions()}
        value={selectedId.toString()}
        onChange={(value) => {
          if (value) {
            console.log(value)
            setSelectedId(parseInt(value))
          } else {
            setSelectedId(0)
          }
        }}
      />
    </>
  );
};
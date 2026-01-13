import { useEffect, useState } from "react";
import { Loader, SegmentedControl, Select } from '@mantine/core';
import { Taglist } from "../types/types";
import { fetchData } from "../utils";

type Props = {
  selectedId: string,
  setSelectedId: (id: string) => void,
}

export function TagListSelector({selectedId, setSelectedId}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [taglists, setTaglists] = useState<Taglist[]>([]);
  const [publicTaglists, setPublicTaglists] = useState<Taglist[]>([]);
  const [type, setType] = useState<string>("user");


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
    const publicResponse = await fetchData({
      query: {
        methodname: 'local_activities-get_public_taglists',
      }
    })
    if (publicResponse.data && publicResponse.data.length) {
      setPublicTaglists(publicResponse.data);
    }
    setIsLoading(false);
  }

  const taglistOptions = () => {
    return taglists.map((item) => ({ value: item.id, label: item.name }));
  }

  const publicTaglistOptions = () => {
    return publicTaglists.map((item) => ({ value: item.id, label: item.name }));
  }

  useEffect(() => {
    setSelectedId("");
  }, [type]);

  return (
    <>
      <SegmentedControl
        value={type}
        onChange={setType}
        data={[
          { label: 'User', value: 'user' },
          { label: 'Public', value: 'public' },
        ]}
        className="mb-4"
      />
      {type === "user" && (
        <Select
          label=""
          leftSection={ isLoading ? <Loader size="1rem" /> : null}
          placeholder="Select taglist"
          data={taglistOptions()}
          value={selectedId.toString()}
          onChange={(value) => {
            if (value) {
              setSelectedId(value);
            } else {
              setSelectedId("");
            }
          }}
        />
      )}
      {type === "public" && (
        <Select
          label=""
          leftSection={ isLoading ? <Loader size="1rem" /> : null}
          placeholder="Select taglist"
          data={publicTaglistOptions()}
          value={selectedId.toString()}
          onChange={(value) => {
            if (value) {
              setSelectedId(value);
            } else {
              setSelectedId("");
            }
          }}
        />
      )}
    </>
  );
};

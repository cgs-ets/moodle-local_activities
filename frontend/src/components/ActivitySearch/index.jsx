import { Fragment, useState } from "react";
import { MultiSelect, Loader } from '@mantine/core';
import { fetchData } from 'src/utils/index'

export function ActivitySearch({callback}) {
  const decorateResult = (item) => ({
    value: JSON.stringify({id: item.id, name: item.name}),
    label: item.name,
  })

  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchActivitys = async (text) => {
    if (!text.length) {
      return;
    }
    setIsLoading(true);
    const response = await fetchData({
      query: {
        methodname: 'local_activities-search_activitys',
        text: text,
      }
    })
    setSearchResults(response.data.map(decorateResult))
    setIsLoading(false)
  };

  const handleChange = (value) => {
    callback(value)
  };

  return (
    <Fragment>
      <MultiSelect 
        maxSelectedValues={1}
        placeholder="Search activities"
        limit={8}
        rightSection={isLoading ? <Loader size="xs" /> : ''}
        data={searchResults}
        searchable
        onSearchChange={(value) => searchActivitys(value)}
        onChange={handleChange}
        clearSearchOnChange={true}
        shadow="lg"
        dropdownPosition="bottom"
        styles={{value: {display:"flex"}, values: {paddingTop:"0.12rem", paddingBottom:"0.12rem"}}}
        filter={(value, selected, item) => {
          return (value 
            ? (!selected && item.label.toLowerCase().includes(value.toString().toLowerCase().trim()))
            : false
          )
        }}
      />
    </Fragment>
  );
};
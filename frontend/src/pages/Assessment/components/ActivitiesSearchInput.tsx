import { useState, useEffect, useCallback } from "react";
import { Anchor, Loader, Popover, ScrollArea, TextInput } from "@mantine/core";
import useFetch from "../../../hooks/useFetch";
import { Form } from "../../../stores/formStore";
import dayjs from "dayjs";
import { IconArrowNarrowRight } from "@tabler/icons-react";

interface ActivitiesSearchInputProps {
  placeholder: string;
  delay?: number; // Optional delay in milliseconds (default: 300ms)
  onSelect: (activity: Form) => void
}

export function ActivitiesSearchInput({
  placeholder,
  delay = 300,
  onSelect,
}: ActivitiesSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [searchResults, setSearchResults] = useState<Form[]>([]);
  const api2 = useFetch(); // Use the same API hook as in the parent component

  // Function to perform the search
  const searchActivities = useCallback(
    async (search: string) => {
      if (!search) {
        return;
      }
      const fetchResponse = await api2.call({
        query: {
          methodname: 'local_activities-search_activities',
          search: search,
        },
      });
      if (!fetchResponse.error && fetchResponse?.data) {
        if (fetchResponse.data) {
          setSearchResults(fetchResponse.data)
        }
      }
    },
    [api2]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);

      // Clear the previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set a new timeout to trigger the search after the delay
      const timeout = setTimeout(() => {
        searchActivities(value);
      }, delay);
      setSearchTimeout(timeout);
    },
    [searchActivities, delay, searchTimeout]
  );

  // Cleanup the timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div
      className="relative flex-grow"
    >
      <TextInput
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        rightSection={api2.state.loading ? <Loader size="xs" /> : null}
      />
      {!!searchResults.length && 
        <ScrollArea h={ searchResults.length > 6 ? 270 : undefined} className="flex flex-col gap-1 pt-1 border mt-1 rounded    absolute w-full bg-white z-10">
          {searchResults.map((activity) => {
            return (
              <div 
                key={activity.id} 
                onClick={() => onSelect(activity)}
                className="cursor-pointer border-b py-1 px-2 hover:text-blue-600"
              >
                {activity.activityname}
                <div className='text-xs flex items-center gap-1 text-gray-400'>
                  {dayjs.unix(Number(activity.timestart)).format("H:mm D MMM YY")} <IconArrowNarrowRight className='stroke-1 size-3' /> {dayjs.unix(Number(activity.timeend)).format("H:mm D MMM YY")}
                </div>
              </div>
            )
          })}
        </ScrollArea>
      }
    </div>
    
  );
}
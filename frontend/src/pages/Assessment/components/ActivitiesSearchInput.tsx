import { useState, useEffect, useCallback } from "react";
import { TextInput } from "@mantine/core";
import useFetch from "../../../hooks/useFetch";

interface ActivitiesSearchInputProps {
  placeholder: string;
  delay?: number; // Optional delay in milliseconds (default: 300ms)
}

export function ActivitiesSearchInput({
  placeholder,
  delay = 300,
}: ActivitiesSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const api2 = useFetch(); // Use the same API hook as in the parent component

  // Function to perform the search
  const searchActivities = useCallback(
    async (search: string) => {
      if (!search) {
        return;
      }
      console.log(search);
      const fetchResponse = await api2.call({
        query: {
          methodname: 'local_activities-search_activities',
          search: search,
        },
      });
      if (!fetchResponse.error && fetchResponse?.data) {
        console.log("Activities", fetchResponse.data);
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
    <TextInput
      className="flex-grow"
      placeholder={placeholder}
      value={searchTerm}
      onChange={handleInputChange}
    />
  );
}
import { Fragment, useState } from "react";
import { Group, Avatar, Text, Loader, Badge, Flex, CloseButton, useCombobox, Combobox, PillsInput, Pill } from '@mantine/core';
import { IconUser, IconUsers } from '@tabler/icons-react';
import { DecordatedUser, User } from "../../types/types";
import { fetchData } from "../../utils";
import { useDebouncedCallback } from "@mantine/hooks";

type Props = {
  students: User[],
  setStudents: (students: User[]) => void,
}

export function StudentSelector({students, setStudents}: Props) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<DecordatedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const decorateUser = (item: User) => ({
    value: { un: item.un, fn: item.fn, ln: item.ln }, // What we'll send to the server for saving.
    label: item.fn + " " + item.ln,
    username: item.un,
    image: '/local/activities/avatar.php?username=' + item.un
  })

  const searchStudents = async (query: string) => {
    setSearch(query)
    if (query.length < 3) {
      setSearchResults([])
      return;
    }
    combobox.updateSelectedOptionIndex();
    combobox.openDropdown();
    debouncedSearch(query)
  };

  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    setIsLoading(true);
    const response = await fetchData({
      query: {
        methodname: 'local_activities-search_students',
        query: query,
      }
    })
    const data = response.data.map(decorateUser);
    setSearchResults(data)
    setIsLoading(false)
  }, 500);


  const handleValueSelect = (val: User) => {
    setSearch('')
    setSearchResults([])
    if (!students.map(s => JSON.stringify(s)).includes(JSON.stringify(val))) {
      setStudents([...students, val])
    }
  }

  const handleValueRemove = (val: User) => {
    setStudents(students.filter((v: any) => JSON.stringify(v) !== JSON.stringify(val)))
  }
  

  // The search result
  const options = searchResults.map((item) => (
    <Combobox.Option value={JSON.stringify(item.value)} key={item.username}>
      <Group gap="sm">
        <Avatar alt={item.label} size={24} mr={5} src={item.image} radius="xl"><IconUser size={14} /></Avatar>
        <Text>{item.label} ({item.username})</Text>
      </Group>
    </Combobox.Option>
  ));

  // The selected pills
  const values = students.map((item, i) => {
    const user = decorateUser(item)
    return (
      <Badge key={user.username} variant='filled' p={0} color="gray.2" size="lg" radius="xl" leftSection={
        <Avatar alt={user.label} size={24} mr={5} src={user.image} radius="xl"><IconUser size={14} /></Avatar>
      }>
        <Flex gap={4}>
          <Text className="normal-case font-normal text-black text-sm">{user.label}</Text>
          <CloseButton
            onMouseDown={() => {handleValueRemove(students[i])}}
            variant="transparent"
            size={22}
            iconSize={14}
            tabIndex={-1}
          />
        </Flex>
      </Badge>
    )
  });


  return (
    <Fragment>
      <Combobox 
        store={combobox} 
        onOptionSubmit={(optionValue: string) => {
          handleValueSelect(JSON.parse(optionValue));
          combobox.closeDropdown();
        }}
        withinPortal={true}
      >
        <Combobox.DropdownTarget>
          <PillsInput 
            pointer 
            rightSection={isLoading ? <Loader size="xs" /> : ''}
            leftSection={<IconUsers size={18} />}
          >
            <Pill.Group>
              {values}
              <Combobox.EventsTarget>
                <PillsInput.Field
                  onFocus={() => combobox.openDropdown()}
                  onClick={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                  value={search}
                  placeholder="Search student"
                  onChange={(event) => {
                    searchStudents(event.currentTarget.value)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' && search.length === 0) {
                      event.preventDefault();
                      handleValueRemove(students[students.length - 1]);
                    }
                  }}
                />
              </Combobox.EventsTarget>
            </Pill.Group>
          </PillsInput>
        </Combobox.DropdownTarget>

        <Combobox.Dropdown 
          hidden={!options.length}
        >
          <Combobox.Options
            mah={200}
            style={{ overflowY: 'auto' }}
          >
            {options.length > 0 
              ? <>
                  {options}
                </> : 
              <Combobox.Empty>Nothing found...</Combobox.Empty>
            }
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </Fragment>
  );
};
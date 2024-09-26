import { Fragment, useState, forwardRef, useEffect } from "react";
import { Group, Avatar, Text, MultiSelect, Loader, Badge, Flex, CloseButton, Combobox, useCombobox, Pill, Input, PillsInput } from '@mantine/core';
import { IconUser, IconUsers } from '@tabler/icons-react';
import { fetchData } from "../../../../../../utils";
import { StaffDetails, useStaffDetailsStore } from "../../../../../../stores/formStore";
import { User } from "../../../../../../types/types";

type Props = {
  stafftype: string,
  label: string,
}

export type DecordatedUser = {
  value: string,
  label: string,
  username: string,
  image: string,
}

export function StaffSelector({stafftype, label}: Props) {

  const [search, setSearch] = useState('');
  const staff = stafftype == "accompanying" ? useStaffDetailsStore((state) => state.accompanying) : useStaffDetailsStore((state) => state.planning)
  const setStaff = useStaffDetailsStore(state => state.setState)
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<DecordatedUser[]>([]);
  
  const decorateStaff = (item: User) => ({
    value: JSON.stringify({ un: item.un, fn: item.fn, ln: item.ln }), // What we'll send to the server for saving.
    label: item.fn + " " + item.ln,
    username: item.un,
    image: '/local/activities/avatar.php?username=' + item.un
  })

  const loadStaff = async (query: string) => {
    setSearch(query)
    combobox.updateSelectedOptionIndex();
    combobox.openDropdown();
    if (!query.length) {
      setSearchResults([])
      return;
    }
    setIsLoading(true);
    const response = await fetchData({
      query: {
        methodname: 'local_activities-search_staff',
        query: query,
      }
    })
    const data = response.data.map(decorateStaff);
    //const usernames = new Set(searchResults.map(u => u.username));
    //const merged = [...searchResults, ...data.filter((u: DecordatedUser) => !usernames.has(u.username))];
    setSearchResults(data)
    setIsLoading(false)
  };

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const handleValueSelect = (val: string) => {
    setSearch('')
    setSearchResults([])
    setStaff({[stafftype]: staff.includes(val) ? staff.filter((v) => v !== val) : [...staff, val]} as StaffDetails)
  }

  const handleValueRemove = (val: string) => {
    setStaff({[stafftype]: staff.filter((v) => v !== val)} as StaffDetails)
  }

  const options = searchResults.map((item) => (
    <Combobox.Option value={item.value} key={item.value} active={staff.includes(item.value)}>
      <Group gap="sm">
        <Avatar alt={label} size={24} mr={5} src={item.image} radius="xl"><IconUser size={14} /></Avatar>
        <Text>{label} ({item.username})</Text>
      </Group>
    </Combobox.Option>
  ));

  const values = staff.map((item) => {
    const user = JSON.parse(item)
    return (
      <Badge key={item} variant='filled' p={0} color="gray.2" size="lg" radius="xl" leftSection={
        <Avatar alt={label} size={24} mr={5} src={user.image} radius="xl"><IconUser size={14} /></Avatar>
      }>
        <Flex gap={4}>
          <Text>{label}</Text>
          <CloseButton
            onMouseDown={() => {}}
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
    <>
    <Combobox store={combobox} 
      onOptionSubmit={(optionValue) => {
        handleValueSelect(optionValue);
        combobox.closeDropdown();
      }}
      withinPortal={false}>
      <Combobox.DropdownTarget>
        <PillsInput pointer rightSection={isLoading ? <Loader size="xs" /> : ''}>
          <Pill.Group>
            {values}
            <Combobox.EventsTarget>
              <PillsInput.Field
                onFocus={() => combobox.openDropdown()}
                onClick={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                value={search}
                placeholder="Search staff"
                onChange={(event) => {
                  loadStaff(event.currentTarget.value)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && search.length === 0) {
                    event.preventDefault();
                    handleValueRemove(staff[staff.length - 1]);
                  }
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown hidden={!options.length}>
        <Combobox.Options>
          {options.length > 0 
            ? options : 
            <Combobox.Empty>Nothing found...</Combobox.Empty>
          }
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
    
    </>
  );
};
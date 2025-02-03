import { useState } from "react";
import { Group, Avatar, Text, Loader, Badge, Flex, CloseButton, Combobox, useCombobox, Pill, PillsInput } from '@mantine/core';
import { IconUser, IconUsers } from '@tabler/icons-react';
import { fetchData } from "../../../../../../utils";
import { DecordatedUser, User } from "../../../../../../types/types";
import { useStateStore } from "../../../../../../stores/stateStore";

type Props = {
  staff: User[],
  setStaff: (value: any[]) => void,
  label: string,
  sublabel?: string,
  multiple: boolean,
  readOnly: boolean,
}

export function StaffSelector({staff, setStaff, label, sublabel, multiple, readOnly}: Props) {

  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<DecordatedUser[]>([]);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });
  
  const decorateStaff = (item: User) => ({
    value: { un: item.un, fn: item.fn, ln: item.ln }, // What we'll send to the server for saving.
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
    setSearchResults(data)
    setIsLoading(false)
  };


  const handleValueSelect = (val: User) => {
    setSearch('')
    setSearchResults([])
    if (multiple) {
      if (!staff.map(s => JSON.stringify(s)).includes(JSON.stringify(val))) {
        setStaff([...staff, val])
      }
    } else {
      setStaff([val])
    }
  }

  const handleValueRemove = (val: User) => {
    setStaff(staff.filter((v: any) => JSON.stringify(v) !== JSON.stringify(val)))
  }

  // The search result
  const options = searchResults.map((item) => (
    <Combobox.Option value={JSON.stringify(item.value)} key={item.username}>
      <Group gap="sm">
        <Avatar alt={item.label} size={24} mr={5} src={item.image} radius="xl"><IconUser /></Avatar>
        <Text>{item.label} ({item.username})</Text>
      </Group>
    </Combobox.Option>
  ));

  // The selected pills
  const values = staff.map((item, i) => {
    const user = decorateStaff(item)
    return (
      <Badge key={user.username} variant='filled' p={0} color="gray.2" size="lg" radius="xl" 
        leftSection={
          <Avatar alt={user.label} size={24} mr={5} src={user.image} radius="xl"><IconUser /></Avatar>
        }
      >
        <Flex gap={4}>
          <Text className="normal-case font-normal text-black text-sm">{user.label}</Text>
          <CloseButton
            onMouseDown={() => {handleValueRemove(staff[i])}}
            variant="transparent"
            size={22}
            iconSize={14}
            tabIndex={-1}
          />
        </Flex>
      </Badge>
    )
  });


  const dropdown = 
    <Combobox 
      store={combobox} 
      onOptionSubmit={(optionValue: string) => {
        handleValueSelect(JSON.parse(optionValue));
        combobox.closeDropdown();
      }}
      withinPortal={false}
    >
      <Combobox.DropdownTarget>
        <PillsInput 
          pointer 
          rightSection={isLoading ? <Loader size="xs" /> : ''}
          leftSection={multiple ? <IconUsers size={18} /> : <IconUser size={18} />}
        >
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
                className={(multiple || !staff.length) ? "" : "hidden"}
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

  const readOnlyValues = staff.map((item, i) => {
    const user = decorateStaff(item)
    return (
      <Badge key={user.username} variant='filled' pl={0} color="gray.2" size="lg" radius="xl" leftSection={
        <Avatar alt={user.label} size={24} mr={5} src={user.image} radius="xl"><IconUser /></Avatar>
      }>
        <Flex gap={4}>
          <Text className="normal-case font-normal text-black text-sm">{user.label}</Text>
        </Flex>
      </Badge>
    )
  });


  return (
    <div>
      <Text fz="sm" fw={500} c="#212529">{label}</Text>
      <div className="mt-1">
        {readOnly
          ? readOnlyValues.length 
            ? readOnlyValues
            : <div className="ml-2 italic">No staff selected</div>
          : dropdown
        }
      </div>
      {sublabel && <Text fz="xs" fw={400} c="#212529">{sublabel}</Text>}
    </div>
  );
};
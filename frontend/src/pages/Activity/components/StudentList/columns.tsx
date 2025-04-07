import { Avatar, Badge, Flex, Text } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { Student } from "../../../../types/types";

export const studentColumn = (showPermissions: boolean) => {
  return {
    accessorFn: (row: Student) => {
      let color = 'gray.2'
      if (showPermissions) {
        color = 'orange.1'
        if (row.permission == 1) {
              color = 'apprgreen.2'
        } else if (row.permission == 2) {
              color = 'red.2'
        }
      }
      return (
        <Flex wrap="wrap" gap={4} align="center">
          <Badge variant='filled' key={row.un} pl={0} size="lg" color={color} radius="xl" leftSection={
              <Avatar alt={row.fn + " " + row.ln} size={24} mr={5} src={'/local/activities/avatar.php?username=' + row.un} radius="xl"><IconUser /></Avatar>
            }
          >
            <Text className="normal-case font-normal text-black text-sm">{row.ln}, {row.fn} {row.year ? '(' + row.year + ')' : ''}</Text>
          </Badge>
        </Flex>
      ) 
    },
    id: 'student',
    header: 'Student',
  }
}

export const parentColumn = {
  accessorFn: (row: Student) => {
    return (
      <Flex wrap="wrap" gap={4}>
        {
          row.parents?.map((parent) => { 
            let color = 'orange.1'
            if (parent.response == 1) {
              color = 'apprgreen.2'
            } else if (parent.response == 2) {
              color = 'red.2'
            }
            return (
              <Badge variant='filled' key={parent.un} pl={0} size="lg" color={color} radius="xl" leftSection={
                  <Avatar alt={parent.fn + " " + parent.ln} size={24} mr={5} src={'/local/activities/avatar.php?username=' + parent.un} radius="xl"><IconUser /></Avatar>
                }
              >
                <Text className="normal-case font-normal text-black text-sm">{parent.fn + " " + parent.ln}</Text>
              </Badge>
            )
          })
        }
      </Flex>
    )
  },
  id: 'permissions',
  header: 'Permissions',
}

import { Avatar, Badge, Flex, Text } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { User } from "../../../../types/types";

export const studentColumn = () => {
  return {
    accessorFn: (row: User) => { 
      return (
        <Flex wrap="wrap" gap={4} align="center">
          <Badge variant='filled' key={row.un} pl={0} size="lg" color="gray.2" radius="xl" leftSection={
              <Avatar alt={row.fn + " " + row.ln} size={24} mr={5} src={'/local/activities/avatar.php?username=' + row.un} radius="xl"><IconUser size={14} /></Avatar>
            }
          >
            <Text className="normal-case font-normal text-black text-sm">{row.ln + ", " + row.fn}</Text>
          </Badge>
        </Flex>
      ) 
    },
    id: 'student',
    header: 'Student',
  }
}

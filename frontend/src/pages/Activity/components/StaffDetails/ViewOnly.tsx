import { Avatar, Badge, Card, Flex, Text } from "@mantine/core";
import { Form, useFormStore } from "../../../../stores/formStore";
import { StaffSelector } from "./components/StaffSelector/StaffSelector";
import { User } from "../../../../types/types";
import { IconUser } from "@tabler/icons-react";
import { isActivity } from "../../../../utils/utils";


export function StaffDetailsViewOnly() {

  const accompanyingstaff = useFormStore((state) => state.accompanyingstaff) 
  const planningstaff = useFormStore((state) => state.planningstaff) 
  const staffincharge = useFormStore((state) => state.staffincharge) 
  const activitytype = useFormStore((state) => state.activitytype) 

  const decorateStaff = (item: User) => ({
    value: { un: item.un, fn: item.fn, ln: item.ln }, // What we'll send to the server for saving.
    label: item.fn + " " + item.ln,
    username: item.un,
    image: '/local/activities/avatar.php?username=' + item.un
  })

  const userBadge = (item: User) => {
    const user = decorateStaff(item)
    return (
      <Badge key={user.username} variant='filled' pl={0} color="gray.2" size="lg" radius="xl" leftSection={
        <Avatar alt={user.label} size={24} mr={5} src={user.image} radius="xl"><IconUser size={14} /></Avatar>
      }>
        <Flex gap={4}>
          <Text className="normal-case font-normal text-black text-sm">{user.label}</Text>
        </Flex>
      </Badge>
    )
  }
  const leader = staffincharge.map((item, i) => {
    return userBadge(item)
  });

  const planners = planningstaff.map((item, i) => {
    return userBadge(item)
  });

  const accompanying = accompanyingstaff.map((item, i) => {
    return userBadge(item)
  });


  return (
    <Card withBorder radius="sm" className="p-0">
      <div className="px-4 py-3">
        <Text fz="md">Staff</Text>
      </div>
      <div className="flex flex-col gap-6 p-4 border-t border-gray-300">
        <div className="flex flex-col gap-2">
          <div>
            <Text fz="sm" mb="5px" fw={500} c="#212529">Leader</Text>
            {leader}
          </div>
          { isActivity(activitytype) &&
            <>
              <div>
                <Text fz="sm" mb="5px" fw={500} c="#212529">Planning</Text>
                <div className="flex gap-2">{planners}</div>
              </div>
              <div>
                <Text fz="sm" mb="5px" fw={500} c="#212529">Accompanying</Text>
                {accompanying}
              </div>
              <div>
                <Text fz="sm" mb="5px" fw={500} c="#212529">Non-school participants</Text>
                
              </div>
            </>
          }
        </div>
      </div>
    </Card>
  );
};
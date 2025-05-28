import dayjs from "dayjs";
import { Form } from "../../../stores/formStore";
import { cn } from "../../../utils/utils";
import { ActionIcon, Anchor, Avatar, Badge, Table, Text } from "@mantine/core";
import { IconEdit, IconExternalLink, IconUser } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

type Props = {
  event: any,
  setSelectedEvent: (form: Form) => void,
  selected: boolean
}
export function TableRow({event, setSelectedEvent, selected}: Props) {

  let navigate = useNavigate();

  return (
    <Table.Tr onClick={() => setSelectedEvent(event)} key={event.id} className={cn("xcursor-pointer", selected ? "border-b border-dashed border-blue-500" : "")}>
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timestart)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timeend)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize">{event.coursefullname}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize flex gap-2 items-center">{event.name}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">
        <Badge className="min-w-max" variant='filled' key={event.creator.un} pl={0} size="sm" h={22} color="gray.2" radius="xl" leftSection={
            <Avatar size="xs" radius="xl" src={'/local/activities/avatar.php?username=' + event.creator.un}><IconUser /></Avatar>
          }
        >
          <Text className="normal-case font-normal text-black text-sm">{event.creatorsortname}</Text>
        </Badge>
      </Table.Td>
      <Table.Td 
        className="whitespace-nowrap min-w-max"
        onClick={(e) => e.stopPropagation()}
      >
        <ActionIcon variant="light" size="sm" onClick={() => navigate(`/assessment/${event.id}`)}>
          <IconEdit className="size-4" />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  )
}
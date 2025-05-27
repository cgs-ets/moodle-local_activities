import dayjs from "dayjs";
import { Form } from "../../../stores/formStore";
import { cn } from "../../../utils/utils";
import { Anchor, Avatar, Badge, Table, Text } from "@mantine/core";
import { IconEdit, IconExternalLink, IconUser } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

type Props = {
  event: any,
  setSelectedEvent: (form: Form) => void
}
export function TableRow({event, setSelectedEvent}: Props) {

  let navigate = useNavigate();
  const navigateToEvent = (event: any) => {
    navigate(`/assessment/${event.id}`);
  }

  return (
    <Table.Tr key={event.id} onClick={() => navigateToEvent(event)} className={cn("cursor-pointer")}>
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timestart)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timeend)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize">{event.coursefullname}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize flex gap-2 items-center">{event.name}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">
        <Badge className="min-w-max" variant='filled' key={event.creator.un} pl={0} size="sm" h={22} color="gray.2" radius="xl" leftSection={
            <Avatar size="xs" radius="xl" src={'/local/activities/avatar.php?username=' + event.creator.un}><IconUser /></Avatar>
          }
        >
          <Text className="normal-case font-normal text-black text-sm">{event.creator.fn} {event.creator.ln}</Text>
        </Badge>
      </Table.Td>
    </Table.Tr>
  )
}
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
    <Table.Tr onClick={() => setSelectedEvent(event)} key={event.id} className={cn(selected ? "border-b border-blue-500" : "")}>
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timestart)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timeend)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize">{event.coursefullname}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize flex gap-2 items-center">{event.name}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.creatorsortname}</Table.Td>
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
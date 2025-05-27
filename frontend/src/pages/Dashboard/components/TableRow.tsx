import dayjs from "dayjs";
import { Form } from "../../../stores/formStore";
import { cn, isActivity, isCalEntry, isCalReviewer } from "../../../utils/utils";
import { useState } from "react";
import { useAjax } from "../../../hooks/useAjax";
import { ActionIcon } from "@mantine/core";
import { Avatar, Badge, Checkbox, Table, Text } from "@mantine/core";
import { IconEdit, IconUser } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

type Props = {
  event: any,
}

export function TableRow({event}: Props) {
  const [publicNow, setPublicNow] = useState(!!Number(event.pushpublic));
  const [reviewed, setReviewed] = useState(event.statushelper.isapproved);
  const [approvedResponse, approvedError, approvedLoading, submitApprovedAjax, setApprovedData] = useAjax(); // destructure state and fetch function
  const [publicResponse, publicError, publicLoading, submitPublicAjax, setPublicData] = useAjax(); // destructure state and fetch function
  const staffincharge = JSON.parse(event.staffinchargejson || '{}');

  const showPublicNowOpt = () => {
    return isCalReviewer() && isActivity(event.activitytype) && Number(event.displaypublic) && !event.statushelper.isapproved
  }

  const showApproveOpt = () => {
    return isCalReviewer() && isCalEntry(event.activitytype)
  }

  const handlePublicNow = (value: boolean) => {
    setPublicNow(value)
    submitPublicAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-make_public_now',
        args: {
          activityid: event.id,
          pushpublic: value,
        },
      }
    })
  }

  const handleReviewed = (value: boolean) => {
    setReviewed(value)
    submitApprovedAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-approve_cal_entry',
        args: {
          activityid: event.id,
          approved: value,
        },
      }
    })
  }

  const navigate = useNavigate();

  return (
    <Table.Tr 
      key={event.id}
      className={cn(reviewed ? "bg-appgreen" : "")}
    >
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timestart)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timeend)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timecreated)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.activityname}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.statushelper.statusname}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.statushelper.isapproved ? '' : event.stepname}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize">{event.activitytype}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize">{event.campus}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize">{event.location}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize">{event.transport}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.cost}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.permissions == '1' ? "Yes" : "No"}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">
        <Badge className="min-w-max" variant='filled' key={event.creatordata.un} pl={0} size="sm" h={22} color="gray.2" radius="xl" leftSection={
            <Avatar size="xs" radius="xl" src={'/local/activities/avatar.php?username=' + event.creatordata.un}><IconUser /></Avatar>
          }
        >
          <Text className="normal-case font-normal text-black text-sm">{event.creatordata.fn} {event.creatordata.ln}</Text>
        </Badge>
      </Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">
        <Badge className="min-w-max" variant='filled' key={staffincharge.un} pl={0} size="sm" h={22} color="gray.2" radius="xl" leftSection={
            <Avatar size="xs" radius="xl" src={'/local/activities/avatar.php?username=' + staffincharge.un}><IconUser /></Avatar>
          }
        >
          <Text className="normal-case font-normal text-black text-sm">{staffincharge.fn} {staffincharge.ln}</Text>
        </Badge>
      </Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">
        <div className='flex flex-nowrap gap-2 min-w-max'>
          { JSON.parse(event.areasjson ?? '[]')?.map((area: string) => {
            return (
              <Badge key={area} variant='light'>{area}</Badge>
            )
          })}
        </div>
      </Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.displaypublic == '1' ? "Yes" : "No"}</Table.Td>
      { isCalReviewer() &&
        <>
          <Table.Td 
            className="whitespace-nowrap min-w-max"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              disabled={!showApproveOpt()}
              checked={reviewed}
              onChange={(event) => {
                handleReviewed(event.currentTarget.checked);
                event.stopPropagation();
              }}
            />
          </Table.Td>
          <Table.Td 
            className="whitespace-nowrap min-w-max"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              disabled={!showPublicNowOpt()}
              checked={publicNow}
              onChange={(event) => {
                handlePublicNow(event.currentTarget.checked);
                event.stopPropagation();
              }}
            />
          </Table.Td>
        </>
      }
      <Table.Td 
        className="whitespace-nowrap min-w-max"
        onClick={(e) => e.stopPropagation()}
      >
        <ActionIcon variant="light" size="sm" onClick={() => navigate(`/${event.id}`)}>
          <IconEdit className="size-4" />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  )
}
import dayjs from "dayjs";
import { cn, isActivity, isCalEntry, isCalReviewer } from "../../../utils/utils";
import { useState } from "react";
import { useAjax } from "../../../hooks/useAjax";
import { ActionIcon, Popover } from "@mantine/core";
import { Avatar, Badge, Checkbox, Table, Text } from "@mantine/core";
import { IconEdit, IconUser } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

type Props = {
  event: any,
  setSelectedEvent: (event: any) => void,
  selected: boolean,
}

export function TableRow({event, setSelectedEvent, selected}: Props) {
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
      className={cn(reviewed ? "bg-appgreen" : "", selected ? "border-b border-blue-500" : "")}
      onClick={() => setSelectedEvent(event)}
    >
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timestart)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timeend)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{dayjs.unix(Number(event.timecreated)).format("DD/MM/YYYY HH:mm")}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max max-w-96 overflow-hidden text-ellipsis" title={event.activityname}>{event.activityname}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.statushelper.statusname}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.statushelper.isapproved ? '' : event.stepname}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize">{event.activitytype}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize">{event.campus}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize max-w-96 overflow-hidden text-ellipsis" title={event.location}>{event.location}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max capitalize max-w-96 overflow-hidden text-ellipsis" title={event.transport}>{event.transport}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max max-w-96 overflow-hidden text-ellipsis" title={event.cost}>{event.cost}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.permissions == '1' ? "Yes" : "No"}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.creatorsortname}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">{event.staffinchargesortname}</Table.Td>
      <Table.Td className="whitespace-nowrap min-w-max">
        <div className='flex flex-nowrap gap-2 min-w-max'>
          { JSON.parse(event.areasjson ?? '[]')?.slice(0, 3)?.map((area: string) => {
            return (
              <Badge key={area} variant='light'>{area}</Badge>
            )
          })}
          { JSON.parse(event.areasjson ?? '[]')?.length > 3 && (
            <Popover width={200} position="bottom" withArrow shadow="md">
              <Popover.Target>
                <Badge className="cursor-pointer" variant='light'>+{JSON.parse(event.areasjson ?? '[]').length - 3}</Badge>
              </Popover.Target>
              <Popover.Dropdown className="flex flex-wrap gap-2">
                { JSON.parse(event.areasjson ?? '[]')?.slice(3)?.map((area: string) => {
                  return (
                    <Badge key={area} variant='light'>{area}</Badge>
                  )
                })}
              </Popover.Dropdown>
            </Popover>
            
          )}
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
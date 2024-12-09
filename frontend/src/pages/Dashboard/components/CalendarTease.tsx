import { Anchor } from "@mantine/core";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { Form } from "../../../stores/formStore";
import { cn } from "../../../utils/utils";
import { statuses } from "../../../utils";

type Props = {
  celldate: number,
  event: any,
  setSelectedEvent: (form: Form) => void
}
export function CalendarTease({celldate, event, setSelectedEvent}: Props) {
  return (
    <li>
        <Anchor onClick={() => setSelectedEvent(event)} className="te-link no-underline hover:no-underline flex gap-1 items-start pb-2" title={event.activityname}>
          <div className={cn("size-2 rounded-full min-w-2 mt-1", event.status == statuses.approved ? "bg-[#4aa15d]" : "bg-[#ffa94d]")}></div>
          { dayjs.unix(celldate).format("YYYYMMDD") != dayjs.unix(event.timestart).format("YYYYMMDD")
            ? <div className="te-start-time">Cont.</div>
            : <div className="te-start-time">{dayjs.unix(Number(event.timestart)).format("H:mm")}</div>
          }
          <div className="te-title">{event.activityname}</div>
        </Anchor>
    </li>
  )
}
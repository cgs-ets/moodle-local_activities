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
        <Anchor onClick={() => setSelectedEvent(event)} className="no-underline hover:no-underline pb-2" title={event.activityname}>
          <div className="inline-flex gap-1">
            <span className={cn("size-2 rounded-full min-w-2 mt-1", event.status == statuses.approved ? "bg-[#4aa15d]" : "bg-[#ffa94d]")}></span>
            { dayjs.unix(celldate).format("YYYYMMDD") != dayjs.unix(event.timestart).format("YYYYMMDD")
              ? <span className="te-start-time">Cont.</span>
              : <span className="te-start-time">{dayjs.unix(Number(event.timestart)).format("H:mm")}</span>
            }
            <span className="te-title">{event.activityname}</span>
          </div>
        </Anchor>
    </li>
  )
}
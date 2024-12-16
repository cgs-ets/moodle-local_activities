import { Anchor } from "@mantine/core";
import dayjs from "dayjs";
import { Form } from "../../../stores/formStore";
import { cn } from "../../../utils/utils";
import { statuses } from "../../../utils";

type Props = {
  celldate: number,
  event: any,
  setSelectedEvent: (form: Form) => void
}
export function ListTease({celldate, event, setSelectedEvent}: Props) {
  return (
    <div className="relative border-t">
      <span className="hover-line"></span>
      <Anchor onClick={() => setSelectedEvent(event)} className="te-link no-underline hover:no-underline flex gap-1 items-start py-3" title={event.activityname}>
        { dayjs.unix(celldate).format("YYYYMMDD") != dayjs.unix(event.timestart).format("YYYYMMDD")
          ? <div className="te-start-time">Cont.</div>
          : event.is_all_day
            ? <div className="te-start-time">All Day:</div>
            : <div className="te-start-time">{dayjs.unix(Number(event.timestart)).format("H:mm")}</div>
        }
        <div className="te-deets">
          <div className="te-title flex items-center gap-2">
            <div className={cn("size-2 rounded-full min-w-2 mt-1", event.status == statuses.approved ? "bg-[#4aa15d]" : "bg-[#ffa94d]")}></div>
            {event.activityname}
          </div> 
          { dayjs.unix(celldate).format("YYYYMMDD") == dayjs.unix(event.timeend).format("YYYYMMDD")
            ? <span className="te-end-time">Ends at {dayjs.unix(event.timeend).format("H:mm a")}</span>
            : <span className="te-end-time">Ends {dayjs.unix(event.timeend).format("D MMM")} at {dayjs.unix(event.timeend).format("H:mm a")}</span>
          }
        </div>
      </Anchor>
    </div>
  )
}
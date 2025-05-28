import { Anchor } from "@mantine/core";
import dayjs from "dayjs";
import { Form } from "../../../stores/formStore";
import { cn } from "../../../utils/utils";

type Props = {
  celldate: number,
  event: any,
  setSelectedEvent: (form: Form) => void
}
export function ListTease({celldate, event, setSelectedEvent}: Props) {
 
  return (
    <div className={cn("relative border-t bg-gray-50 flex justify-between")}>
      <Anchor 
        onClick={() => setSelectedEvent(event)} 
        className="te-link no-underline hover:no-underline flex gap-1 items-center py-3 justify-between w-full pr-3" 
        title={event.activityname}
      >
        <div>
          { dayjs.unix(celldate).format("YYYYMMDD") != dayjs.unix(event.timestart).format("YYYYMMDD")
            ? <div className="te-start-time">Cont.</div>
            : !!Number(event.isallday)
              ? <div className="te-start-time">All Day:</div>
              : <div className="te-start-time">{dayjs.unix(Number(event.timestart)).format("H:mm")}</div>
          }
          <div className="te-deets">
            <div className="te-title flex items-center gap-2">
              {event.activityname}
            </div> 
            { 
              !!Number(event.isallday)
              ? ''
              : dayjs.unix(celldate).format("YYYYMMDD") == dayjs.unix(event.timeend).format("YYYYMMDD")
                ? <span className="text-gray-500">Ends at {dayjs.unix(event.timeend).format("H:mm a")}</span>
                : <span className="text-gray-500">Ends {dayjs.unix(event.timeend).format("D MMM")} at {dayjs.unix(event.timeend).format("H:mm a")}</span>
            }
            {event.location && <span className="text-gray-500"> - {event.location}</span>}
          </div>
        </div>
      </Anchor>
    </div>
  )
}
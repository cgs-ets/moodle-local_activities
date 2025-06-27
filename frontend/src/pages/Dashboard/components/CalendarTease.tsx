import { Anchor } from "@mantine/core";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { Form } from "../../../stores/formStore";
import { cn } from "../../../utils/utils";
import { statuses } from "../../../utils";
import { StatusDot } from "../../../components/StatusDot";

type Props = {
  celldate: number,
  event: any,
  setSelectedEvent: (form: Form) => void
}
export function CalendarTease({celldate, event, setSelectedEvent}: Props) {
  return (
    <li className={event.occurrenceid ? `act-${event.id}-${event.occurrenceid}` : `act-${event.id}`}>
        <Anchor onClick={() => setSelectedEvent(event)} className="no-underline hover:no-underline pb-2" title={event.activityname}>
          <div className="inline-flex gap-1">
            <StatusDot status={event.status} />
            { dayjs.unix(celldate).format("YYYYMMDD") != dayjs.unix(event.timestart).format("YYYYMMDD")
              ? dayjs.unix(celldate).format("YYYYMMDD") == dayjs.unix(event.timeend).format("YYYYMMDD")
                ? <span className="te-start-time">&lt;{dayjs.unix(Number(event.timeend)).format("H:mm")}</span>
                : <span className="te-start-time">Cont.</span>
              : !!Number(event.isallday)
                ? <span className="te-start-time">All day</span>
                : <span className="te-start-time">{dayjs.unix(Number(event.timestart)).format("H:mm")}</span>
            }
            <span className="te-title">{event.activityname}</span>
          </div>
        </Anchor>
    </li>
  )
}
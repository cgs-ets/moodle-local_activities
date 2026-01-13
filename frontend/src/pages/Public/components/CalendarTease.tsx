import { Anchor } from "@mantine/core";
import dayjs from "dayjs";
import { Form } from "../../../stores/formStore";

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
            { dayjs.unix(celldate).format("YYYYMMDD") != dayjs.unix(event.timestart).format("YYYYMMDD")
              ? <span className="te-start-time">Cont.</span>
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
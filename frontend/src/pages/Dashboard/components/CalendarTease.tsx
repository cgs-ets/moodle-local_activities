import { Anchor } from "@mantine/core";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { Form } from "../../../stores/formStore";

type Props = {
  celldate: number,
  event: any,
  setSelectedEvent: (form: Form) => void
}
export function CalendarTease({celldate, event, setSelectedEvent}: Props) {
  return (
    <li>
        <Anchor onClick={() => setSelectedEvent(event)} /*Link to={`/${event.id}`}*/ className="te-link no-underline hover:no-underline flex gap-1" title={event.activityname}>
          { dayjs.unix(celldate).format("YYYYMMDD") != dayjs.unix(event.timestart).format("YYYYMMDD")
            ? <div className="te-start-time">Cont</div>
            : <div className="te-start-time">{dayjs.unix(Number(event.timestart)).format("H:mm")}</div>
          }
          <div className="te-title">{event.activityname}</div>
        </Anchor>
    </li>
  )
}
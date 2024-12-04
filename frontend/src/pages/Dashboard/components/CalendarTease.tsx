import { Anchor } from "@mantine/core";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

type Props = {
  celldate: number,
  event: any,
}
export function CalendarTease({celldate, event}: Props) {
  return (
    <li>
        <Anchor /*Link to={`/${event.id}`}*/ className="te-link no-underline hover:no-underline flex gap-1" title={event.activityname}>
          { dayjs.unix(celldate).format("YYYYMMDD") != dayjs.unix(event.timestart).format("YYYYMMDD")
            ? <div className="te-start-time">Cont</div>
            : <div className="te-start-time">{dayjs.unix(Number(event.timestart)).format("H:mm")}</div>
          }
          <div className="te-title">{event.activityname}</div>
        </Anchor>
    </li>
  )
}
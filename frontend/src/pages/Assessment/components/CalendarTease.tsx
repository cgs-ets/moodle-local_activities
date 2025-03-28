import { Anchor } from "@mantine/core";
import dayjs from "dayjs";
import { Form } from "../../../stores/formStore";
import { useNavigate } from "react-router-dom";
type Props = {
  celldate: number,
  assessment: any,
  setSelectedEvent: (form: Form) => void
}
export function CalendarTease({celldate, assessment, setSelectedEvent}: Props) {
  let navigate = useNavigate();
  return (
    <li>
        <Anchor onClick={() => navigate(`/assessment/${assessment.id}`)} className="no-underline hover:no-underline pb-2" title={assessment.name}>
          <div className="inline-flex gap-1">
            { dayjs.unix(celldate).format("YYYYMMDD") != dayjs.unix(assessment.timestart).format("YYYYMMDD")
              ? <span className="te-start-time">Cont.</span>
              : <span className="te-start-time">{dayjs.unix(Number(assessment.timestart)).format("H:mm")}</span>
            }
            <span className="te-title">{assessment.name}</span>
          </div>
        </Anchor>
    </li>
  )
}
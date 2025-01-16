import dayjs from "dayjs";
import { AssessmentData } from "../Assessment";
import { Anchor } from "@mantine/core";
import { IconEdit, IconExternalLink } from "@tabler/icons-react";

type Props = {
  assessment: AssessmentData,
  setSelected: (assessment: AssessmentData) => void
}
export function ListTease({assessment, setSelected}: Props) {
  return (
    <div className="relative border-t bg-gray-50">
      <span className="hover-line"></span>
      <div onClick={() => setSelected(assessment)} className="te-link no-underline hover:no-underline flex gap-1 items-start py-3" title={assessment.name}>
        <div className="te-start-time text-lg">{dayjs.unix(Number(assessment.timedue)).format("H:mm")}</div>
        <div className="te-deets">
          <div className="flex items-center gap-3 text-lg">
            <div className="text-gray-900 font-semibold ">{assessment.name}</div>
            <div>{assessment.course.fullname}</div>
            <Anchor
              href={`assessment/${assessment.id}`}
              className="text-sm inline-flex gap-1"
            >
              <IconEdit className="size-4 stroke-1" />
            </Anchor>
            <Anchor
              href={assessment.url}
              target="_blank"
              className="text-sm inline-flex gap-1"
            >
              <IconExternalLink className="size-4 stroke-1" />
            </Anchor>
          </div>
        </div>
      </div>
    </div>
  )
}
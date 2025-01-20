import { Anchor, Checkbox } from "@mantine/core";
import dayjs from "dayjs";
import { Form } from "../../../stores/formStore";
import { cn, isActivity, isCalEntry, isCalReviewer } from "../../../utils/utils";
import { statuses } from "../../../utils";
import { useState } from "react";
import { useAjax } from "../../../hooks/useAjax";

type Props = {
  celldate: number,
  event: any,
  setSelectedEvent: (form: Form) => void
}
export function ListTease({celldate, event, setSelectedEvent}: Props) {
console.log(event)
  const [publicNow, setPublicNow] = useState(!!Number(event.pushpublic));
  const [reviewed, setReviewed] = useState(event.statushelper.isapproved);
  const [approvedResponse, approvedError, approvedLoading, submitApprovedAjax, setApprovedData] = useAjax(); // destructure state and fetch function
  const [publicResponse, publicError, publicLoading, submitPublicAjax, setPublicData] = useAjax(); // destructure state and fetch function
  
  const showPublicNowOpt = () => {
    return isCalReviewer() && isActivity(event.activitytype) && event.displaypublic && !event.statushelper.isapproved
  }

  const showApproveOpt = () => {
    return isCalReviewer() && isCalEntry(event.activitytype)
  }

  const handlePublicNow = (value: boolean) => {
    setPublicNow(value)
    // Send it
    submitPublicAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-make_public_now',
        args: {
          activityid: event.id,
          pushpublic: value,
        },
      }
    })
  }

  const handleReviewed = (value: boolean) => {
    setReviewed(value)
    // Send it
    submitApprovedAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-approve_cal_entry',
        args: {
          activityid: event.id,
          approved: value,
        },
      }
    })
  }


  return (
    <div className={cn("relative border-t bg-gray-50 flex justify-between", reviewed ? "bg-[#d4edda]" : "")}>
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
      { isCalReviewer() &&
        <div className="text-gray-500 flex items-center px-4">

            <div className={cn("w-20 h-full flex items-center justify-center")}>
              <Checkbox
                disabled={!showApproveOpt()}
                checked={reviewed}
                onChange={(event) => handleReviewed(event.currentTarget.checked)}
              />
            </div>
          
            <div className={cn("w-20 h-full flex items-center justify-center", publicNow ? "bg-[#d4edda]" : "")}>
              <Checkbox
                disabled={!showPublicNowOpt()}
                checked={publicNow}
                onChange={(event) => handlePublicNow(event.currentTarget.checked)}
              />
            </div>
        </div>
      }
    </div>
  )
}
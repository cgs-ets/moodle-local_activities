import { ActionIcon, Anchor, Avatar, Button, Card, LoadingOverlay, Select, Switch, Text } from "@mantine/core"
import { IconBell, IconBellOff, IconCalendar, IconCalendarEvent, IconCancel, IconExternalLink, IconPencil, IconPlus, IconUser, IconUserCancel, IconUserCheck, IconUserX, IconX } from "@tabler/icons-react"
import { cn, isCalEntry, isCalReviewer, isExcursion, isExporting } from "../../../../utils/utils"
import { useEffect, useState } from "react";
import { useAjax } from "../../../../hooks/useAjax";
import useFetch from "../../../../hooks/useFetch";
import { Form, useFormStore } from "../../../../stores/formStore";
import { useWorkflowStore } from "../../../../stores/workflowStore";
import { getConfig, statuses } from "../../../../utils";
import { useStateStore } from "../../../../stores/stateStore";

export function CalendarStatus({
  activityid,
}: {
  activityid: number,
}) {
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchData] = useAjax(); // destructure state and fetch function
  const status = useFormStore((state) => state.status)
  const pushpublic = useFormStore((state) => state.pushpublic)
  const displaypublic = useFormStore((state) => state.displaypublic)
  const activitytype = useFormStore((state) => state.activitytype)
  const initialActivitytype = useFormStore((state) => state.initialActivitytype)
  const haschanges = useStateStore((state) => (state.haschanges))
  const [syncs, setSyncs] = useState<any[]>([])
  const setFormData = useFormStore((state) => state.setState)
  const [approvedResponse, approvedError, approvedLoading, submitApprovedAjax, setApprovedData] = useAjax(); // destructure state and fetch function
  const [publicResponse, publicError, publicLoading, submitPublicAjax, setPublicData] = useAjax(); // destructure state and fetch function


  useEffect(() => {
    if (activityid) {
      getCalendarSyncs()
    }
  }, [activityid]);


  const getCalendarSyncs = () => {
    console.log("getting calendar status...")
    setFetchData({
      response: null,
      error: false,
      loading: false,
    })
    fetchAjax({
      query: {
        methodname: 'local_activities-get_calendar_status',
        id: activityid,
      }
    })
  }
  useEffect(() => {
    if (fetchResponse && !fetchError) {
      setSyncs(fetchResponse.data || [])
    }
  }, [fetchResponse]);


  const submitApproved = (approved: boolean) => {
    console.log("approved", approved)
    submitApprovedAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-approve_cal_entry',
        args: {
          activityid: activityid,
          approved: approved,
        },
      }
    })
    setFormData({status: approved ? statuses.approved : statuses.inreview} as Form)
  }

  const submitPublicNow = (publicnow: boolean) => {
    submitPublicAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-make_public_now',
        args: {
          activityid: activityid,
          pushpublic: publicnow,
        },
      }
    })
    console.log("pushpublic", publicnow)
    setFormData({pushpublic: publicnow} as Form)
  }
  
  return (
    activitytype != 'assessment' && 
    (status ?? 0) > statuses.saved &&
    !haschanges
    ? <Card withBorder radius="sm" className="p-0 rounded-t-none -mt-[2px]">
        <div className="px-4 py-2 bg-gray-100">
          <span className="text-sm">Calendar flow</span>
        </div>


        {isCalReviewer() &&
          <div className="relative border-t text-sm w-full">
            <LoadingOverlay visible={fetchLoading} />      
            <div className="flex">
              {isCalEntry(activitytype) &&
                <div 
                  className={cn(
                    "flex-1 flex justify-between items-center gap-2 border-b px-4 h-10",
                    (status ?? 0) == statuses.approved ? "bg-[#e9f8ed]" : ""
                  )}
                >
                  <LoadingOverlay visible={false} />
                  <div>Approved</div>
                  <Switch
                    checked={(status ?? 0) == statuses.approved}
                    onChange={(event) => submitApproved(event.currentTarget.checked)}
                    disabled={isExcursion(activitytype)}
                  />
                </div>
              }

              { displaypublic && (status ?? 0) != statuses.approved
              ? <div 
                  className={cn(
                    "flex-1 flex justify-between items-center gap-2 border-b px-4 h-10 border-l",
                    pushpublic ? "bg-[#e9f8ed]" : ""
                  )}
                >
                  <LoadingOverlay visible={false} />
                  <div>Public now</div>
                  <Switch
                    checked={pushpublic}
                    onChange={(event) => submitPublicNow(event.currentTarget.checked)}
                  />
                </div>
                : null
              }
            </div>
          </div>
        }


        { status == statuses.approved &&
          <div className="relative flex flex-col text-sm">
            {syncs.map((sync: any, i) => {
              return(
                <div key={i} className="flex justify-between items-center gap-2 border-b px-4 h-10 bg-[#e9f8ed]">
                  <Anchor className="text-sm flex items-center gap-1 flex-nowrap" href={sync.weblink}><IconCalendar className="size-4 stroke-1" /> {sync.calendar}</Anchor>
                </div>
              )
            })}
            { !syncs.length
              ? <div className="px-4 py-2">Calendar events not synced yet.</div>
              : null
            }
          </div>
        }

        
      </Card> 
    : null
  )
}

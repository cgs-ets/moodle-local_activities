import { ActionIcon, Anchor, Avatar, Button, Card, LoadingOverlay, Select, Switch, Text } from "@mantine/core"
import { IconBell, IconBellOff, IconCalendar, IconCalendarEvent, IconCancel, IconExternalLink, IconLoader, IconLoader3, IconPencil, IconPlus, IconUser, IconUserCancel, IconUserCheck, IconUserX, IconX } from "@tabler/icons-react"
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
    // Define the interval function
    const interval = setInterval(() => {
      getCalendarSyncs();
    }, 30000); // 60000 ms = 60 seconds
  
    // Run the function initially if activityid is present
    if (activityid) {
      getCalendarSyncs();
    }
  
    // Cleanup function to clear the interval on unmount
    return () => clearInterval(interval);
  }, [activityid, status]);


  const getCalendarSyncs = () => {
    console.log("getting calendar syncs")
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
    setFormData({pushpublic: publicnow} as Form)
    if (!publicnow) {
      setSyncs([])
    }
  }
  
  return (
    activitytype != 'assessment' && 
    status > statuses.saved &&
    !haschanges
    ? <Card withBorder className="p-0 mt-4">
        <div className="px-4 py-3">
          <span className="text-base">Calendar flow</span>
        </div>
        {isCalReviewer() &&
          <div className="relative border-t text-sm w-full">
            <LoadingOverlay visible={fetchLoading} />      
            <div className="flex">
              {isCalEntry(activitytype) &&
                <div 
                  className={cn(
                    "flex-1 flex justify-between items-center gap-2 border-b px-4 h-10",
                    status == statuses.approved ? "bg-[#e9f8ed]" : ""
                  )}
                >
                  <LoadingOverlay visible={false} />
                  <div>Approved</div>
                  <Switch
                    checked={status == statuses.approved}
                    onChange={(event) => submitApproved(event.currentTarget.checked)}
                    disabled={isExcursion(activitytype)}
                  />
                </div>
              }

              { displaypublic && status != statuses.approved
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


        { ((status == statuses.approved) || (pushpublic && status != statuses.approved)) &&
          <div className="relative flex flex-col text-sm">
            {syncs.map((sync: any, i) => {
              return(
                <div key={i} className="flex justify-between items-center gap-2 border-b px-4 h-10 bg-[#e9f8ed]">
                  <Anchor className="text-sm flex items-center gap-1 flex-nowrap" href={sync.weblink}><IconCalendar className="size-4 stroke-1" /> {sync.calendar}</Anchor>
                </div>
              )
            })}
            { !syncs.length
              ? <div className="px-4 py-2">Sync to Outlook pending <IconLoader className="animate-spin inline size-4" /></div>
              : null
            }
          </div>
        }

        
      </Card> 
    : null
  )
}

import { ActionIcon, Anchor, Avatar, Button, Card, LoadingOverlay, Select, Switch, Text } from "@mantine/core"
import { IconBell, IconBellOff, IconCalendar, IconCalendarEvent, IconCancel, IconExternalLink, IconLoader, IconLoader3, IconPencil, IconPlus, IconUser, IconUserCancel, IconUserCheck, IconUserX, IconX } from "@tabler/icons-react"
import { cn, isCalEntry, isCalReviewer, isActivity } from "../../../../utils/utils"
import { useEffect, useState } from "react";
import { useAjax } from "../../../../hooks/useAjax";
import useFetch from "../../../../hooks/useFetch";
import { Form, useFormStore } from "../../../../stores/formStore";
import { useWorkflowStore } from "../../../../stores/workflowStore";
import { getConfig, statuses } from "../../../../utils";
import { useStateStore } from "../../../../stores/stateStore";

export function CalendarFlow({
  activityid,
}: {
  activityid: number,
}) {
  //const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchData] = useAjax(); // destructure state and fetch function
  const api = useFetch()
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
  const viewStateProps = useStateStore((state) => (state.viewStateProps))

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

  const getCalendarSyncs = async () => {
    console.log("getting calendar syncs") 
    const fetchResponse = await api.call({
      query: {
        methodname: 'local_activities-get_calendar_status',
        id: activityid,
      }
    })
    if (!fetchResponse.error) {
      setSyncs(fetchResponse.data || [])
    }
  }

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



  const showSyncs = () => {
    //return ((status == statuses.approved) || (isActivity(activitytype) && displaypublic && pushpublic && status != statuses.approved))
    return status >= statuses.inreview // in review items are in the calendar as tentative...
  }

  const showApproveOpt = () => {
    return isCalReviewer() && isCalEntry(activitytype)
  }

  const showPublicNowOpt = () => {
    return isCalReviewer() && isActivity(activitytype) && displaypublic && status != statuses.approved
  }

  const showSomething = () => {
    return showApproveOpt() || showPublicNowOpt() || showSyncs()
  }

  const showCard = () => {
    return (
      // Activity has been submitted for review OR it is an entry which is automatically in for review.
      (status >= statuses.inreview || (status >= statuses.saved && isCalEntry(activitytype))) &&
      !haschanges &&
      showSomething()
    )
  }
  
  return (
    showCard()
    ? <Card withBorder className="p-0 mt-4" mb="lg">

        <div className="px-4 py-3">
          <span className="text-base">Calendar flow</span>
        </div>
 
        {isCalReviewer() && 
          <div className="relative border-t text-sm w-full">   
            <div className="flex">

              {showApproveOpt() &&
                <div 
                  className={cn(
                    "flex-1 flex justify-between items-center gap-2 border-b px-4 h-10",
                    status == statuses.approved ? "bg-[#d4edda]" : ""
                  )}
                >
                  <LoadingOverlay visible={false} />
                  <div>Approved</div>
                  <Switch
                    checked={status == statuses.approved}
                    onChange={(event) => submitApproved(event.currentTarget.checked)}
                    disabled={isActivity(activitytype)}
                  />
                </div>
              }

              { showPublicNowOpt() &&
                <div 
                  className={cn(
                    "flex-1 flex justify-between items-center gap-2 border-b px-4 h-10 border-l",
                    pushpublic ? "xbg-[#d4edda]" : ""
                  )}
                >
                  <LoadingOverlay visible={false} />
                  <div>Public now</div>
                  <Switch
                    checked={pushpublic}
                    onChange={(event) => submitPublicNow(event.currentTarget.checked)}
                  />
                </div>
              }
            </div>
          </div>
        }


        { showSyncs() &&
          <div className="relative flex flex-col text-sm border-t">
            {syncs.map((sync: any, i) => {
              return(
                <div key={i} className="flex justify-between items-center gap-2 border-b px-4 h-10 xbg-[#d4edda]">
                  <Anchor target="_blank" className="text-sm flex items-center gap-1 flex-nowrap" href={sync.weblink}><IconCalendar className="size-4 stroke-1" /> {sync.calendar}</Anchor>
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

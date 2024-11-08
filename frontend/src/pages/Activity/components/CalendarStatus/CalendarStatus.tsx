import { ActionIcon, Anchor, Avatar, Button, Card, LoadingOverlay, Select, Switch, Text } from "@mantine/core"
import { IconBell, IconBellOff, IconCancel, IconExternalLink, IconPencil, IconPlus, IconUser, IconUserCancel, IconUserCheck, IconUserX, IconX } from "@tabler/icons-react"
import { cn } from "../../../../utils/utils"
import { useEffect, useState } from "react";
import { useAjax } from "../../../../hooks/useAjax";
import useFetch from "../../../../hooks/useFetch";
import { Form, useFormStore } from "../../../../stores/formStore";
import { useWorkflowStore } from "../../../../stores/workflowStore";
import { statuses } from "../../../../utils";
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
  const [syncs, setSyncs] = useState<any[]>([])

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


  
  return (
    (activitytype != 'assessment' ) 
      ? <Card withBorder radius="sm" className="p-0 rounded-t-none -mt-[1px]">

          <div className="px-4 py-2 bg-gray-100">
            <span className="text-sm">Calendar review</span>
          </div>
          <div className="relative border-t text-sm w-full">
            <LoadingOverlay visible={fetchLoading} />      

            <div className="flex">
              <div 
                className={cn(
                  "flex-1 flex justify-between items-center gap-2 border-b px-4 h-10",
                  (status ?? 0) > 1 ? "bg-[#e9f8ed]" : ""
                )}
              >
                <LoadingOverlay visible={false} />
                <div>Approved</div>
                <Switch
                />
              </div>
              
              { displaypublic 
              ? <div 
                  className={cn(
                    "flex justify-between items-center gap-2 border-b px-4 h-10 border-l",
                    pushpublic ? "bg-[#e9f8ed]" : ""
                  )}
                >
                  <LoadingOverlay visible={false} />
                  <div>Public now</div>
                  <Switch
                  />
                </div>
                : null
              }

            </div>


          </div>


          <div className="px-4 py-2 bg-gray-100">
            <span className="text-sm">Outlook sync</span>
          </div>
          
          <div className="relative flex flex-col border-t text-sm">
            {syncs.map((sync: any, i) => {
              return(
                <div key={i} className="flex justify-between items-center gap-2 border-b px-4 h-10 bg-[#e9f8ed]">
                  <Anchor className="text-sm flex items-center gap-1 flex-nowrap" href={sync.weblink}>{sync.calendar} <IconExternalLink className="size-4 stroke-1" /></Anchor>
                </div>
              )
            })}
          </div>

          
        </Card> 
      : null
  )
}

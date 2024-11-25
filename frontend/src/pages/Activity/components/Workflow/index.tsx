import { ActionIcon, Avatar, Button, Card, LoadingOverlay, Select, Switch, Text } from "@mantine/core"
import { IconBell, IconBellOff, IconCancel, IconPencil, IconPlus, IconUser, IconUserCancel, IconUserCheck, IconUserX, IconX } from "@tabler/icons-react"
import { cn, isActivity } from "../../../../utils/utils"
import { useEffect, useState } from "react";
import { useAjax } from "../../../../hooks/useAjax";
import useFetch from "../../../../hooks/useFetch";
import { Form, useFormStore } from "../../../../stores/formStore";
import { useWorkflowStore } from "../../../../stores/workflowStore";
import { Approval } from "./Approval";
import { statuses } from "../../../../utils";
import { useStateStore } from "../../../../stores/stateStore";

export function Workflow({
  activityid,
}: {
  activityid: number,
}) {
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchData] = useAjax(); // destructure state and fetch function
  const [fetchDraftResponse, fetchDraftError, fetchDraftLoading, fetchDraftAjax, setFetchDraftData] = useAjax(); // destructure state and fetch function
  const approvals = useWorkflowStore((state) => state.approvals)
  const setApprovals = useWorkflowStore((state) => state.setApprovals)
  const campus = useFormStore((state) => state.campus)
  const activitytype = useFormStore((state) => state.activitytype)
  const status = useFormStore((state) => state.status)
  const initialCampus = useFormStore((state) => state.initialCampus)
  const initialActivitytype = useFormStore((state) => state.initialActivitytype)

  const [draftApprovals, setDraftApprovals] = useState<any[]>([])
  const savedtime = useStateStore((state) => (state.savedtime))

  useEffect(() => {
    getWorkflow()
  }, [activityid]);

  useEffect(() => {
    setDraftApprovals([])
    if (expectNewWorkflow()) {
      getDraftWorkflow()
    }
  }, [campus, activityid, status, savedtime, initialCampus, activitytype])
  
  const getWorkflow = () => {
    console.log("getting workflow...")
    setFetchData({
      response: null,
      error: false,
      loading: false,
    })
    fetchAjax({
      query: {
        methodname: 'local_activities-get_workflow',
        id: activityid,
      }
    })
  }

  useEffect(() => {
    if (fetchResponse && !fetchError) {
      setApprovals(fetchResponse.data)
    }
  }, [fetchResponse]);

  const expectNewWorkflow = () => {
    return status == statuses.draft || status == statuses.saved || (initialCampus && initialCampus != campus) || (initialActivitytype && initialActivitytype != activitytype)
  }

  const getDraftWorkflow = () => {
    console.log("Getting draft workflow")
    setFetchDraftData({
      response: null,
      error: false,
      loading: false,
    })
    fetchDraftAjax({
      query: {
        methodname: 'local_activities-get_draft_workflow',
        id: activityid,
        activitytype: activitytype,
        campus: campus,
      }
    })
  }
  useEffect(() => {
    if (fetchDraftResponse && !fetchDraftError) {
      if (expectNewWorkflow() && JSON.stringify(approvals.map(a => a.type)) != JSON.stringify(fetchDraftResponse.data.map((a: any) => a.type)) ) {
        setDraftApprovals(fetchDraftResponse.data)
      }
    }
  }, [fetchDraftResponse]);
  

  
  return (
    isActivity(activitytype) && (approvals.length || draftApprovals.length) ?
    <Card withBorder radius="sm" className="p-0 rounded-t-none -mt-[1px]" mb="lg">
      
      
      <div className="px-4 py-2">
        <span className="text-base">Workflow {status == statuses.draft || status == statuses.saved ? "(Not started)" : ""}</span>
      </div>
      
      <div className="relative flex flex-col xborder-t text-sm">
        <LoadingOverlay visible={fetchLoading || fetchDraftLoading} />
        { draftApprovals.length
          ? <div className="z-10 absolute top-0 left-0 w-full h-full xbg-black/40 backdrop-blur-[2px]">
              <IconX stroke={0.3} className="w-full h-full text-gray-500" />
            </div>
          : null
        }
        {approvals.map((approval: any, i) => {
          return(
            <Approval key={approval.id} activityid={activityid} approval={approval} />
          )
        })}
      </div>

      { draftApprovals.length 
        ? <div className="relative flex flex-col text-sm">
            <LoadingOverlay visible={fetchDraftLoading} />
            <div className="hidden z-10 absolute top-0 left-0 w-full h-full bg-green-600/40">
              <IconPlus stroke={0.3} className="w-full h-full text-white" />
            </div>
            {draftApprovals.map((approval: any, i) => {
              return(
                <Approval key={i} activityid={activityid} approval={approval} />
              )
            })}
          </div>
        : null
      }

    </Card> : null
  )
}

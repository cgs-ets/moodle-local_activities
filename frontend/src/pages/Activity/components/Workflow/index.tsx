import { ActionIcon, Avatar, Button, Card, LoadingOverlay, Select, Switch, Text } from "@mantine/core"
import { IconBell, IconBellOff, IconCancel, IconPencil, IconPlus, IconUser, IconUserCancel, IconUserCheck, IconUserX, IconX } from "@tabler/icons-react"
import { cn } from "../../../../utils/utils"
import { useEffect, useState } from "react";
import { useAjax } from "../../../../hooks/useAjax";
import useFetch from "../../../../hooks/useFetch";
import { Form, useFormStore } from "../../../../stores/formStore";
import { useWorkflowStore } from "../../../../stores/workflowStore";
import { Approval } from "./Approval";

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

  const [initialCampus, setInitialCampus] = useState<string>(campus)
  const [draftApprovals, setDraftApprovals] = useState<any[]>([])

  useEffect(() => {
    getWorkflow()
    setInitialCampus(campus)
  }, []);

  useEffect(() => {
    if (activityid > 0 && initialCampus == campus) {
      setDraftApprovals([])
    } else {
      getDraftWorkflow()
    }
  }, [campus])


  
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




  const getDraftWorkflow = () => {
    setFetchDraftData({
      response: null,
      error: false,
      loading: false,
    })
    fetchDraftAjax({
      query: {
        methodname: 'local_activities-get_draft_workflow',
        id: activityid,
        campus: campus,
      }
    })
  }
  useEffect(() => {
    if (fetchDraftResponse && !fetchDraftError) {
      setDraftApprovals(fetchDraftResponse.data)
    }
  }, [fetchDraftResponse]);
  

  
  return (
    (activitytype == 'excursion' || activitytype == 'incursion') && (approvals.length || draftApprovals.length) ?
    <Card withBorder radius="sm" className="p-0 rounded-t-none -mt-1 xborder-t-0">
      <div className="px-4 py-2 bg-gray-100">
        <span className="text-sm">Workflow</span>
      </div>
      
      <div className="relative flex flex-col border-t text-sm">
        <LoadingOverlay visible={fetchLoading} />
        { draftApprovals.length
          ? <div className="z-10 absolute top-0 left-0 w-full h-full bg-red-600/40">
              <IconX stroke={0.3} className="w-full h-full text-white" />
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

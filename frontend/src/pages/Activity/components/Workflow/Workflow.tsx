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
import { SelectApproversModal } from "../Status/SelectApproversModal";

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
  const assessmentid = useFormStore((state) => state.assessmentid)

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
        assessmentid: assessmentid,
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


  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function
  const selectApprovers = (selections: { [key: string]: string }) => {
    console.log("Selected approvers", selections)
    for (let i = 0; i < Object.keys(selections).length; i++) {
      const id = Object.keys(selections)[i]
      const nominated = selections[id]
      if (id && nominated) {
        return submitAjax({
          method: "POST", 
          body: {
            methodname: 'local_activities-nominate_approver',
            args: {
              activityid: activityid,
              approvalid: id,
              nominated: nominated,
            },
          }
        })
      }
    }
  }
  useEffect(() => {
    if (submitResponse && !submitError) {
      setApprovals(submitResponse.data.workflow)
    }
  }, [submitResponse]);

  
  return (
    isActivity(activitytype) && (approvals.length || draftApprovals.length) 
      ? <>
          <Card withBorder radius="sm" className="p-0 rounded-t-none -mt-[1px]" mb="lg">
            
            
            <div className="px-4 py-2">
              <span className="text-base">
                Workflow {expectNewWorkflow() ? "(Not started)" : ""}
              </span>
            </div>
            
            <div className="relative flex flex-col border-t text-sm">
              <LoadingOverlay visible={fetchLoading || fetchDraftLoading} />
              { approvals.length && draftApprovals.length
                ? <div className="z-10 absolute top-0 left-0 w-full h-full xbg-black/40 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center justify-center w-full h-full text-gray-500">
                      <IconX stroke={0.5} className="size-10 text-black" />
                      <div className="text-black">Workflow change based on selections</div>
                    </div>
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

          </Card>
          
          <SelectApproversModal save={selectApprovers} />
        </>
      : null
  )
}

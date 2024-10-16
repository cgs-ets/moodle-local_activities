import { ActionIcon, Card, LoadingOverlay, Switch, Text } from "@mantine/core"
import { IconBell, IconBellOff, IconCancel } from "@tabler/icons-react"
import { cn } from "../../../../utils/utils"
import { useEffect, useState } from "react";
import { useAjax } from "../../../../hooks/useAjax";
import useFetch from "../../../../hooks/useFetch";

export function Workflow({
  activityid,
}: {
  activityid: number,
}) {
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchData] = useAjax(); // destructure state and fetch function
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function

  const [approvals, setApprovals] = useState<any>([])

  useEffect(() => {
    getWorkflow()
  }, []);

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
  
  const saveApproval = (id: string, checked: boolean) => {
    console.log("save approval...")
    return submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-save_approval',
        args: {
          activityid: activityid,
          approvalid: id,
          status: checked ? 1 : 0
        },
      }
    })
  }

  useEffect(() => {
    console.log(submitResponse)
    if (submitResponse && !submitError) {
      // Approval saved - Get the workflow again.
      //getWorkflow()
      setApprovals(submitResponse.data.workflow)
    }
  }, [submitResponse]);

  const onApprove = (id: string, checked: boolean) => {
    const newApprovals = approvals.map((approval: { id: string }) => 
      approval.id === id
        ? { ...approval, status: checked ? "1" : "0" } 
        : approval
    )
    setApprovals(newApprovals)
    saveApproval(id, checked);
  }



  
  return (
    <Card withBorder radius="sm" className="p-0 rounded-t-none -mt-1 xborder-t-0">
      <div className="px-4 py-2">
        <span className="text-sm">Workflow</span>
      </div>
      
      <div className="relative flex flex-col border-t text-sm">
        <LoadingOverlay visible={fetchLoading || submitLoading} />
        {approvals.map((approval: any) => {
          return(
            <div 
              key={approval.id} 
              className={
                cn(
                  "flex justify-between items-center gap-2 border-b px-4 h-10",
                  approval.status == "0" ? "bg-[#ffe8cc]" : (approval.status == "1" ? "bg-[#e9f8ed]" : '')
                )
              }
            >
              <div className="flex items-center gap-2">
                <span>{approval.description}</span>
              </div>
              <div className="flex items-center gap-2">
                { approval.isapprover && approval.canskip && 
                  <ActionIcon variant="transparent" title="Skip Approval">
                    { approval.skip == '1'
                      ? <IconCancel className="size-5" />
                      : <IconBell className="size-5" />
                    }
                  </ActionIcon>
                }
                { approval.isapprover && approval.canapprove && 
                  <Switch
                    checked={approval.status == "1"}
                    onChange={(event) => onApprove(approval.id, event.currentTarget.checked)}
                  />
                }
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

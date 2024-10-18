import { ActionIcon, Avatar, Card, LoadingOverlay, Switch, Text } from "@mantine/core"
import { IconBell, IconBellOff, IconCancel, IconCheck, IconHelpOctagon, IconQuestionMark, IconUser, IconUserCancel, IconUserCheck, IconUserX } from "@tabler/icons-react"
import { cn } from "../../../../utils/utils"
import { useEffect, useState } from "react";
import { useAjax } from "../../../../hooks/useAjax";
import useFetch from "../../../../hooks/useFetch";
import { Form, useFormStore } from "../../../../stores/formStore";
import { useWorkflowStore } from "../../../../stores/workflowStore";

export function WorkflowViewOnly({
  activityid,
}: {
  activityid: number,
}) {
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchData] = useAjax(); // destructure state and fetch function
  const approvals = useWorkflowStore((state) => state.approvals)
  const setApprovals = useWorkflowStore((state) => state.setApprovals)

  useEffect(() => {
    getWorkflow()
  }, []);

  const getWorkflow = () => {
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
  

  
  return (
    approvals.length ?
    <Card withBorder radius="sm" className="p-0 rounded-t-none -mt-1 xborder-t-0">
      <div className="px-4 py-2">
        <span className="text-sm">Workflow</span>
      </div>
      
      <div className="relative flex flex-col border-t text-sm">
        <LoadingOverlay visible={fetchLoading } />
        {approvals.map((approval: any) => {
          return(
            <div 
              key={approval.id} 
              className={
                cn(
                  "flex justify-between items-center gap-2 border-b px-4 h-10",
                  approval.status == "1" 
                  ? "bg-[#e9f8ed]" 
                  : approval.skip == '1' 
                    ? "bg-gray-200" 
                    : approval.status == "0" ? "bg-[#ffe8cc]" : ""
                )
              }
            >
              <div className="flex items-center gap-2">
                <span>{approval.description}</span>
              </div>
              <div className="flex items-center gap-2">
                { approval.username &&
                 <Avatar alt="Approver" size={24} mr={5} src={'/local/activities/avatar.php?username=' + approval.username} radius="xl"><IconUser size={14} /></Avatar>
                }
                { approval.status == '0' && approval.skip == '1' && 
                  <IconCancel className="size-5" /> 
                }
                { approval.skip == '0' && approval.status == "0" &&
                  <IconQuestionMark className="size-5" /> 
                }
                { approval.skip == '0' && approval.status == "1" &&
                  <IconCheck className="size-5" /> 
                }
              </div>
            </div>
          )
        })}
      </div>
    </Card> : null
  )
}

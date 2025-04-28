import { ActionIcon, Avatar, Button, LoadingOverlay, Modal, Select, Switch, Text } from "@mantine/core"
import { IconCancel, IconPencil, IconUser, IconUserCheck } from "@tabler/icons-react"
import { cn } from "../../../../utils/utils"
import { useEffect } from "react";
import { useAjax } from "../../../../hooks/useAjax";
import { Form, useFormStore } from "../../../../stores/formStore";
import { useWorkflowStore } from "../../../../stores/workflowStore";
import { useStateStore } from "../../../../stores/stateStore";
import { useDisclosure } from "@mantine/hooks";

export function Approval({
  approval,
  activityid,
}: {
  approval: any,
  activityid: number,
}) {

  console.log("approval", approval)

  if (!approval) {
    return null
  }

  const setFormData = useFormStore((state) => state.setState)
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function
  const approvals = useWorkflowStore((state) => state.approvals)
  const setApprovals = useWorkflowStore((state) => state.setApprovals)
  const viewStateProps = useStateStore((state) => (state.viewStateProps))
  const [opened, {open, close}] = useDisclosure(false)

  
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
    if (submitResponse && !submitError) {
      setApprovals(submitResponse.data.workflow)
      setFormData({
        status: submitResponse.data.status,
      } as Form)
    }
  }, [submitResponse]);

  const onApprove = (id: string, checked: boolean) => {
    if (viewStateProps.readOnly) {
      return
    }
    const newApprovals = approvals.map((approval: { id: string }) => 
      approval.id === id
        ? { ...approval, status: checked ? "1" : "0" } 
        : approval
    )
    setApprovals(newApprovals)
    saveApproval(id, checked);
  }

  const skipApproval = (id: string, skip: number) => {
    const newApprovals = approvals.map((approval: { id: string }) => 
      approval.id === id
        ? { ...approval, skip: skip ? "1" : "0" } 
        : approval
    )
    setApprovals(newApprovals)
    return submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-skip_approval',
        args: {
          activityid: activityid,
          approvalid: id,
          skip: skip,
        },
      }
    })
  }

  const unsetNominated = (id: string) => {
    const newApprovals = approvals.map((approval: { id: string, nominated: string }) => 
      approval.id === id
        ? { ...approval, nominated: "", currentnominated: approval.nominated } 
        : approval
    )
    setApprovals(newApprovals)
  }

  const updateNominated = (id: string, nominated: string | null) => {
    const newApprovals = approvals.map((approval: { id: string }) => 
      approval.id === id
        ? { ...approval, tempnominated: nominated ? nominated : "" } 
        : approval
    )
    setApprovals(newApprovals)
  }

  const submitNominated = (id: string) => {
    const approval = approvals.filter((approval: { id: string, tempnominated: string }) =>  approval.id === id)
    if (!approval.length) {
      return
    }
    return submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-nominate_approver',
        args: {
          activityid: activityid,
          approvalid: id,
          nominated: approval[0].tempnominated,
        },
      }
    })
  }

  
  return (
    <div 
      key={approval.id} 
      className={
        cn(
          "flex justify-between items-center gap-2 border-b px-4 h-10",
          approval.status == "1" 
          ? "bg-[#d4edda]" 
          : approval.skip == '1' 
            ? "bg-gray-200" 
            : approval.status == "0" 
              ? approval.canapprove
                ? "border-b border-orange-500 bg-[#ffc885]"
                : "bg-[#ffe8cc]" 
              : "",
        )
      }
    >
      <LoadingOverlay visible={submitLoading} />
      <div className="flex items-center gap-2">
        { approval.status == '0' && approval.skip == '0' && approval.selectable
          ? approval.nominated
            ? <div className="flex gap-1 items-center">
                <Avatar onClick={open} className="cursor-pointer" alt="Nominated approver" title="Nominated approver" size={24} mr={5} src={'/local/activities/avatar.php?username=' + approval.nominated} radius="xl"><IconUser /></Avatar> 
                {approval.approvers[approval.nominated].fullname} ({approval.description})
                <ActionIcon variant="transparent"><IconPencil onClick={() => unsetNominated(approval.id)} className="size-4" /></ActionIcon>
              </div>
            : <div className="flex gap-2 items-center">
                <Select
                  size="xs"
                  placeholder={approval.description}
                  value={approval.tempnominated ? approval.tempnominated : approval.currentnominated}
                  onChange={(value) => updateNominated(approval.id, value)}
                  data={Object.keys(approval.approvers).map((a: any) => ({value: approval.approvers[a].username, label: approval.approvers[a].fullname}))}
                  className="flex-1"
                  searchable
                />
                {approval.tempnominated && approval.tempnominated != approval.nominated ? <Button onClick={() => submitNominated(approval.id)} variant="light" size="compact-xs">Save</Button> : '' }
              </div>
          : <span>{approval.description}</span>
        }
      </div>
      <div className="flex items-center gap-2">
        {!approval.selectable || approval.username && (approval.status == '1' || approval.skip == '1') // Not a selectable step, or approved
          ? approval.username && (approval.status == '1' || approval.skip == '1') // approved
            ? <Avatar onClick={open} className="cursor-pointer" alt="Approver" title="Approver" size={24} mr={5} src={'/local/activities/avatar.php?username=' + approval.username}><IconUser /></Avatar>
            : !!approval.approvers
                ? <Avatar.Group onClick={open} className="cursor-pointer">
                    {Object.keys(approval.approvers).slice(0,4).map((approverusername: string, i: number) => {
                      return <Avatar size={24} key={i} src={'/local/activities/avatar.php?username=' + approverusername}><IconUser /></Avatar>
                    })}
                    { Object.keys(approval.approvers).length > 4
                      ?<Avatar size={24}>+{Object.keys(approval.approvers).length - 4}</Avatar>
                      : null
                    }
                  </Avatar.Group>
                : null
          : null
        }
        { approval.status == '0' && approval.isapprover && approval.canskip && 
          <ActionIcon onClick={() => skipApproval(approval.id, approval.skip == '1' ? 0 : 1)} variant="transparent" title={approval.skip == '1' ? "Enable Approval" : "Skip Approval"}>
            { approval.skip == '1'
              ? <IconUserCheck className="size-5" />
              : <IconCancel className="size-5" /> 
            }
          </ActionIcon>
        }
        { approval.skip == '0' && approval.isapprover && approval.canapprove && 
          <Switch
            checked={approval.status == "1"}
            onChange={(event) => onApprove(approval.id, event.currentTarget.checked)}
            styles={{
              track: {
                //backgroundColor: approval.status == "1" ? "#ffc885" : "#dee2e6",
                border: '1px solid #eeb774',
              },
            }}
          />
        }
      </div>
      <Modal
        opened={opened} 
        onClose={close} 
        title={`${approval.description} approvers`}
        size="md"
        styles={{
          header: {
            borderBottom: '0.0625rem solid #dee2e6',
          },
          title: {
            fontWeight: 600,
          },
          body: {
            padding: 0
          }
        }}
        >
          { approval.approvers &&
            <div className="flex flex-col">
              {Object.keys(approval.approvers).map((approverusername: string) => {
                return (
                  <div key={approverusername} className="flex gap-2 border-b px-4 py-2">
                    <Avatar size={24} key={approverusername} src={'/local/activities/avatar.php?username=' + approverusername}><IconUser /></Avatar>
                    <Text>{approval.approvers[approverusername].fullname}</Text>
                  </div>
                )
              })}
            </div>
          }
      </Modal>
    </div>
  )
}

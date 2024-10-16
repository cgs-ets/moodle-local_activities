import { ActionIcon, Card, Switch, Text } from "@mantine/core"
import { IconBell, IconBellOff } from "@tabler/icons-react"
import { cn } from "../../../../utils/utils"

export function Workflow({
  approvals,
  setApprovals,
}: {
  approvals: any,
  setApprovals: React.Dispatch<any>,
}) {

  const onApprove = (id: string, checked: boolean) => {
    const newApprovals = approvals.map((approval: { id: string }) => 
      approval.id === id
        ? { ...approval, status: checked ? "1" : "0" } 
        : approval
    )
    setApprovals(newApprovals)
    // Submit the approval...
  }
  

  return (
    <Card withBorder radius="sm" className="p-0">
      <div className="px-4 py-3">
        <Text fz="md">Approvals</Text>
      </div>
      
      <div className="flex flex-col border-t text-sm">
        {approvals.map((approval: any) => {
          return(
            <div 
              key={approval.id} 
              className={
                cn(
                  "flex justify-between items-center gap-2 border-b px-4 h-10",
                  approval.status == "0" ? "orange.1" : (approval.status == "1" ? "apprgreen.1" : '')
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
                      ? <IconBellOff className="size-5" />
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

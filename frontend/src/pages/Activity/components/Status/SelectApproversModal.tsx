
import { Box, Button, Flex, Modal, Select } from '@mantine/core';
import { IconUsersPlus } from '@tabler/icons-react';
import { useWorkflowStore } from '../../../../stores/workflowStore';
import { useState } from 'react';

type Props = {
  save: (selections: { [key: string]: string }) => void,
}

export function SelectApproversModal({save}: Props) {
  
  const approvals = useWorkflowStore((state) => state.approvals)
  const [selected, setSelected] = useState<{ [key: string]: string }>({})

  // Check to see if any of the approval steps require a selection by the user.
  let active = false
  for (let i = 0; i < approvals.length; i++) {
    if (approvals[i].selectable 
      && approvals[i].selectablebywho == 'planner' 
      && Object.keys(approvals[i].approvers).length > 0 
      && !approvals[i].nominated
      && !approvals[i].currentnominated
    ) {
      active = true
      break
    }
  }

  if (!active) {
    return null
  }

  return (
    <Modal 
      opened={true} 
      onClose={() => {}}
      withCloseButton={false}
      title="Select Approvers" 
      size="xl"
      styles={{
        content: {
          overflow: 'hidden',
        },
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        }
      }}
      >
        <Box pt="md">
          {approvals && approvals.map((approval) => {
            if (approval.selectable && approval.selectablebywho === 'planner') {
              return (
                <Box key={approval.id}>
                  {approval.description}
                  <Select
                    size="xs"
                    placeholder="Nominate approver"
                    value={selected[approval.id]}
                    onChange={(value) => setSelected({...selected, [approval.id]: value})}
                    data={Object.keys(approval.approvers).map((a: any) => ({value: approval.approvers[a].username, label: approval.approvers[a].fullname}))}
                    className="flex-1"
                  />
                </Box>
              )
            }
          })}
          <Flex pt="sm" justify="end">
            <Button onClick={() => save(selected)} leftSection={<IconUsersPlus size="1rem" />} radius="xl" >Select</Button>
          </Flex>
        </Box>
    </Modal>
  );
};
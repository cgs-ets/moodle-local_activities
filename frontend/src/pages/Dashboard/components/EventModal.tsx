
import { Avatar, Badge, Button, Flex, Modal, Text, UnstyledButton } from '@mantine/core';
import { IconChecklist, IconSettings, IconUser } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Form } from '../../../stores/formStore';
import { statuses } from '../../../utils';
import { ActivityDetails } from './ActivityDetails';
import { cn } from '../../../utils/utils';

type Props = {
  activity: Form|null;
  close: () => void;
  hideOpenButton?: boolean;
}

export function EventModal({activity, close, hideOpenButton}: Props) {
  
  if (!activity) {
    return null
  }

  return (
    <Modal.Root 
      opened={true} 
      onClose={() => {
        close()
      }} 
      size="xl"
      >
        <Modal.Overlay />
        <Modal.Content pos="relative" mih={200}>
          <>
            <Modal.Header>
              <Modal.Title>
                <div className='flex items-center gap-4'>
                  <Text fz="xl" fw={600}>{activity.activityname}</Text>
                  { activity.status == statuses.approved
                    ? <Badge color='apprgreen.2' className='text-black normal-case'>Approved</Badge>
                    : activity.status == statuses.saved 
                      ? <Badge color='gray.2' className='text-black normal-case'>Draft</Badge>
                      : <Badge color='orange.1' className='text-black normal-case'>Pending - {activity.stepname}</Badge>
                  }
                </div>
              </Modal.Title>
              <Modal.CloseButton mt={-15} />
            </Modal.Header>
            <Modal.Body p={0}>
              <ActivityDetails activity={activity} />

              { activity.stupermissions && activity.stupermissions.length > 0 &&
                <div className='p-4 border-t flex items-center gap-2'>
                  <UnstyledButton component={Link} to={`/${activity.id}/permission`}>
                    <Avatar.Group className="cursor-pointer">
                      {activity.stupermissions.map((permission: any) => {
                        let color = 'border-yellow-500'
                        if (permission.response == 1) {
                          color = 'border-green-500'
                        } else if (permission.response == 2) {
                          color = 'border-red-500'
                        }
                        return (
                          <Avatar
                            className={cn('border-2', color)}
                            size={30} 
                            key={permission.student.un} 
                            src={'/local/activities/avatar.php?username=' + permission.student.un}
                          >
                            <IconUser />
                          </Avatar>
                        )
                      })}
                    </Avatar.Group>
                  </UnstyledButton>
                  <Button component={Link} to={`/${activity.id}/permission`} size="compact-md" radius="lg" color="blue" leftSection={<IconChecklist size={20} />}>Permissions</Button>
                </div>
              }

              { !hideOpenButton && 
                <Flex className='mt-3 gap-2 justify-between p-3 pt-0'>
                  <div></div>
                  <Link to={"/" + activity.id}><Button radius="lg" size="compact-md" variant="filled" leftSection={<IconSettings className='size-4' />}>Open</Button></Link> 
                </Flex>
              }
            </Modal.Body>
          </>
        </Modal.Content>
      </Modal.Root>
        
  );
};
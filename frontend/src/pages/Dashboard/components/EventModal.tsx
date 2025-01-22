
import { Badge, Button, Flex, Modal, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Form } from '../../../stores/formStore';
import { statuses } from '../../../utils';
import { ActivityDetails } from './ActivityDetails';

type Props = {
  activity: Form|null;
  close: () => void
}

export function EventModal({activity, close}: Props) {
  
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
              <Flex className='mt-3 gap-2 justify-between p-3 pt-0'>
                <div></div>
                <Link to={"/" + activity.id}><Button radius="lg" size="compact-md" variant="filled" leftSection={<IconSettings className='size-4' />}>Open</Button></Link> 
              </Flex>
            </Modal.Body>
          </>
        </Modal.Content>
      </Modal.Root>





        
  );
};
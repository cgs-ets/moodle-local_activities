
import { Badge, Button, Card, Flex, Group, Menu, Modal, Text } from '@mantine/core';
import { IconCalculator, IconCalendarCode, IconCalendarEvent, IconChevronDown, IconCircleOff, IconSettings, IconTrash, IconUserCheck } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Form } from '../../../stores/formStore';
import { ActivityDetails } from '../../../components/ActivityDetails/ActivityDetails';

type Props = {
  activity: Form|null;
  close: () => void
}

export function EventModal({activity, close}: Props) {
  
  if (!activity) {
    return null
  }

  const aux = {...activity, activityname: ""}
  console.log(aux)

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
              <Modal.Title><Text fz="xl" fw={600}>{activity.activityname}</Text></Modal.Title>
              <Modal.CloseButton mt={-15} />
            </Modal.Header>
            <Modal.Body p={0}>
              <ActivityDetails activity={aux} />
              <Flex className='mt-3 gap-2 justify-between p-3 pt-0'>
                <Flex>
                Pending - Step name/Approved
                Is waiting for you?



                  
                </Flex>
                <Link to={"/" + activity.id}><Button radius="lg" size="compact-md" variant="filled" leftSection={<IconSettings className='size-4' />}>Open</Button></Link> 
              </Flex>
            </Modal.Body>
          </>
        </Modal.Content>
      </Modal.Root>





        
  );
};
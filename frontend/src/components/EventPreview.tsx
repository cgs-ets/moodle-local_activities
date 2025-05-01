
import { Avatar, Button, Flex, Modal, Text, UnstyledButton } from '@mantine/core';
import { IconChecklist, IconSettings, IconUser } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Form } from '../stores/formStore';
import { ActivityDetails } from './ActivityDetails';
import { cn } from '../utils/utils';
import DownloadIcalButton from './DownloadIcalButton';
import { Header as PublicHeader } from '../pages/Public/components/Header';
import { Header as PrivateHeader } from '../components/Header';

type Props = {
  activity: Form|null;
  hideOpenButton?: boolean;
  isPublic?: boolean;
}

export function EventPreview({activity, hideOpenButton, isPublic}: Props) {
  
  if (!activity) {
    return null
  }

  return (
    <>
      { isPublic
        ? <PublicHeader calType={'calendar'} />
        : <PrivateHeader />
      }

      <Modal.Root 
        opened={true} 
        onClose={() => {}} 
        size="xl"
        styles={{
          content: {
            marginTop: '55px',
          },
          inner: {
            zIndex: 1,
          }
        }}
      >
  
        <Modal.Content pos="relative" mih={200}>
          <>
            <Modal.Header>
              <Modal.Title className='w-full'>
                <div className='flex items-center justify-between gap-4'>
                  <Text fz="xl" fw={600} className="first-letter:uppercase">{activity.activityname}</Text>
                  <DownloadIcalButton events={[activity]} isPublic={!!isPublic} />
                </div>
              </Modal.Title>

            </Modal.Header>
            <Modal.Body p={0}>

              <ActivityDetails activity={activity} isPublic={!!isPublic} />

              { !isPublic && activity.stupermissions && activity.stupermissions.length > 0 &&
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
    </>
  );
};
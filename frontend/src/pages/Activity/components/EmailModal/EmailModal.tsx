
import { Box, Button, Modal, Textarea } from '@mantine/core';
import { useStateStore } from '../../../../stores/stateStore';
import { useFormStore } from '../../../../stores/formStore';
import { IconMail, IconMailOpened, IconSend } from '@tabler/icons-react';
import { EmailActivityDetails } from './EmailActivityDetails';

export function EmailModal({opened, close} : {opened: boolean, close: () => void}) {
  const haschanges = useStateStore((state) => (state.haschanges))
  const activityname = useFormStore((state) => (state.activityname))

  const parentname = '[Parent]';
  const studentname = '[Student]';
  const buttonoverride = '[Button for parent response]';

  const changesWarning = (
    <div>You must save changes to student list before you may send messages.</div>
  )


  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title={
        <div className='flex items-center gap-1'>
          <IconMailOpened className="size-5 text-gray-700 stroke-1 mr-2" /> Subject: Permissions required for: {activityname}
        </div>
      }
      size="xl" 
      styles={{
        body: {
          padding: '0',
        },
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        }
      }}
      >
        <Box>
          { haschanges
            ? changesWarning
            : <>
                <div className='browser-window'>
                  <div className='p-5 text-base flex flex-col gap-4'>
                    <div>Dear {parentname},</div>
          
                    <div>The following activity requires your permission for {studentname} to attend.</div>
          
                    <Textarea size="md" placeholder="Optionally enter custom text here..."></Textarea>
          
                    <div className='rounded-sm bg-[#f0f4f6] p-4'>
                        <table>
                            <EmailActivityDetails />
                        </table>
                    </div>
                
                    <div>{buttonoverride}</div>
                  </div>
                  <div className='px-5 pt-2 pb-6 flex justify-end'>
                    <Button size="compact-md" radius="xl" leftSection={<IconSend size={14} />} className="bg-tablr-blue">Send email to parents</Button>
                  </div>
                </div>
              </>
          }
        </Box>
    </Modal>
  );
};
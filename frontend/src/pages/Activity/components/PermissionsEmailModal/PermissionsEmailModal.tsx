
import { Box, Button, Flex, Modal, Text, Textarea, Transition } from '@mantine/core';
import { useStateStore } from '../../../../stores/stateStore';
import { Form, useFormStore } from '../../../../stores/formStore';
import { IconCheck, IconMail, IconMailOpened, IconSend } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useAjax } from '../../../../hooks/useAjax';
import { ActivitySummary } from '../../../../components/ActivitySummary/ActivitySummary';
import { useTimeout } from '@mantine/hooks';

export function PermissionsEmailModal({opened, close} : {opened: boolean, close: () => void}) {
  const haschanges = useStateStore((state) => (state.haschanges))
  const activityid = useFormStore((state) => (state.id))
  const activityname = useFormStore((state) => (state.activityname))
  const [optionalText, setOptionalText] = useState<string>('')
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function
  const [showSuccess, setShowSuccess] = useState(false)
  const {start, clear} = useTimeout(() => close(), 3000);
  const setFormData = useFormStore((state) => state.setState)

  const changesWarning = (
    <div className='p-5 text-base'>You must save changes to student list before you may send messages.</div>
  )

  useEffect(() => {
    if (opened) {
      setOptionalText('')
      setShowSuccess(false)
    }
  }, [opened])

  const onSend = () => {
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-send_email',
        args: {
          activityid: activityid,
          extratext: optionalText,
          includes: ['details', 'permissions'],
          audiences: ['parents'],
        },
      }
    })
  }

  useEffect(() => {
    if (!submitError && submitResponse) {
      setShowSuccess(true)
      start()
      setFormData({permissionsent: true} as Form)
    }
  }, [submitResponse])

  const success = (
    <Transition mounted={showSuccess} transition="fade" duration={500} timingFunction="ease">
      {(styles) => 
        <Flex mb="xl" direction="column" align="center" style={{ ...styles }}>
          <IconCheck size={45} color="green"/>
          <Text fz="md">Success! Emails are being sent.</Text>
        </Flex> 
      }
    </Transition>
  )

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title={
        <div className='flex items-center gap-1'>
          <IconMailOpened className="size-5 text-gray-700 stroke-1 mr-2" /> Permissions required for: {activityname}
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
          { showSuccess
            ? success
            : haschanges
              ? changesWarning
              : <>
                  <div className='browser-window'>
                    <div className='p-5 text-base flex flex-col gap-4'>
                      <div>Dear [Parent],</div>
            
                      <div>The following activity requires your permission for [Student] to attend.</div>
            
                      <Textarea 
                        value={optionalText}
                        onChange={(e) => setOptionalText(e.currentTarget.value)}
                        size="md" 
                        placeholder="Optionally enter custom text here..."
                      />
            
                      <div className='rounded-sm bg-[#f0f4f6] p-4'>
                        <ActivitySummary />
                      </div>
                  
                      <div>[Button for parent response]</div>
                    </div>
                    <div className='px-5 pt-2 pb-6 flex justify-end'>
                      <Button onClick={onSend} size="compact-md" radius="xl" leftSection={<IconSend size={14} />}>Send email to parents</Button>
                    </div>
                  </div>
                </>
          }
        </Box>
    </Modal>
  );
};
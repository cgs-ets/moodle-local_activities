
import { Avatar, Badge, Box, Button, Checkbox, CloseButton, Flex, Group, Modal, Paper, ScrollArea, Text, TextInput, Textarea, Transition } from '@mantine/core';
import { useEffect, useState } from 'react';
import { IconCheck, IconMailOpened, IconSend, IconUser } from '@tabler/icons-react';
import { useTimeout } from '@mantine/hooks';
import { useAjax } from '../../../../hooks/useAjax';
import { Student, User } from '../../../../types/types';
import { ActivitySummary } from '../../../../components/ActivitySummary/ActivitySummary';
import { useFormStore } from '../../../../stores/formStore';

type Props = {
  opened: boolean,
  close: () => void,
  students: Student[]
}

export function EmailModal({opened, close, students}: Props) {
  const activityid = useFormStore((state) => (state.id))
  const activityname = useFormStore((state) => (state.activityname))
  const [message, setMessage] = useState<string>('')
  const [audiences, setAudiences] = useState<string[]>(['students', 'parents', 'staff'])
  const [includes, setIncludes] = useState<string[]>(['details'])
  const [recipients, setRecipients] = useState<User[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax();
  const {start, clear} = useTimeout(() => onClose(), 3000);

  useEffect(() => {
    if (opened) {
      setMessage('')
      setShowSuccess(false)
    }
  }, [opened])

  useEffect(() => {
    if (students?.length) {
      const cleaned = students.map((student) => {
        const {parents, permission, ...rest} = student;
        return rest
      })
      setRecipients(cleaned)
    }
  }, [students, opened])

  const onSend = () => {
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-send_email',
        args: {
          scope: recipients,
          activityid: activityid,
          extratext: message,
          includes: includes,
          audiences: audiences,
        },
      }
    })

  }
  useEffect(() => {
    if (!submitError && submitResponse) {
      setShowSuccess(true)
      start()
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

  const onRemove = (username: string) => {
    if (recipients.length == 1) {
      // At least one recipient is needed.
      return;
    }
    setRecipients( 
      (current) => current.filter(function( student ) {
        return student.un !== username;
      })
    )
  }

  const student = (data: User) => {
    return (
        <Badge key={data.un} variant='filled' p={0} color="gray.2" size="lg" radius="xl" leftSection={
          <Avatar alt={data.fn + " " + data.ln} size={24} mr={5} src={'/local/activities/avatar.php?username=' + data.un} radius="xl"><IconUser size={14} /></Avatar>
        }>
          <Flex gap={4}>
            <Text className="normal-case font-normal text-black text-sm">{data.ln + ", " + data.fn}</Text>
            <CloseButton
              onMouseDown={() => onRemove(data.un)}
              variant="transparent"
              size={22}
              iconSize={14}
              tabIndex={-1}
            />
          </Flex>
        </Badge>
    )
  }

  useEffect(() => {
    if (includes.includes("permissions")) {
      setAudiences(['parents'])
    }
  }, [includes])

  const onClose = () => {
    setMessage('')
    setAudiences(['students', 'parents', 'staff'])
    setIncludes(['details'])
    setSubmitData({
      response: null,
      error: false,
      loading: false,
    })
    close()
  }

  
  
  const messageForm = (
    <Box>
      <Box mb="md">
        <Text fz="sm" mb={5} fw={500} c="#212529">Scope</Text>
        <ScrollArea h={recipients.length > 12 ? 100 : 'auto'} type="auto">
          <Group gap="xs">
            { recipients.map(item => student(item)) }
          </Group>
        </ScrollArea>
      </Box>

      <Box mb="md">
        <Text fz="sm" mb={5} fw={500}>Presets</Text>
        <Checkbox.Group
          value={includes}
          onChange={setIncludes}
        >
          <Flex mt="xs" gap="xs" direction="column">
            <Checkbox value="permissions" label="Include permissions" />
            <Checkbox value="details" label="Include activity details" />
          </Flex>
        </Checkbox.Group>
      </Box>

      <div className='bg-gray-50 -mx-4 mb-4 border-y'>
        <div className='p-5 text-base flex flex-col gap-4'>
          <div>Dear { includes.includes('permissions') ? '[Parent]' : '[Name]' },</div>

          { includes.includes('permissions') &&
            <div>The following activity requires your permission for [Student] to attend.</div>
          }

          <Textarea
            label=""
            placeholder="Type your message here"
            autosize
            minRows={4}
            maxRows={10}
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
          />

          { includes.includes('details') &&
            <div className='rounded-sm bg-[#f0f4f6] p-4'>
              <ActivitySummary />
            </div>
          }
      
          { includes.includes('permissions') && <div>[Button for parent response]</div> }
        </div>
      </div>


      <Box mb="md">
        <Text fz="sm" mb={5} fw={500}>Recipients</Text>
        {includes.includes("permissions") && <Text fz="sm" mb={5} fs="italic">Permissions emails are sent to parents only.</Text>}
        <Checkbox.Group
          value={audiences}
          onChange={setAudiences}
        >
          <Flex mt="xs" gap="xs" direction="column">
            <Checkbox value="students" label="Students" disabled={includes.includes("permissions")} />
            <Checkbox value="parents" label="Parents" disabled={includes.includes("permissions")} />
            <Checkbox value="staff" label="Activity staff" disabled={includes.includes("permissions")} />
          </Flex>
        </Checkbox.Group>
      </Box>

      <Flex justify="end">
        <Button leftSection={<IconSend size="1rem" />} onClick={onSend} loading={submitLoading} type="submit" radius="xl" >Send</Button>
      </Flex>
    </Box>
  )

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      //title="Send message" 
      title={
        <div className='flex items-center gap-1'>
          <IconMailOpened className="size-5 text-gray-700 stroke-1 mr-2" /> {activityname}
        </div>
      }
      size="xl" 
      styles={{
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        }
      }}
      >
        <Box pt="md">
          { showSuccess
            ? success
            : messageForm
          }
        </Box>
    </Modal>
  );
};
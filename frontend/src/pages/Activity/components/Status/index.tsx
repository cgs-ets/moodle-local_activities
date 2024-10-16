import { Card, Group, Button, Text, Menu, Loader, Transition, Box,  } from '@mantine/core';
import { IconDots, IconCloudUp, IconCheckbox, IconArrowMoveLeft, IconCheck } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTimeout } from '@mantine/hooks';
import { statuses } from '../../../../utils';
import { useAjax } from '../../../../hooks/useAjax';
import { useParams } from 'react-router-dom';
import { useFormStore } from '../../../../stores/formStore';
import { useStateStore } from '../../../../stores/stateStore';
import { entryStatus, excursionStatus, showExcursionFields } from '../../../../utils/utils';


export function Status({submitLoading, submitError, submitResponse}: {submitLoading: boolean, submitError: boolean, submitResponse: any}) {
  let { id } = useParams();

  const formData = useFormStore()
  const status = useFormStore((state) => (state.status))
  const haschanges = useStateStore((state) => (state.haschanges))
  const updateHash = useStateStore((state) => (state.updateHash))
  const baselineHash = useStateStore((state) => (state.baselineHash))
  const hash = useStateStore((state) => (state.hash))

  useEffect(() => {
    if (!hash) {
      baselineHash()
    } else {
      updateHash()
    }
  }, [formData])

  const [saveComplete, setSaveComplete] = useState(false);
  const { start, clear } = useTimeout(() => setSaveComplete(false), 5000);
  useEffect(() => {
    if (!submitError && submitResponse) {
      //console.log("Just saved.. popup a link to go read only activity, or back back to list.")
      setSaveComplete(true)
      start()
    }
  }, [submitResponse])

  useEffect(() => {
    if (submitLoading) {
      clear()
    }
  }, [submitLoading])


  const [pubResponse, pubError, pubLoading, pubAjax] = useAjax(); // destructure state and fetch function
  const updateStatus = (newStatus: number) => {
    pubAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-update_status',
        args: {
          id: id,
          status: newStatus
        },
      }
    })
  }
  const handleSendReview = () => {
    updateStatus(statuses.inreview)
  }
  const handleReturnToPlanning = () => {
    updateStatus(statuses.draft)
  }
  useEffect(() => {
    if (!pubError && pubResponse) {
      setSaveComplete(true)
      start()
      /*setMetaState({
        status: pubResponse.data.status,
      })*/
    }
  }, [pubResponse])

  let errMessage = null;
  if (submitError && submitResponse.exception) {
    errMessage = submitResponse.exception.message;
  }

  const showReviewButton = () => {
    return showExcursionFields() && !haschanges && status == statuses.draft
  }

  const statusText = () => {
    return showExcursionFields()
    ? excursionStatus()
    : entryStatus()
  }

  //if (id && (!formloaded || !studentsloaded)) {
  //  return null
  //}

  return (
    <Card withBorder radius="sm" p="md"  className="overflow-visible"
      bg={status == statuses.inreview ? "orange.1" : (status == statuses.approved ? "apprgreen.1" : '')}
    >
      <div className="page-pretitle">Status</div>      
      <Text size="md" fw={500}>{ statusText() }</Text>

      { submitLoading || pubLoading && <Loader size="sm" m="xs" pos="absolute" right={5} top={5} /> }
      <Transition mounted={(!submitLoading && !submitError && !haschanges && saveComplete)} transition="fade" duration={500} timingFunction="ease">
        {(styles) => 
          <Box style={{ ...styles, position: 'absolute', top: 15,  right: 15 }}>
            <IconCheck size={21} color='teal'/>
          </Box> 
        }
      </Transition>
      
      { !submitLoading && (errMessage || haschanges) &&
        <Text color="red" size="sm">
            { errMessage ? errMessage : 'There are unsaved changes.' }
        </Text>
      }

      { !submitLoading && !errMessage && !haschanges &&
        <Text color="dimmed" size="sm">
        { status == statuses.draft 
          ? "All information is saved."
          : status == statuses.inreview
            ? "Your activity is under review. You may continue to update information."
            : status == statuses.approved 
              ? "Activity is approved! You may continue to make changes to information."
              : "Get started by entering the details for this activity."
        }
        </Text>
      }

      <Group justify="space-between" mt="xs">
        <Group gap="xs">
          { haschanges && 
            <Button 
              type="submit" 
              size="compact-md" 
              radius="xl" 
              leftSection={<IconCloudUp className='size-4' />} 
              loading={submitLoading}>
                Save { haschanges ? " changes" : "" }
            </Button>
          }
          { showReviewButton() && <Button color="apprgreen" onClick={handleSendReview} size="compact-md" radius="xl" leftSection={<IconCheckbox size={14} />} loading={pubLoading}>Send for review</Button> }
        </Group>
        { (status == statuses.approved) &&
          <Menu shadow="lg" position="bottom">
            <Menu.Target>
              <Button  size="compact-md" variant="subtle" radius="xl"><IconDots size="1rem" /></Button>
            </Menu.Target>
            <Menu.Dropdown>       

              { status == statuses.approved && 
                <Menu.Item onMouseDown={handleReturnToPlanning} leftSection={<IconArrowMoveLeft size={14} />}>Return to planning status</Menu.Item>
              }

            </Menu.Dropdown>
          </Menu>
        }
      </Group>
    </Card>
  )

}
import { Card, Group, Button, Text, Menu, Loader, Transition, Box,  } from '@mantine/core';
import { IconDots, IconCloudUp, IconCheckbox, IconArrowMoveLeft, IconCheck } from '@tabler/icons-react';
//import { useClipboard } from 'use-clipboard-copy';
import { useEffect, useState } from 'react';
import { useFormMetaStore, useFormStateStore } from '../../store/formMetaStore';
import { useBasicDetailsStore, useStaffDetailsStore, useStudentListStore } from "../../store/formFieldsStore"
import { useTimeout } from '@mantine/hooks';
import { statuses } from '../../../../utils';
import { useAjax } from '../../../../hooks/useAjax';
import { useParams } from 'react-router-dom';

export function Status({submitLoading, submitError, submitResponse}: {submitLoading: boolean, submitError: boolean, submitResponse: any}) {
  let { id } = useParams();

  const basic = useBasicDetailsStore()
  const staff = useStaffDetailsStore()
  const students = useStudentListStore()
  const meta = useFormMetaStore()
  const setMetaState = useFormMetaStore((state) => state.setState)
  const status = useFormMetaStore((state) => (state.status))
  const formloaded = useFormStateStore((state) => (state.formloaded))
  const studentsloaded = useFormStateStore((state) => (state.studentsloaded))
  const haschanges = useFormStateStore((state) => (state.haschanges))
  const updateHash = useFormStateStore((state) => (state.updateHash))

  useEffect(() => {
    if (!id || (formloaded && studentsloaded)) {
      // Everything is loaded now.
      updateHash()
    }
  }, [basic, staff, students, meta])

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

  // Get current status.
  /*const clipboard = useClipboard({
    copiedTimeout: 1000,
  });
  const handleCopyLink = useCallback(
    () => {
      clipboard.copy(window.location)
    },
    [clipboard.copy]
  )*/



  const [pubResponse, pubError, pubLoading, pubAjax] = useAjax(); // destructure state and fetch function
  const updateStatus = (newStatus: number) => {
    pubAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-publish_activity',
        args: {
          id: id,
          publish: newStatus
        },
      }
    })
  }
  const handlePublish = () => {
    updateStatus(1)
  }
  const handleReturnToPlanning = () => {
    updateStatus(0)
  }
  useEffect(() => {
    if (!pubError && pubResponse) {
      setSaveComplete(true)
      start()
      setMetaState({
        status: pubResponse.data.status,
      })
    }
  }, [pubResponse])

  


  let errMessage = null;
  if (submitError && submitResponse.exception) {
    errMessage = submitResponse.exception.message;
  }

  if (id && (!formloaded || !studentsloaded)) {
    return null
  }

  return (
    <Card withBorder radius="sm" p="md" mb="lg" className="overflow-visible"
      bg={status == statuses.saved ? "orange.1" : (status == statuses.live ? "apprgreen.1" : '')}
    >
      <div className="page-pretitle">Status</div>      
      <Text size="md" fw={500}>
      { status == statuses.unsaved && "Draft"}
      { status == statuses.saved && "Draft"}
      { status == statuses.live && "Published"}
      </Text>

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
        { status == statuses.saved 
          ? "Publish this activity to make it visible."
          : status == statuses.live 
            ? "Activity is live! You may continue to make changes to information."
            : "Get started by entering the details for this activity."
        }
        </Text>
      }

      <Group justify="space-between" mt="xs">
        <Group gap="xs">
          <Button type="submit" size="compact-md" radius="xl" leftSection={<IconCloudUp size={14} />} loading={submitLoading}>Save { haschanges ? " changes" : "" }</Button>
          { !haschanges && status == statuses.saved && <Button onClick={handlePublish} size="compact-md" radius="xl" leftSection={<IconCheckbox size={14} />} loading={pubLoading}>Publish</Button> }
        </Group>
        { (status == statuses.live) &&
          <Menu shadow="lg" position="bottom">
            <Menu.Target>
              <Button  size="compact-md" variant="outline" radius="xl" rightSection={<IconDots size="1rem" />} >More</Button>
            </Menu.Target>
            <Menu.Dropdown>       

              { status == statuses.live && 
                <Menu.Item onMouseDown={handleReturnToPlanning} leftSection={<IconArrowMoveLeft size={14} />}>Return to planning status</Menu.Item>
              }

            </Menu.Dropdown>
          </Menu>
        }
      </Group>
    </Card>
  )

}
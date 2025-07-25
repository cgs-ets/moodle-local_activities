import { Card, Group, Button, Text, Menu, Loader, Transition, Box } from '@mantine/core';
import { IconDots, IconCloudUp, IconCheckbox, IconArrowMoveLeft, IconCheck, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useDisclosure, useTimeout } from '@mantine/hooks';
import { statuses } from '../../../../utils';
import { useAjax } from '../../../../hooks/useAjax';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, useFormStore } from '../../../../stores/formStore';
import { useStateStore } from '../../../../stores/stateStore';
import { entryStatus, excursionStatus, isActivity, isCalEntry } from '../../../../utils/utils';
import { useWorkflowStore } from '../../../../stores/workflowStore';

export function Status({
  submitLoading, 
  submitError, 
  submitResponse
}: {
  submitLoading: boolean, 
  submitError: boolean, 
  submitResponse: any
}) {
  let { id } = useParams();

  const formData = useFormStore()
  const status = useFormStore((state) => (state.status))
  const activitytype = useFormStore((state) => (state.activitytype))
  const initialActivitytype = useFormStore((state) => (state.initialActivitytype))
  const assessmentid = useFormStore((state) => (state.assessmentid))
  const haschanges = useStateStore((state) => (state.haschanges))
  const updateHash = useStateStore((state) => (state.updateHash))
  const baselineHash = useStateStore((state) => (state.baselineHash))
  const hash = useStateStore((state) => (state.hash))
  const setFormData = useFormStore((state) => state.setState)
  const setApprovals = useWorkflowStore((state) => state.setApprovals)

  const formloaded = useStateStore((state) => (state.formloaded))
  const studentsloaded = useStateStore((state) => (state.studentsloaded))
  const viewStateProps = useStateStore((state) => (state.viewStateProps))

  // When everything is loaded, set the baseline.
  useEffect(() => {
    console.log("baselineHash", formloaded, studentsloaded, isCalEntry(activitytype), isActivity(initialActivitytype))
    console.log("initialActivityType", initialActivitytype)

    if (formloaded && (isCalEntry(activitytype) || (isActivity(initialActivitytype) && studentsloaded))) {
      baselineHash()
    }
  }, [formloaded, studentsloaded, initialActivitytype, activitytype])

  // Whenever something changes, update the hash.
  useEffect(() => {
    if (hash) {
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


  const [deleteResponse, deleteError, deleteLoading, deleteAjax, setDeleteData] = useAjax(); // destructure state and fetch function
  const navigate = useNavigate()
  const handleDelete = () => {
    deleteAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-delete_activity',
        args: {
          id: id,
        },
      }
    })
  }
  useEffect(() => {
    if (deleteResponse) {
      navigate('/')
    }
  }, [deleteResponse]);



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


  useEffect(() => {
    if (!pubError && pubResponse) {
      setSaveComplete(true)
      start()
      setFormData({
        status: pubResponse.data.status,
      } as Form)
      //console.log('pubResponse.data.workflow', pubResponse.data.workflow)
      setApprovals(pubResponse.data.workflow)
    }
  }, [pubResponse])

  let errMessage = null;
  if (submitError && submitResponse.exception) {
    errMessage = submitResponse.exception.message;
  }

  const showReviewButton = () => {
    return isActivity(activitytype) && !haschanges && status == statuses.saved
  }

  const statusText = () => {
    return isActivity(activitytype)
    ? excursionStatus()
    : entryStatus()
  }

  const getExtraOptions = () => {
    let options = []

    if (status > statuses.saved) {
      options.push(<Menu.Item key={1} onMouseDown={() => updateStatus(1)} leftSection={<IconArrowMoveLeft size={14} />}>Return to draft</Menu.Item>)
    }

    if (status == statuses.saved) {
      options.push(<Menu.Item key={2} onMouseDown={() => handleDelete()} leftSection={<IconTrash size={14} />}>Delete</Menu.Item>)
    }

    return options
  }



  return (
    <Card withBorder radius="sm" p="md" mb="lg" className="overflow-visible rounded-b-none"
      bg={
        isActivity(activitytype)
        ? status == statuses.inreview 
          ? "orange.1" 
          : (status == statuses.approved 
            ? "apprgreen.1" 
            : ''
          )
        : ""
      }
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
        <Text c="dimmed" size="sm">
        { isActivity(activitytype)
          ?  status == statuses.saved 
            ? "All information is saved."
            : status == statuses.inreview
              ? "Activity is under review. Information may be updated by planners."
              : status == statuses.approved 
                ? "Activity is approved!"
                : "Get started by entering the details for this activity."
          : status > statuses.saved
            ? "All information is saved."
            : "Complete the form."
        }
        </Text>
      }

      { viewStateProps.editable &&
        <Group justify="space-between" mt="xs">
          <Group gap="xs">
            <Button 
              type="submit" 
              size="compact-md" 
              radius="xl" 
              leftSection={<IconCloudUp className='size-4' />} 
              loading={submitLoading}>
                {activitytype == 'calendar' || activitytype == 'assessment' 
                ? status >= statuses.saved
                  ? "Update"
                  : "Submit"
                : haschanges ? "Save changes" : "Save" }
            </Button>
            { showReviewButton() && 
              <Button color="apprgreen" onClick={handleSendReview} size="compact-md" radius="xl" leftSection={<IconCheckbox size={14} />} loading={pubLoading}>
                {assessmentid && activitytype == 'incursion'
                  ? 'Publish'
                  : 'Start review'
                }
              </Button> 
            }
          </Group>

          { getExtraOptions().length 
            ? <Menu shadow="lg" position="bottom">
                <Menu.Target>
                  <Button size="compact-md" variant="subtle" radius="xl"><IconDots size="1rem" /></Button>
                </Menu.Target>
                <Menu.Dropdown> 
                  {getExtraOptions()}
                </Menu.Dropdown>
              </Menu>
            : null
          }
        </Group>
      }
        
    </Card>
  )

}
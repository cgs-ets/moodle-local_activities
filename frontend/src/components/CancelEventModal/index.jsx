
import {Box, Button, Checkbox, Chip, Flex, Group, LoadingOverlay, Modal, Radio, Text, Transition, Center } from '@mantine/core';
import { useAjax } from 'src/hooks/useAjax';
import { useEffect, useState } from 'react';
import { useTimeout } from '@mantine/hooks';
import { IconCheck } from '@tabler/icons-react';

export function CancelEventModal({deleteOrCancel, eventid, opened, close, submitted}) {
  
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchedData] = useAjax(); // destructure state and fetch function
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function
  const [eventInfo, setEventInfo] = useState({})
  const [series, setSeries] = useState('one');
  const [activities, setActivitys] = useState('all');
  const [activitysChecked, setActivitysChecked] = useState({});
  const [notifyChecked, setNotifyChecked] = useState([]);
  const [error, setError] = useState('');
  const {start, clear} = useTimeout(() => submitted(), 3000);
  const action = deleteOrCancel == 1 ? "cancel" : "delete"

  useEffect(() => {
    if (opened && !eventInfo.title) {
      reset()
      fetchAjax({
        query: {
          methodname: 'local_activities-get_event_series_info',
          id: eventid,
        }
      })
    }
  }, [opened]);

  useEffect(() => {
    if (fetchResponse && !fetchError) {
      setEventInfo(fetchResponse.data)
    }
  }, [fetchResponse]);

  const handleSubmit = () => {
    if (activities == 'select' && Object.keys(activitysChecked).length === 0) {
      setError('You must select at least one activity.')
      return;
    }
    const data = {
      eventid: eventid,
      action: action,
      series: series,
      activities: activities,
      activitysChecked: Object.keys(activitysChecked),
      notifyChecked: notifyChecked,
    }
    setError('')
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-cancel_event',
        args: data,
      }
    })
  }

  useEffect(() => {
    if (!submitError && submitResponse) {
      start()
    }
    if (submitError) {
      setError("There was an error submitting. " + submitResponse.exception.message)
    }
  }, [submitResponse])

  const handleClose = () => {
    if (!submitError && submitResponse) {
      clear()
      submitted()
    } else {
      close()
    }
  }

  const reset = () => {
    setEventInfo({})
    setSeries('one')
    setActivitys('all')
    setActivitysChecked({})
    setNotifyChecked([])
    setSubmitData({response: null, error: false, loading: false})
    setFetchedData({response: null, error: false, loading: false})
  }

  const success = () => {
    return (
      <Transition mounted={(submitResponse && !submitError)} transition="fade" duration={500} timingFunction="ease">
        {(styles) => 
          <Flex mb="xl" direction="column" align="center" style={{ ...styles }}>
            <IconCheck size={45} color="green"/>
            <Text fz="md">Success! Your request will be processed in the background.</Text>
          </Flex> 
        }
      </Transition>
    )
  }

  const form = () => {
    return (
      <>
        <LoadingOverlay visible={fetchLoading} overlayBlur={2} />
        { eventInfo.hasMultiple
          ? <Box mb="lg">
              { eventInfo.hasDates &&
                <>
                  <Text fz="md" mb={5} fw={500}>This is one event in a series. What would you like to {action}?</Text>
                  <Radio.Group 
                    value={series}
                    onChange={setSeries}>
                    <Flex mt="xs" gap="xs" direction="column">
                      <Radio value="one" label="Just this one" />
                      <Radio value="all" label="The entire series" />
                    </Flex>
                  </Radio.Group>
                </>
              }
              { (series == "all" && eventInfo.hasActivitys || series == "one" && eventInfo.hasActivitysOnThisDate) &&
                <>
                  <Text fz="md" mt="lg" mb={5} fw={500}>Which activities does this {series == "all" ? 'series' : 'event'} {action == 'cancel' ? 'cancellation' : 'deletion'} apply to?</Text>
                  <Radio.Group 
                    value={activities}
                    onChange={setActivitys}>
                    <Flex mt="xs" gap="xs" direction="column">
                      <Radio value="all" label="All activities" />
                      <Radio value="select" label="Select activities" />
                    </Flex>
                  </Radio.Group>
                  
                  { activities == "select"
                    ? series == "all"
                      ? <Group mt="sm">{eventInfo.activities.map( (activity, i) => {
                          return (<Chip key={i} checked={activitysChecked[activity.activityid]} onChange={() => setActivitysChecked((current) => (
                            {...current, [activity.activityid]: !current[activity.activityid]}
                          ))}>{activity.activityname}</Chip>)
                        })}</Group>
                        
                      : <Group mt="sm">{eventInfo.activitysOnThisDate.map( (activity, i) => {
                        return (<Chip key={i} checked={activitysChecked[activity.activityid]} onChange={() => setActivitysChecked((current) => (
                          {...current, [activity.activityid]: !current[activity.activityid]}
                        ))}>{activity.activityname}</Chip>)
                      })}</Group>
                    : ''
                  }

                </>
              }
            </Box>
          : ''
        }

        <Box>
          <Text fz="md" mb={5} fw={500}>Who should the system notify about this?</Text>
          <Checkbox.Group
            value={notifyChecked}
            onChange={setNotifyChecked}
          >
            <Flex mt="xs" gap="xs" direction="column">
              <Checkbox value="activitystaff" label="Coaches/Assistants" />
              <Checkbox value="students" label="Students" />
              <Checkbox value="parents" label="Parents" />
            </Flex>
          </Checkbox.Group>
        </Box>

        {error && 
          <Box mt="md"><Text mb={5} fz={12} c="red" sx={{wordBreak: "break-all"}}>{error}</Text></Box>
        }
        
        <Flex mt="md" justify="end">
          <Button onClick={handleSubmit} loading={submitLoading} color="red" radius="xl" ><Text tt="capitalize">Submit</Text></Button>
        </Flex>
      </>
    )
  }

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose} 
      title={deleteOrCancel == 1 ? "Confirm cancel" : "Confirm delete"} 
      size="lg"
      styles={{
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        }
      }}
      >
        <Box mt="xs" p="xs" pos="relative">
          { (submitResponse && !submitError)
            ? success()
            : form()
          }
        </Box>
      </Modal>
 
  );
};
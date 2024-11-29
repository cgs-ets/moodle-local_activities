import { useEffect, useState } from "react";
import { Box, Container, Grid, Center, Text, Loader, Button, ActionIcon } from '@mantine/core';
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useAjax } from '../../hooks/useAjax';
import dayjs from "dayjs";
import { useStateStore } from "../../stores/stateStore";
import { defaults, useFormStore, useFormValidationStore } from "../../stores/formStore";
import { IconPencil } from "@tabler/icons-react";
import { isActivity } from "../../utils/utils";
import { PageHeader } from "../Activity/components/PageHeader";
import { ActivityDetails } from "./Components/ActivityDetails/ActivityDetails";

export function Permission() {
  let { id } = useParams();

  const setFormData = useFormStore((state) => state.setState)
  const setFormState = useStateStore((state) => state.setState)
  //const formLoaded = useStateStore((state) => (state.setFormLoaded))
  const baselineHash = useStateStore((state) => (state.baselineHash))
  const clearHash = useStateStore((state) => (state.clearHash))
  const validationRules = useFormValidationStore((state) => state.rules)
  const setFormErrors = useFormValidationStore((state) => state.setFormErrors)
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchData] = useAjax(); // destructure state and fetch function
  const activitytype = useFormStore((state) => state.activitytype)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Activity Permission'
    // Load existing activity.
    if (id) {
      console.log("fetching activity..")
      fetchAjax({
        query: {
          methodname: 'local_activities-get_activity',
          id: id,
        }
      })
    } else {
      setFormData(null)
      setFormState(null)
      clearHash()
    }
  }, [id]);

  useEffect(() => {
    if (fetchResponse && !fetchError) {
      document.title = fetchResponse.data.activityname + " - Permission"
      const data = {
        ...fetchResponse.data,
        categories: JSON.parse(fetchResponse.data.categoriesjson || '[]'),
        timecreated: Number(fetchResponse.data.timecreated) ? fetchResponse.data.timecreated : dayjs().unix(),
        timemodified: Number(fetchResponse.data.timemodified) ? fetchResponse.data.timemodified : dayjs().unix(),
        timestart: Number(fetchResponse.data.timestart) ? fetchResponse.data.timestart : dayjs().unix(),
        timeend: Number(fetchResponse.data.timeend) ? fetchResponse.data.timeend : dayjs().unix(),
        studentlist: JSON.parse(fetchResponse.data.studentlistjson || '[]'),
        planningstaff: JSON.parse(fetchResponse.data.planningstaffjson || '[]'),
        accompanyingstaff: JSON.parse(fetchResponse.data.accompanyingstaffjson || '[]'),
        staffincharge: [JSON.parse(fetchResponse.data.staffinchargejson || null)].filter(item => item !== null)
      }
      // Merge into default values
      setFormData({...defaults, ...data})
    }
  }, [fetchResponse]);


  return (
    <>
      <Header />
      <div className="page-wrapper" style={{minHeight: 'calc(100vh - 154px)'}}>
        { id && !fetchResponse ? (
          <Center h={200} mx="auto"><Loader type="dots" /></Center>
        ) : (
            id && fetchError
            ? <Container size="xl">
                <Center h={300}>
                  <Text fw={600} fz="lg">Failed to load activity...</Text>
                </Center>
              </Container>
            : <>
                <Container size="xl">
                  <PageHeader />
                </Container>
                <Container size="xl" my="md">
                  <Box className="flex flex-col gap-4">
                    <ActivityDetails />
                    
                  </Box>
            </Container>
          </>
        )}
      </div>
      <Footer />
    </>
  )
}
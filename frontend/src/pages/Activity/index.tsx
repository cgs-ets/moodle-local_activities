import { useEffect, useState } from "react";
import { Box, Container, Grid, Center, Text, Loader } from '@mantine/core';
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { PageHeader } from "./components/PageHeader";
import { Status } from "./components/Status";
import { useAjax } from '../../hooks/useAjax';
import { BasicDetails } from "./components/BasicDetails";
import dayjs from "dayjs";
import { useStateStore } from "../../stores/stateStore";
import { defaults, Errors, Form, useFormStore, useFormValidationStore } from "../../stores/formStore";
import { StaffDetails } from "./components/StaffDetails";
import { StudentList } from "./components/StudentList";
import { CalendarSettings } from "./components/CalendarSettings";
import { Workflow } from "./components/Workflow";

export function Activity() {
  let { id } = useParams();

  const setFormData = useFormStore((state) => state.setState)
  const setFormState = useStateStore((state) => state.setState)
  const formLoaded = useStateStore((state) => (state.setFormLoaded))
  const baselineHash = useStateStore((state) => (state.baselineHash))
  const clearHash = useStateStore((state) => (state.clearHash))
  const resetHash = useStateStore((state) => (state.resetHash))
  const validationRules = useFormValidationStore((state) => state.rules)
  const setFormErrors = useFormValidationStore((state) => state.setFormErrors)
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchData] = useAjax(); // destructure state and fetch function

  const [approvals, setApprovals] = useState<any>([])
  
  useEffect(() => {
    document.title = 'Manage Activity'
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
      //console.log(fetchResponse.data)
      
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

      setApprovals(fetchResponse.data.approvals)

      formLoaded()
      baselineHash()
    }
  }, [fetchResponse]);

  const navigate = useNavigate()

  useEffect(() => {
    if (!submitError && submitResponse) {
      // If something other than an int was returned, something went wrong.
      if (!submitResponse.data.id) {
        resetHash() // Revert to old hash as changes were not saved
        setSubmitData({
          response: {exception: {message: "Something went wrong! Please reload and try again."}},
          error: true,
          loading: false,
        })
        return
      }

      // Successful save.
      if (!id) {
        navigate('/activity/' + submitResponse.data.id, {replace: true})
      } else {
        setFormData({
          status: submitResponse.data.status,
        } as Form)
        // Refetch student list.
        console.log("Triggering student reload.")
      }
    }
    if (submitError) {
      resetHash() // Revert to old hash as changes were not saved
    }
  }, [submitResponse])


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let formData = JSON.parse(JSON.stringify({...useFormStore.getState()}))
    formData.categoriesjson = JSON.stringify(formData.categories)
    formData.studentlistjson = JSON.stringify(formData.studentlist)
    formData.planningstaffjson = JSON.stringify(formData.planningstaff)
    formData.accompanyingstaffjson = JSON.stringify(formData.accompanyingstaff)
    formData.staffinchargejson = JSON.stringify(formData.staffincharge.length ? formData.staffincharge[0] : '')

    setSubmitData({
      response: null,
      error: false,
      loading: false,
    })

    let hasErrors = false
    let errors = {} as Errors
    for (let field in validationRules) {
      for (let [index, rule] of validationRules[field].entries()) {
        // Exec the rule against the data.
        let error = rule(formData[field], formData)
        if (error) {
          hasErrors = true
          let fieldErrors: string[] = []
          if (Object.hasOwn(errors, field)) {
            // There are existing errors for this field.
            fieldErrors = errors[field]
          }
          fieldErrors.push(error)
          errors = {...errors, ...{[field] : fieldErrors} }
        }
      }
    }
    
    setFormErrors(errors)
    if (hasErrors) {
      setSubmitData({
        response: {exception: {message: "Form has validation errors. Fix them and try again."}},
        error: true,
        loading: false,
      })
      console.log("Form has errors, not submitting.")
      return
    }

    // Decode the multiselect values into objects.
    //formData.coaches = formData.coaches.map((val) => JSON.parse(val));
    //formData.assistants = formData.assistants.map((val) => JSON.parse(val));

    // Set a new baseline for change detection, anticipating all will be saved.
    baselineHash()

    //return
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-post_activity',
        args: formData,
      }
    })
  }

  return (
    <>
      <Header />
      <div className="page-wrapper" style={{minHeight: 'calc(100vh - 154px)'}}>
        { id && !fetchResponse ? (
          <Center h={200} mx="auto"><Loader variant="dots" /></Center>
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
                  <form noValidate onSubmit={handleSubmit}>
                    <Grid grow>
                      <Grid.Col span={{ base: 12, lg: 9 }}>
                        <Box className="flex flex-col gap-4">
                          <BasicDetails />
                          <CalendarSettings />
                          <StaffDetails />
                          <StudentList />
                        </Box>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, lg: 3 }}>
                        <Status submitLoading={submitLoading} submitError={submitError} submitResponse={submitResponse} />
                        <Workflow approvals={approvals} setApprovals={setApprovals} />
                      </Grid.Col>
                    </Grid>
                  </form>
            </Container>
          </>
        )}
      </div>
      <Footer />
    </>
  )
}
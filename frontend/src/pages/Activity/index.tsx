import { useEffect } from "react";
import { Box, Container, Grid, Center, Text, Loader, Card } from '@mantine/core';
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { PageHeader } from "./components/PageHeader";
import { Status } from "./components/Status";
//import { StaffDetails } from "./components/StaffDetails/index.jsx";
//import { StudentList } from "./components/StudentList/index.jsx";
import { useAjax } from '../../hooks/useAjax';
import { BasicDetails } from "./components/BasicDetails";
import dayjs from "dayjs";
import { useStateStore } from "../../stores/stateStore";
import { defaults, Errors, Form, useFormStore, useFormValidationStore, useStaffDetailsStore, useStudentListStore } from "../../stores/formStore";

export function Activity() {
  let { id } = useParams();

  const setFormData = useFormStore((state) => state.setState)
  const setFormState = useStateStore((state) => state.setState)

  const formLoaded = useStateStore((state) => (state.setFormLoaded))
  const baselineHash = useStateStore((state) => (state.baselineHash))
  const clearHash = useStateStore((state) => (state.clearHash))
  const resetHash = useStateStore((state) => (state.resetHash))
  const staff = useStaffDetailsStore.getState()
  const students = useStudentListStore.getState()
  
  const validationRules = useFormValidationStore((state) => state.rules)
  const setFormErrors = useFormValidationStore((state) => state.setFormErrors)

  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchData] = useAjax(); // destructure state and fetch function
  
  useEffect(() => {
    document.title = 'Manage Activity'
    // Load existing activity.
    if (id) {
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
      console.log(fetchResponse.data)
      
      const data = {
        ...fetchResponse.data,
        timecreated: Number(fetchResponse.data.timecreated) ? fetchResponse.data.timecreated : dayjs().unix(),
        timemodified: Number(fetchResponse.data.timemodified) ? fetchResponse.data.timemodified : dayjs().unix(),
        timestart: Number(fetchResponse.data.timestart) ? fetchResponse.data.timestart : dayjs().unix(),
        timeend: Number(fetchResponse.data.timeend) ? fetchResponse.data.timeend : dayjs().unix(),
      }
      // Merge into default values
      setFormData({...defaults, ...data})

      // Prep these for the multi selelctor
      /*const coaches = fetchResponse.data.coaches 
        ? JSON.parse(fetchResponse.data.coaches).map((item) => (JSON.stringify({ un: item.un, fn: item.fn, ln: item.ln })))
        : []
      const assistants = fetchResponse.data.assistants
        ? JSON.parse(fetchResponse.data.assistants).map((item) => (JSON.stringify({ un: item.un, fn: item.fn, ln: item.ln })))
        : []
      setStaffDetailsState({
        coaches: coaches,
        assistants: assistants,
      })*/

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
        //setFormState({reload: true})
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
    formData.studentlist = students.usernames
    console.log(formData);

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
        let error = rule(formData[field])
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
                        <Box>
                          <Card withBorder className="overflow-visible rounded p-4 flex flex-col gap-6">
                            <BasicDetails />
                            {/*<StaffDetails />*/}
                          </Card>
                          {/*<StudentList reload={reloadStudents} />*/}
                        </Box>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, lg: 3 }}>
                        <Status submitLoading={submitLoading} submitError={submitError} submitResponse={submitResponse} />
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
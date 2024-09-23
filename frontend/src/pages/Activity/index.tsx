import { Fragment, useEffect } from "react";
import { Box, Container, Grid, Center, Text, Loader, Card } from '@mantine/core';
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { PageHeader } from "./components/PageHeader";
import { Status } from "./components/Status";
//import { StaffDetails } from "./components/StaffDetails/index.jsx";
//import { StudentList } from "./components/StudentList/index.jsx";
import { useAjax } from '../../hooks/useAjax';
import { useBasicDetailsStore, useStaffDetailsStore, useFormValidationStore, useStudentListStore, Errors } from './store/formFieldsStore'
import { useFormMetaStore, useFormStateStore } from "./store/formMetaStore"
import { BasicDetails } from "./components/BasicDetails";
import dayjs from "dayjs";

export function Activity() {
  let { id } = useParams();

  const setBasicDetailsState = useBasicDetailsStore((state) => state.setState)
  const setStaffDetailsState = useStaffDetailsStore((state) => state.setState)
  const setStudentListState = useStudentListStore((state) => state.setState)
  const setMetaState = useFormMetaStore((state) => state.setState)
  const setFormState = useFormStateStore((state) => state.setState)

  const formLoaded = useFormStateStore((state) => (state.setFormLoaded))
  const baselineHash = useFormStateStore((state) => (state.baselineHash))
  const clearHash = useFormStateStore((state) => (state.clearHash))
  const resetHash = useFormStateStore((state) => (state.resetHash))
  
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
      setBasicDetailsState(null)
      setStaffDetailsState(null)
      setStudentListState(null)
      setMetaState(null)
      setFormState(null)
      clearHash()
    }
  }, [id]);


  useEffect(() => {
    if (fetchResponse && !fetchError) {
      console.log(fetchResponse.data)
      setBasicDetailsState({
        idnumber: fetchResponse.data.idnumber,
        activityname: fetchResponse.data.activityname,
        activitytype: fetchResponse.data.activitytype,
        category: fetchResponse.data.category,
        categoryName: fetchResponse.data.categoryname,
        initDescription: fetchResponse.data.details,
        details: fetchResponse.data.details,
        timestart: Number(fetchResponse.data.timestart) ? fetchResponse.data.timestart : dayjs().unix(),
        timeend: Number(fetchResponse.data.timestart) ? fetchResponse.data.timestart : dayjs().unix(),
      })

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

      setMetaState({
        id: fetchResponse.data.id,
        creator: fetchResponse.data.creator,
        status: fetchResponse.data.status,
        timecreated: fetchResponse.data.timecreated,
        timemodified: fetchResponse.data.timemodified,
      })

      formLoaded()
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
        setMetaState({
          status: submitResponse.data.status,
        })
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
    
    const basic = useBasicDetailsStore.getState()
    const staff = useStaffDetailsStore.getState()
    const students = useStudentListStore.getState()
    const meta = useFormMetaStore.getState()
    let formData = JSON.parse(JSON.stringify({...meta, ...basic, ...staff}))
    formData.studentlist = students.usernames
    formData.studentlistmove = students.move

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
    <Fragment>
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
                          <Card withBorder className="overflow-visible rounded py-6 px-4 flex flex-col gap-6">
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
    </Fragment>
  )
}
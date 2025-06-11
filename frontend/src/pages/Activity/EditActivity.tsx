import { useEffect, useState } from "react";
import { Box, Container, Grid, Center, Text, Loader, Badge, Button } from '@mantine/core';
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { PageHeader } from "./components/PageHeader";
import { Status } from "./components/Status/Status";
import { useAjax } from '../../hooks/useAjax';
import { BasicDetails } from "./components/BasicDetails/BasicDetails";
import dayjs from "dayjs";
import { useStateStore, ViewStateProps } from "../../stores/stateStore";
import { defaults, Errors, Form, useFormStore, useFormValidationStore } from "../../stores/formStore";
import { StaffDetails } from "./components/StaffDetails/StaffDetails";
import { CalendarSettings } from "./components/CalendarSettings/CalendarSettings";
import { Workflow } from "./components/Workflow/Workflow";
import { useWorkflowStore } from "../../stores/workflowStore";
import { Conflicts } from "./components/Conflicts/Conflicts";
import { CalendarFlow } from "./components/CalendarFlow/CalendarFlow";
import { Paperwork } from "./components/Paperwork/Paperwork";
import { useDisclosure } from "@mantine/hooks";
import { Permissions } from "./components/Permissions/Permissions";
import { cn, isActivity } from "../../utils/utils";
import { Comments } from "./components/Comments/Comments";
import { PermissionsEmailModal } from "./components/PermissionsEmailModal/PermissionsEmailModal";
import { EmailHistory } from "./components/EmailHistory/EmailHistory";
import { NextSteps } from "./components/NextSteps/NextSteps";
import { getConfig } from "../../utils";
import useFetch from "../../hooks/useFetch";
import { StudentListDIY } from "./components/StudentList/StudentListDIY";
import { Series } from "./components/Series/Series";

export function EditActivity() {
  let { id } = useParams();

  const [error, setError] = useState<string>("")
  const setFormData = useFormStore((state) => state.setState)
  const activityid = useFormStore((state) => state.id)
  const setFormLoaded = useStateStore((state) => (state.setFormLoaded))
  const baselineHash = useStateStore((state) => (state.baselineHash))
  const resetHash = useStateStore((state) => (state.resetHash))
  const validationRules = useFormValidationStore((state) => state.rules)
  const setFormErrors = useFormValidationStore((state) => state.setFormErrors)
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function
  const api = useFetch()
  const setApprovals = useWorkflowStore((state) => state.setApprovals)
  const updateSavedTime = useStateStore((state) => (state.updateSavedTime))
  const [isOpenEmailModal, emailModalHandlers] = useDisclosure(false);
  const activitytype = useFormStore((state) => state.activitytype)
  const updateViewStateProps = useStateStore((state) => (state.updateViewStateProps))
  const viewStateProps = useStateStore((state) => (state.viewStateProps))
  const [searchParams, setSearchParams] = useSearchParams()
  const occurrences = useFormStore((state) => state.occurrences)

  const resetForm = useFormStore((state) => (state.reset))
  const resetState = useStateStore((state) => (state.reset))
  const resetWF = useWorkflowStore((state) => (state.reset))

  useEffect(() => {
    document.title = 'Manage Activity'

    if (id && getConfig().roles?.includes("staff")) {
      getActivity()
    }

    if (!id && getConfig().roles?.includes("staff")) {
      // New. Allow editing.
      updateViewStateProps({
        readOnly: false,
        editable: true,
      } as ViewStateProps)
    }

    return () => {
      // Clear everything when leaving an activity.
      resetForm()
      resetState()
      resetWF()
    };
  }, [id]);


  const getActivity = async () => {

    const fetchResponse = await api.call({
      query: {
        methodname: 'local_activities-get_activity',
        id: id,
      }
    })
    if (fetchResponse.error) {
      setError(fetchResponse.exception?.message ?? "Error")
      return
    }

    let editing = {
      readOnly: true,
      editable: false,
    } as ViewStateProps

    if (fetchResponse?.data?.usercanedit) { // && !fetchResponse?.data?.recurring) {
      updateViewStateProps({...editing, editable: true, readOnly: false})
    } else {
      updateViewStateProps(editing)
    }

    document.title = fetchResponse.data.activityname
    const data = {
      ...fetchResponse.data,
      categories: JSON.parse(fetchResponse.data.categoriesjson || '[]'),
      timecreated: Number(fetchResponse.data.timecreated) ? fetchResponse.data.timecreated : dayjs().unix(),
      timemodified: Number(fetchResponse.data.timemodified) ? fetchResponse.data.timemodified : dayjs().unix(),
      timestart: Number(fetchResponse.data.timestart) ? fetchResponse.data.timestart : dayjs().unix(),
      timeend: Number(fetchResponse.data.timeend) ? fetchResponse.data.timeend : dayjs().unix(),
      planningstaff: JSON.parse(fetchResponse.data.planningstaffjson || '[]'),
      accompanyingstaff: JSON.parse(fetchResponse.data.accompanyingstaffjson || '[]'),
      staffincharge: [JSON.parse(fetchResponse.data.staffinchargejson || null)].filter(item => item !== null),
      initialCampus: fetchResponse.data.campus,
      initialActivitytype: fetchResponse.data.activitytype,
      displaypublic: !!Number(fetchResponse.data.displaypublic),
      pushpublic: !!Number(fetchResponse.data.pushpublic),
      // Convert to bool.
      permissions: !!Number(fetchResponse.data.permissions),
      permissionsinitial: !!Number(fetchResponse.data.permissions),
      isallday: !!Number(fetchResponse.data.isallday),
      permissionsent: fetchResponse.data.permissionsent || false,
      // Move these into existing
      existingriskassessment: fetchResponse.data.riskassessment,
      existingattachments: fetchResponse.data.attachments,
      attachments: "",
      riskassessment: "",
      recurring: !!Number(fetchResponse.data.recurring),
      recurrence: {...defaults.recurrence, ...JSON.parse(fetchResponse.data.recurrence || JSON.stringify(defaults.recurrence))},
      occurences: fetchResponse.data.occurences,
    }
    // Merge into default values
    setFormData({...defaults, ...data})
    setFormLoaded()
  }



  const navigate = useNavigate()

  useEffect(() => {
    if (!submitError && submitResponse) {

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
        navigate('/' + submitResponse.data.id, {replace: true})
      } else {
        setFormData({
          status: submitResponse.data.status,
          ...(submitResponse.data.newdates ? {timestart: submitResponse.data.newdates.timestart, timeend: submitResponse.data.newdates.timeend} : {})
        } as Form)
        setApprovals(submitResponse.data.workflow)
        updateSavedTime()
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
    formData.assessmentid = searchParams.get('assessment') || null

    // If activity is new, accept recurring settings by default.
    if (!id) {
      formData.recurringAcceptChanges = true
    } else {
      // If the activity is not new, and the recurring switch has been turned off, and changes have not been accepted, turn the switch back on.
      if (!formData.recurringAcceptChanges &&occurrences.datesReadable.length > 0 && !formData.recurring) {
        // Undo the changes.
        formData.recurring = true
        setFormData({recurring: true} as Form)
      }
    }

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
    setFormData({initialActivitytype: formData.initialActivitytype} as Form)
    setFormData({initialCampus: formData.campus} as Form)
    setFormData({recurringAcceptChanges: false} as Form)
  }

  if (!getConfig().roles?.includes("staff")) {
    return ""
  }

  useEffect(() => {
    // If search params has assessmentid, pop it into the formData.
    if (searchParams.get('assessment')) {
      setFormData({assessmentid: searchParams.get('assessment')} as Form)
    }
  }, [searchParams])


  return (
    <>
      <Header />
      <div className={cn(viewStateProps.editable ? "editable" : "readonly")} style={{minHeight: 'calc(100vh - 154px)'}}>

        { id && !error && !activityid 
          ? <Center h={200} mx="auto"><Loader type="dots" /></Center> : null
        }

        { id && error.length ?
          <Container size="xl">
            <Center h={300}>
              <Text fw={600} fz="lg">Failed to load activity...</Text>
            </Center>
          </Container> : null
        }

        { (!error && activityid) || !id ?
          <>
            <Container size="xl">
              <PageHeader />
            </Container>
            <Container size="xl" my="md">
              <form noValidate onSubmit={handleSubmit}>
                <Grid grow>
                  <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Box className="flex flex-col gap-4 relative">
                      <BasicDetails />
                      <CalendarSettings />
                      <StaffDetails />
                      { isActivity(activitytype) &&
                        <>
                          <Permissions openSendMessage={emailModalHandlers.open} />
                          <StudentListDIY />
                          <Paperwork />
                        </>
                      }
                      <Box visibleFrom="lg">
                        <Status submitLoading={submitLoading} submitError={submitError} submitResponse={submitResponse} />
                      </Box>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Status submitLoading={submitLoading} submitError={submitError} submitResponse={submitResponse} />
                    <Workflow activityid={Number(id || 0)} />
                    <NextSteps />
                    <CalendarFlow activityid={Number(id || 0)} />
                    <EmailHistory />
                    <Comments />
                  </Grid.Col>
                </Grid>
              </form>
              <PermissionsEmailModal opened={isOpenEmailModal} close={emailModalHandlers.close} />
          </Container>
        </> : null
        }
      </div>
      <Footer />
    </>
  )
}
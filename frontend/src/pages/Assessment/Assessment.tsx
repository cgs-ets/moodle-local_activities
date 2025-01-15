import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getConfig } from "../../utils";
import { useStateStore, ViewStateProps } from "../../stores/stateStore";
import useFetch from "../../hooks/useFetch";
import dayjs from "dayjs";
import { useAjax } from "../../hooks/useAjax";
import { Header } from "../../components/Header";
import { cn } from "../../utils/utils";
import { Anchor, Box, Button, Card, Center, Container, Grid, Loader, NavLink, Select, Text, TextInput } from "@mantine/core";
import { PageHeader } from "../Activity/components/PageHeader";
import { Footer } from "../../components/Footer";
import { DateTimePicker } from "@mui/x-date-pickers";
import { IconCloudUp, IconExternalLink } from "@tabler/icons-react";

interface Module {
  value: string;
  label: string;
  url: string;
}

interface FormData {
  id: string;
  courseid: string;
  module: Module | null;
  cmid: string;
  name: string;
  timedue: string;
}

export function Assessment() {
  let { id } = useParams();
  const api = useFetch()
  const api2 = useFetch()
  const updateViewStateProps = useStateStore((state) => (state.updateViewStateProps))
  const viewStateProps = useStateStore((state) => (state.viewStateProps))
  const [error, setError] = useState<string>("")
  const [formData, setFormData] = useState<FormData>({
    id: id ?? "",
    courseid: "",
    module: null,
    cmid: "",
    name: "",
    timedue: dayjs().unix().toString(),
  })
  const [courses, setCourses] = useState([])
  const [modules, setModules] = useState<Module[]>([])
  const [modulesLoading, setModulesLoading] = useState<boolean>(false)
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function


  useEffect(() => {
    document.title = 'Manage Assessment'

    if (id && getConfig().roles.includes("staff")) {
      getAssessment()
    }

    if (!id && getConfig().roles.includes("staff")) {
      // New. Allow editing.
      updateViewStateProps({
        readOnly: false,
        editable: true,
      } as ViewStateProps)
    }

    getCourses()

    return () => {
      // Clear everything when leaving.
    };
  }, [id]);


  const getAssessment = async () => {
    const fetchResponse = await api.call({
      query: {
        methodname: 'local_activities-get_assessment',
        id: id,
      }
    })
    if (fetchResponse.error) {
      setError(fetchResponse.exception?.message ?? "Error")
      return
    }
    if (fetchResponse?.data?.usercanedit) {
      // Allow editing.
      updateViewStateProps({
        readOnly: false,
        editable: true,
      } as ViewStateProps)
    } else {
      // Do not allow editing.
      updateViewStateProps({
        readOnly: true,
        editable: false,
      } as ViewStateProps)
    }
    document.title = fetchResponse.data.name
    const data = {
      ...fetchResponse.data,
      timecreated: Number(fetchResponse.data.timecreated) ? fetchResponse.data.timecreated : dayjs().unix(),
      timemodified: Number(fetchResponse.data.timemodified) ? fetchResponse.data.timemodified : dayjs().unix(),
      timedue: Number(fetchResponse.data.timedue) ? fetchResponse.data.timedue : dayjs().unix(),
    }
    setFormData({...data})
  }

  const getCourses = async () => {
    const fetchResponse = await api2.call({
      query: {
        methodname: 'local_activities-get_courses',
      }
    })
    if (fetchResponse.error) {
      setError(fetchResponse.exception?.message ?? "Error")
    }
    if (fetchResponse?.data) {
      setCourses(fetchResponse.data)
    }
  }

  const updateField = (name: string, value: any) => {
    setFormData(current => ({...current, [name]: value}))
  }

  const navigate = useNavigate()

  useEffect(() => {
    if (!submitError && submitResponse) {
      // Error saving.
      if (!submitResponse.data.id) {
        setSubmitData({
          response: {exception: {message: "Something went wrong! Please reload and try again."}},
          error: true,
          loading: false,
        })
        return
      }
      // Successful save.
      if (!id) {
        navigate('/assessment/' + submitResponse.data.id, {replace: true})
      } else {
        
      }
    }
  }, [submitResponse])


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitData({
      response: null,
      error: false,
      loading: false,
    })

    formData.name = formData.name ? formData.name : formData.module ? formData.module.label : ""
    formData.cmid = formData.module?.value ?? ''

    //return
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-post_assessment',
        args: formData,
      }
    })
  }


  useEffect(() => {
    if (!formData.courseid) {
      return
    }
    getModules()
  }, [formData.courseid])


  const getModules = async () => {
    setModules([])
    updateField('module', null)
    if (!formData.courseid) {
      return
    }
    setModulesLoading(true)
    const fetchResponse = await api2.call({
      query: {
        methodname: 'local_activities-get_modules',
        courseid: formData.courseid,
      }
    })
    setModulesLoading(false)
    if (fetchResponse.error) {
      setError(fetchResponse.exception?.message ?? "Error")
    }
    if (fetchResponse?.data) {
      setModules(fetchResponse.data)
      updateField('module', moduleById(formData.cmid))
    }
  }

  const moduleById = (moduleid: string | null) => {
    if (!moduleid) {
      return {}
    }
    return modules.find(obj => obj.value === moduleid)
  }

  if (!getConfig().roles.includes("staff")) {
    return ""
  }

  return (
    <>
      <Header />
      <div className={cn(viewStateProps.editable ? "editable" : "readonly")} style={{minHeight: 'calc(100vh - 154px)'}}>

        { id && !error && !formData.id 
          ? <Center h={200} mx="auto"><Loader type="dots" /></Center> : null
        }

        { id && error.length ?
          <Container size="xl">
            <Center h={300}>
              <Text fw={600} fz="lg">Failed to load assessment...</Text>
            </Center>
          </Container> : null
        }

        { (!error && formData.id ) || !id ?
          <>
            <Container size="xl">
              <PageHeader entityname="Assessment" />
            </Container>
            <Container size="xl" my="md">
              <form noValidate onSubmit={handleSubmit}>
                <Box className="flex flex-col gap-4 max-w-xl">
                  <Card withBorder className="overflow-visible rounded p-4 flex flex-col gap-6">
                  
                        <div className="flex flex-col gap-6 pb-2">

                          <Select
                            label="Course"
                            data={courses}
                            value={formData.courseid}
                            onChange={(e) => updateField('courseid', e)}
                            readOnly={viewStateProps.readOnly}
                            allowDeselect={false}
                          />

                          <div>
                            <Select
                              label="Module"
                              data={modules}
                              value={formData.module ? formData.module.value : null}
                              onChange={(e) => updateField('module', moduleById(e))}
                              readOnly={viewStateProps.readOnly}
                              allowDeselect={false}
                              leftSection={modulesLoading ? <Loader size="xs" /> : null}
                            />

                            { !!formData.courseid && !!formData.module
                              ? <>
                                  <Anchor
                                    href={formData.module.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 text-sm inline-flex gap-1"
                                  >
                                    Open module in course <IconExternalLink className="size-4 stroke-1" />
                                  </Anchor>
                                </>
                              : null
                            }
                          </div>
                          

                          <div>
                            <Text fz="sm" mb="5px" fw={500} c="#212529">Due date</Text>
                            <DateTimePicker 
                              value={dayjs.unix(Number(formData.timedue))}
                              onChange={(newValue) => updateField('timedue', (newValue?.unix() ?? 0).toString())}
                              views={['day', 'month', 'year', 'hours', 'minutes']}
                              readOnly={viewStateProps.readOnly}
                              slotProps={{
                                textField: {
                                  error: false,
                                },
                              }}
                            />
                          </div>

                          <TextInput
                            placeholder=""
                            label="Assessment name"
                            value={formData.name ? formData.name : formData.module ? formData.module.label : ""}
                            onChange={(e) => updateField('name', e.target.value)}
                            readOnly={viewStateProps.readOnly}
                          />                          
                          
                        </div>
                  </Card> 
                </Box>
                <Button 
                  className="mt-4 px-3"
                  type="submit" 
                  size="compact-lg" 
                  radius="xl" 
                  leftSection={<IconCloudUp className='size-5' />} 
                  loading={submitLoading}>
                  Save
                </Button>
              </form>
          </Container>
        </> : null
        }
      </div>
      <Footer />
    </>
  )
}
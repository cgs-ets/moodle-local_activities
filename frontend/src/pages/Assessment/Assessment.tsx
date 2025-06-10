import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getConfig } from "../../utils";
import { useStateStore, ViewStateProps } from "../../stores/stateStore";
import useFetch from "../../hooks/useFetch";
import dayjs from "dayjs";
import { Header } from "../../components/Header";
import { cn } from "../../utils/utils";
import { ActionIcon, Anchor, Avatar, Box, Button, Card, Center, Checkbox, Container, Group, Loader, Notification, NotificationProps, Select, Text, TextInput } from "@mantine/core";
import { Footer } from "../../components/Footer";
import { DateTimePicker } from "@mui/x-date-pickers";
import { IconCheck, IconCloudUp, IconExternalLink, IconTrash, IconX } from "@tabler/icons-react";
import { PageHeader } from "./components/PageHeader";
import { ActivitiesSearchInput } from "./components/ActivitiesSearchInput";
import { Form } from "../../stores/formStore";
import { keyframes } from '@emotion/react';
import { rem } from '@mantine/core';
import { StudentList } from "./components/StudentList";
import { User } from "../../types/types";

interface Module {
  value: string;
  label: string;
  url: string;
}

export interface AssessmentData {
  id: string;
  courseid: string;
  module: Module | null;
  cmid: string;
  name: string;
  url: string;
  timestart: string;
  timeend: string;
  course?: any;
  activityrequired: boolean;
  activityid: string;
  activityname: string;
  creatordata: {
    un: string;
    fn: string;
    ln: string;
  };
  rollrequired: boolean;
  studentlist: any[];
}

export function Assessment() {
  let { id } = useParams();
  const api = useFetch()
  const api2 = useFetch()
  const api3 = useFetch()
  const updateViewStateProps = useStateStore((state) => (state.updateViewStateProps))
  const viewStateProps = useStateStore((state) => (state.viewStateProps))
  const [error, setError] = useState<string>("")
  const formErrorDefaults = {name: '', cmid: '', timeend: ''};
  const [formErrors, setFormErrors] = useState(formErrorDefaults)
  const defaults = {
    id: "",
    courseid: "",
    module: null,
    cmid: "",
    name: "",
    url: "",
    timestart: dayjs().unix().toString(),
    timeend: dayjs().unix().toString(),
    activityrequired: false,
    activityid: "",
    activityname: "",
    creatordata: {
      un: getConfig().username ?? "",
      fn: getConfig().firstname ?? "",
      ln: getConfig().lastname ?? "",
    },
    rollrequired: false,
    studentlist: [],
  }
  const [formData, setFormData] = useState<AssessmentData>(defaults)
  const [courses, setCourses] = useState([])
  const [modules, setModules] = useState<Module[]>([])
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false)
  const [modulesLoading, setModulesLoading] = useState<boolean>(false)
  const [submitLoading, setSubmitLoading] = useState<boolean>(false)
  const manuallyEdited = useRef(false);
  const [notification, setNotification] = useState<NotificationProps | null>(null)

  // Define animations
  const slideIn = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
  `;

  const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
  `;

  useEffect(() => {
    document.title = 'Manage Assessment'
    if (id && getConfig().roles?.includes("staff")) {
      getAssessment()
    }

    if (!id && getConfig().roles?.includes("staff")) {
      // New. Allow editing.
      updateViewStateProps({
        readOnly: false,
        editable: true,
      } as ViewStateProps)
    }

    getCourses()

    return () => {
      // Clear everything when leaving.
      setFormData(defaults)
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
      timestart: Number(fetchResponse.data.timestart) ? fetchResponse.data.timestart : dayjs().unix(),
      timeend: Number(fetchResponse.data.timeend) ? fetchResponse.data.timeend : dayjs().unix(),
      activityrequired: !!Number(fetchResponse.data.activityrequired),
      rollrequired: !!Number(fetchResponse.data.rollrequired),
    }
    setFormData({...data})
    updateField('module', modules.find((obj: Module) => obj.value === data.cmid))
  }

  const getCourses = async () => {
    setCoursesLoading(true)
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
    setCoursesLoading(false)
  }

  const updateField = (name: string, value: any) => {
    setFormData(current => ({...current, [name]: value}))
  }

  const navigate = useNavigate()


  const handleSubmit = async (redirect?: string, goBack: boolean = false) => {
    formData.name = formData.name ? formData.name : formData.module ? formData.module.label : ''
    formData.cmid = formData.module?.value ?? ''
    formData.url = formData.module?.url ?? ''

    // Check for required fieds.
    const errors = {
      name: formData.name.length ? '' : 'Required',
      cmid: formData.cmid.length ? '' : 'Required',
      timeend: formData.timestart <= formData.timeend ? '' : 'End time must be same or after start time',
    };
    if (Object.values(errors).some(error => error !== '')) {
      setFormErrors(errors)
      return;
    }

    setSubmitLoading(true)
    const response = await api3.call({
      method: "POST",
      body: {
        methodname: 'local_activities-post_assessment',
        args: formData,
      }
    })

    setSubmitLoading(false)

    if (!response.error && response.data) {
      // If there is a redirect (user has saved and required an activity), navigate to that with the new ID.
      if (redirect) {
        navigate(`${redirect}?assessment=${response.data.id}`, { replace: false });
      } else {
        // If there is no redirect, it's a save.
        if (!id && !goBack) {
          navigate('/assessment/' + response.data.id, {replace: false})
        }
        if (goBack) {
          navigate('/assessments')
        }
        setNotification({
          icon: <IconCheck />,
          color: "teal",
          title: "Save successful!",
          children: "You may continue to edit this assessment.",
        })
      }
    } else {
      setError(response.exception?.message ?? "Error")
    }
    
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
      const selectedcm = fetchResponse.data.find((obj: Module) => obj.value === formData.cmid)
      updateField('module', selectedcm)
    }
  }

  const moduleById = (moduleid: string | null) => {
    if (!moduleid) {
      return {}
    }
    return modules.find(obj => obj.value === moduleid)
  }

  if (!getConfig().roles?.includes("staff")) {
    return ""
  }

  const selectActivity = (activity: Form) => {
    updateField('activityid', activity.id)
    updateField('activityname', activity.activityname)
  }

  // Update timeend when timestart changes
  useEffect(() => {
    if (!manuallyEdited.current) {
      console.log(formData)
      updateField('timeend', formData.timestart.toString());
    }
  }, [formData.timestart]);



  const handleDelete = async () => {
    const response = await api3.call({
      method: "POST",
      body: {
        methodname: 'local_activities-delete_assessment',
        args: {
          id: id,
        },
      }
    })
    if (!response.error && response.data) {
      navigate('/assessments');
    } else {
      setError(response.exception?.message ?? "Error")
    }
  }

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000); // Auto-close after 5 seconds
  
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
              <PageHeader name={formData.name} />
            </Container>
            <Container size="xl" my="md">
              <div>
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
                            leftSection={coursesLoading ? <Loader size="xs" /> : null}
                            searchable
                            error={formErrors.name}
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
                              searchable
                              error={formErrors.cmid}
                            />

                            { !!formData.courseid && !!formData.module
                              ? <>
                                  <Anchor
                                    href={formData.module.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 text-sm inline-flex gap-1"
                                  >
                                    View module in course <IconExternalLink className="size-4 stroke-1" />
                                  </Anchor>
                                </>
                              : null
                            }
                          </div>
                          
                          <div className="flex gap-4">
                            <div>
                              <Text fz="sm" mb="5px" fw={500} c="#212529">Start time</Text>
                              <DateTimePicker 
                                value={dayjs.unix(Number(formData.timestart))}
                                onChange={(newValue) => updateField('timestart', (newValue?.unix() ?? 0).toString())}
                                views={['day', 'month', 'year', 'hours', 'minutes']}
                                readOnly={viewStateProps.readOnly}
                                slotProps={{
                                  textField: {
                                    error: false,
                                  },
                                }}
                              />
                            </div>
                            <div>
                              <Text fz="sm" mb="5px" fw={500} c="#212529">End / Due time</Text>
                              <DateTimePicker 
                                value={dayjs.unix(Number(formData.timeend))}
                                onChange={(newValue) => {
                                  manuallyEdited.current = true;
                                  updateField('timeend', (newValue?.unix() ?? 0).toString());
                                }}
                                views={['day', 'month', 'year', 'hours', 'minutes']}
                                readOnly={viewStateProps.readOnly}
                                slotProps={{
                                  textField: {
                                    error: !!formErrors.timeend,
                                  },
                                }}
                                defaultValue={dayjs.unix(Number(formData.timestart))}
                              />
                              {formErrors.timeend ? <div className="text-red-600 text-xs mt-1">{formErrors.timeend}</div> : null}
                            </div>
                          </div>

                          <TextInput
                            placeholder=""
                            label="Assessment name"
                            value={formData.name ? formData.name : formData.module ? formData.module.label : ""}
                            onChange={(e) => updateField('name', e.target.value)}
                            readOnly={viewStateProps.readOnly}
                          />   

                          <div>
                            <div className="font-semibold mb-2">Created by</div>
                            <Group key={formData.creatordata.un} gap="sm">
                              <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + formData.creatordata.un} />
                              <Text>{formData.creatordata.fn} {formData.creatordata.ln}</Text>
                            </Group>
                          </div>           
                          
                        </div>
                  </Card>
                  <Card withBorder className="overflow-visible rounded p-4 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">

                      { !!Number(formData.activityid)
                        ? <>
                            <span className="font-semibold">Linked Activity</span>
                            <div className="flex mr-4">
                              <Button 
                                color="dark" 
                                variant="light" 
                                aria-label="Filters" 
                                size="compact-md" 
                                leftSection={<IconExternalLink size={18} />} 
                                className="h-8 rounded-r-none"
                                component={Link}                        
                                to={'/' + formData.activityid}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {formData.activityname}
                              </Button>
                              <ActionIcon color="dark" onClick={() => updateField('activityid', 0)} variant="light" size="compact-md" ml={2} className="rounded-l-none pl-1 pr-1">
                                <IconX stroke={1.5} size={18} />
                              </ActionIcon>
                            </div>
                          </>
                        : <>
                            <Checkbox
                              label="Do you require an activity for this assessment?"
                              checked={formData.activityrequired || false}  // Ensures it's always boolean
                              onChange={(e) => updateField('activityrequired', e.target.checked)}
                              readOnly={viewStateProps.readOnly}
                            />
                            {formData.activityrequired && !viewStateProps.readOnly &&
                              <div className="flex gap-4 items-top pt-2">
                                <ActivitiesSearchInput
                                  placeholder="Search activities"
                                  delay={300}
                                  onSelect={selectActivity}
                                />
                                <div className="mt-1">
                                  <span className="text-gray-400 mr-1">or </span>
                                  <Button 
                                    variant="light"
                                    type="submit" 
                                    size="compact-sm" 
                                    radius="xl"
                                    onClick={() => handleSubmit('/new')}
                                  >
                                    Create new
                                  </Button>
                                </div>
                              </div>
                            } 
                          </>
                      }
                    </div>


                    {!formData.activityrequired && (
                      <>
                        <Checkbox
                          label="Do you require a student roll?"
                          checked={formData.rollrequired || false}  // Ensures it's always boolean
                          onChange={(e) => updateField('rollrequired', e.target.checked)}
                          readOnly={viewStateProps.readOnly}
                        />
                      </>
                    )}


                  </Card>


                  {!formData.activityrequired && formData.rollrequired &&
                    <StudentList id={Number(formData.id)} studentlist={formData.studentlist} setStudents={(students: User[]) => updateField('studentlist', students)} />
                  } 


                  <div className="flex gap-4 justify-between items-center">
                    <Button 
                      className="mt-4 px-3"
                      type="submit" 
                      size="compact-lg" 
                      radius="xl" 
                      leftSection={<IconCloudUp className='size-5' />} 
                      loading={submitLoading}
                      onClick={() => handleSubmit()}
                    >
                      Save
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="light"
                        className="mt-4 px-3"
                        type="submit" 
                        size="compact-sm" 
                        radius="xl" 
                        disabled={submitLoading}
                        onClick={() => handleSubmit(undefined, true)}
                      >
                        Save & return to list
                      </Button>
                      <ActionIcon 
                        variant="transparent"
                        size="sm"
                        className="mt-4"
                        radius="xl" 
                        disabled={submitLoading}
                        onClick={() => handleDelete()}
                      >
                        <IconTrash className="size-5 text-red-500" />
                      </ActionIcon>
                    </div>
                  </div>
                </Box>
              </div>
          </Container>
        </> : null
        }
        {notification && (
          <Notification 
            {...notification}
            onClose={() => setNotification(null)}
            className="fixed bottom-0 right-0 m-4"
            style={{
              position: 'fixed',
              bottom: rem(16),
              right: rem(16),
              animation: notification ? `${slideIn} 300ms ease-out` : undefined,
            }}
          />
        )}
      </div>
      <Footer />
    </>
  )
}
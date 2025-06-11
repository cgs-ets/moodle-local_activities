import { useEffect, useState } from "react";
import { Box, Container, Grid, Center, Text, Loader, Card, Anchor, rem } from '@mantine/core';
import { useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import dayjs from "dayjs";
import { defaults, useFormStore } from "../../stores/formStore";
import { cn } from "../../utils/utils";
import { PageHeader } from "../Activity/components/PageHeader";
import { StuPermission } from "./Components/StuPermission";
import { ActivityDetails } from "./Components/ActivityDetails";
import useFetch from "../../hooks/useFetch";


interface PermissionsHelper {
  activitystarted: boolean;
  ispastdueby: boolean;
  ispastlimit: boolean;
}

export function Permission() {
  let { id } = useParams();

  const formData = useFormStore()
  const activityid = useFormStore((state) => state.id)
  const setFormData = useFormStore((state) => state.setState)
  const [permissions, setPermissions] = useState([])
  const [permissionshelper, setPermissionsHelper] = useState<PermissionsHelper|null>(null)
  const api = useFetch()


  useEffect(() => {
    document.title = 'Activity Permission'
    if (id) {
      getActivity()
    }
  }, [id]);


  const getActivity = async () => {
    const fetchResponse = await api.call({
      query: {
        methodname: 'local_activities-get_activity_with_permission',
        id: id,
      }
    })
  
    if (fetchResponse && !fetchResponse.error) {
      document.title = fetchResponse.data.activityname + " - Permission"
  
      const { stupermissions, permissionshelper, ...activity } = fetchResponse.data
  
      setPermissions(stupermissions)
      setPermissionsHelper(permissionshelper)
  
      const data = {
        ...activity,
        timestart: Number(activity.timestart) ? activity.timestart : dayjs().unix(),
        timeend: Number(activity.timeend) ? activity.timeend : dayjs().unix(),
      }
      setFormData({...defaults, ...data})
    }
  }

  const expired = () => {
    return permissionshelper?.activitystarted || permissionshelper?.ispastdueby || permissionshelper?.ispastlimit
  }



  return (
    <>
      <Header />
      <div className="page-wrapper" style={{minHeight: 'calc(100vh - 154px)'}}>
        { !activityid 
          ? <Center h={200} mx="auto"><Loader type="dots" /></Center> : null
        }

        { activityid && !permissions.length ?
          <Container size="xl">
            <Center h={300}>
              <Text fw={600} fz="lg">You are not a parent of a participant in this activity...</Text>
            </Center>
          </Container> : null
        }

        { activityid && permissions.length
          ? <>
              <Container size="xl">
                <PageHeader />
              </Container>
              <Container size="xl" my="md">
                <Grid grow>
                  <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Box className="flex flex-col gap-4">
                      <ActivityDetails activity={formData}  />
                    </Box>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Box className="flex flex-col gap-4">
                      <Card withBorder className="p-0">
                        <div className="px-4 py-3">
                          <Text fz="md">Permissions</Text>
                        </div>

                        { expired()
                          ? <>
                              { permissionshelper?.activitystarted 
                                ? <div className="bg-red-100 px-4 py-3">Activity has already started. Responses are no longer accepted for this activity.</div>
                                : permissionshelper?.ispastdueby
                                  ? <div className="bg-red-100 px-4 py-3">Responses (due {dayjs.unix(Number(formData.permissionsdueby)).format("DD MMM YY h:mma")}) are no longer accepted for this activity. </div> 
                                  : permissionshelper?.ispastlimit
                                    ? <div className="bg-red-100 px-4 py-3">The maximum number of allocations have been accepted for this activity.</div> 
                                    : <div className="bg-red-100 px-4 py-3">Responses are no longer accepted for this activity.</div> 
                              }
                            </>
                          : null
                        }
                        { permissions.map((permission: any) => (
                          <div key={permission.id} className={cn(expired() ? "pointer-events-none" : null)}>
                            <StuPermission expired={expired() || false} permissionid={permission.id} student={permission.student} init={Number(permission.response ?? 0)} />
                          </div>
                        ))}
                      </Card>


                      <Card withBorder className="p-0">
                        <div className="border-b px-4 py-3">
                          <Text fz="md">Notice</Text>
                        </div>
                        <div className="px-4 py-3">
                          <p>Up-to-date information plays a crucial role in the safe management of students and staff on excursions.</p>
                          <p>Please review and update where appropriate, the schools’ records of your child’s current medical information and management plans, your emergency contact details, and any other important information, via the <Anchor fz="sm" href="https://infiniti.canberragrammar.org.au/Infiniti/Produce/launch.aspx?id=f95c8a98-8410-4a3e-ab46-0c907ddb9390&portal=1" target="_blank">Update Student & Family Details Form</Anchor></p>
                        </div>
                      </Card>
                    </Box>
                  </Grid.Col>
                </Grid>
              </Container>
            </> : null
        }
      </div>

      
      
      <Footer />
    </>
  )
}
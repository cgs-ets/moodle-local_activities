import { useEffect, useState } from "react";
import { Box, Container, Grid, Center, Text, Loader, Button, ActionIcon, Card, Anchor, Group, Avatar } from '@mantine/core';
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useAjax } from '../../hooks/useAjax';
import dayjs from "dayjs";
import { useStateStore } from "../../stores/stateStore";
import { defaults, useFormStore, useFormValidationStore } from "../../stores/formStore";
import { IconPencil } from "@tabler/icons-react";
import { cn, isActivity } from "../../utils/utils";
import { PageHeader } from "../Activity/components/PageHeader";
import { StuPermission } from "./Components/StuPermission";
import { ActivityDetails } from "../../components/ActivityDetails/ActivityDetails";

export function Permission() {
  let { id } = useParams();

  const formData = useFormStore()
  const setFormData = useFormStore((state) => state.setState)
  const setFormState = useStateStore((state) => state.setState)
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchData] = useAjax(); // destructure state and fetch function

  useEffect(() => {
    document.title = 'Activity Permission'
    // Load existing activity.
    if (id) {
      console.log("fetching activity..")
      fetchAjax({
        query: {
          methodname: 'local_activities-get_activity_with_permission',
          id: id,
        }
      })
    } else {
      setFormData(null)
      setFormState(null)
    }
  }, [id]);

  useEffect(() => {
    if (fetchResponse && !fetchError) {
      document.title = fetchResponse.data.activity.activityname + " - Permission"
      const data = {
        ...fetchResponse.data.activity,
        timestart: Number(fetchResponse.data.activity.timestart) ? fetchResponse.data.activity.timestart : dayjs().unix(),
        timeend: Number(fetchResponse.data.activity.timeend) ? fetchResponse.data.activity.timeend : dayjs().unix(),
      }
      // Merge into default values
      setFormData({...defaults, ...data})
    }
  }, [fetchResponse]);

  const expired = () => {
    return fetchResponse.data.permissionshelper.activitystarted || fetchResponse.data.permissionshelper.ispastdueby || fetchResponse.data.permissionshelper.ispastlimit
  }

  return (
    <>
      <Header />
      <div className="page-wrapper" style={{minHeight: 'calc(100vh - 154px)'}}>
        { id && !fetchResponse ? (
          <Center h={200} mx="auto"><Loader type="dots" /></Center>
        ) : (
            id && ( fetchError || !fetchResponse.data.permissions.length)
            ? <Container size="xl">
                <Center h={300}>
                  <Text fw={600} fz="lg">Failed to load activity permission...</Text>
                </Center>
              </Container>
            : <>
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
                            ? <div className="bg-red-100 px-4 py-3">Responses are no longer accepted for this activity.</div>
                            : null
                          }
                          {fetchResponse.data.permissions.map((permission: any) => (
                            <div className={cn(expired() ? "pointer-events-none" : null)}>
                              <StuPermission key={permission.id} expired={expired()} permissionid={permission.id} student={permission.student} init={Number(permission.response ?? 0)} />
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
              </>
        )}
      </div>
      <Footer />
    </>
  )
}
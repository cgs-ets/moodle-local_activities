import { useEffect, useState } from "react";
import { Box, Container, Card, Text, Loader, Center, Title, Group, Badge, Anchor, Avatar } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCheck, IconUser, IconX } from '@tabler/icons-react';
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import dayjs from "dayjs";
import useFetch from "../../hooks/useFetch";
import { User } from "../../types/types";

interface StudentSyncStatus {
  un: string;
  fn: string;
  ln: string;
  synced: boolean;
}

interface ActivitySyncData {
  id: number;
  activityname: string;
  timestart: number;
  timeend: number;
  staffincharge: User;
  students: StudentSyncStatus[];
}

export function VerifySync() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [activities, setActivities] = useState<ActivitySyncData[]>([]);
  const [loading, setLoading] = useState(false);
  const api = useFetch();

  useEffect(() => {
    document.title = 'Verify Sync';
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchSyncData();
    }
  }, [selectedDate]);

  const fetchSyncData = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const response = await api.call({
        query: {
          methodname: 'local_activities-get_sync_verification',
          date: dayjs(selectedDate).unix(),
        }
      });

      if (response && !response.error) {
        setActivities(response.data || []);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching sync data:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getSyncIcon = (synced: boolean) => {
    return synced ? (
      <IconCheck size={16} color="green" />
    ) : (
      <IconX size={16} color="red" />
    );
  };

  const getSyncBadge = (synced: boolean) => {
    return synced ? (
      <Badge color="green" variant="light" size="sm">Synced</Badge>
    ) : (
      <Badge color="red" variant="light" size="sm">Not Synced</Badge>
    );
  };

  return (
    <>
      <Header />
      <div className="page-wrapper" style={{minHeight: 'calc(100vh - 154px)'}}>
        <Container size="xl" py="md">
          <Title order={1} mb="lg">Verify Sync Status</Title>
          
          <Card withBorder mb="lg">
            <Group justify="space-between" align="center">
              <Text fw={500}>Select Date:</Text>
              <DatePickerInput
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Pick a date"
                clearable={false}
                valueFormat="DD/MM/YYYY"
              />
            </Group>
          </Card>

          {loading ? (
            <Center h={200}>
              <Loader type="dots" />
            </Center>
          ) : activities.length === 0 ? (
            <Card withBorder>
              <Center h={200}>
                <Text c="dimmed">No activities found for the selected date.</Text>
              </Center>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id} withBorder>
                  <Box mb="md">
                    <Group justify="space-between" align="flex-start">
                      <Box>
                        <Title order={4} mb="xs">
                          <a target="_blank" href={`/local/activities/${activity.id}`}>{activity.activityname}</a>
                        </Title>
                        <Text size="sm" c="dimmed">
                          {dayjs.unix(activity.timestart).format("DD MMM YYYY h:mm A")} - {dayjs.unix(activity.timeend).format("DD MMM YYYY h:mm A")}
                        </Text>
                        <Badge variant='filled' pl={0} size="lg" h={28} color="gray.2" radius="xl" leftSection={
                            <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + activity.staffincharge.un}><IconUser /></Avatar>
                          }
                        >
                          <Text className="normal-case font-normal text-black text-sm">{activity.staffincharge.fn} {activity.staffincharge.ln} ({activity.staffincharge.un})</Text>
                        </Badge>
                      </Box>
                      <Badge color="blue" variant="light">
                        {activity.students.length} Students
                      </Badge>
                    </Group>
                  </Box>

                  <Box>
                    <Text fw={500} mb="xs">Student Sync Status:</Text>
                    <div className="space-y-2">
                      {activity.students.map((student, index) => (
                        <Group key={index} justify="space-between" className="p-2 bg-gray-50 rounded">
                          <Group gap="xs">
                            {getSyncIcon(student.synced)}
                            <Badge variant='filled' pl={0} size="lg" h={28} color="gray.2" radius="xl" leftSection={
                                <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + student.un}><IconUser /></Avatar>
                              }
                            >
                              <Text className="normal-case font-normal text-black text-sm">{student.fn} {student.ln} ({student.un})</Text>
                            </Badge>
                          </Group>
                          {getSyncBadge(student.synced)}
                        </Group>
                      ))}
                    </div>
                  </Box>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </div>
      <Footer />
    </>
  );
}

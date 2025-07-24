import { useEffect, useState } from "react";
import { Box, Container, Card, Text, Loader, Center, Title, Group, Badge } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import dayjs from "dayjs";
import useFetch from "../../hooks/useFetch";

interface StudentSyncStatus {
  username: string;
  synced: boolean;
}

interface ActivitySyncData {
  id: number;
  activityname: string;
  timestart: number;
  timeend: number;
  staffincharge: string;
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
                        <Title order={3} mb="xs">{activity.activityname}</Title>
                        <Text size="sm" c="dimmed">
                          {dayjs.unix(activity.timestart).format("DD MMM YYYY h:mm A")} - {dayjs.unix(activity.timeend).format("h:mm A")}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Staff: {activity.staffincharge}
                        </Text>
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
                            <Text size="sm">{student.username}</Text>
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

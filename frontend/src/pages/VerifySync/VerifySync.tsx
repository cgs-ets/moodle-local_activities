import { useEffect, useState } from "react";
import { Container, Card, Text, Loader, Center, Title, Group, Badge, Avatar } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCheck, IconUser, IconX } from '@tabler/icons-react';
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import dayjs from "dayjs";
import useFetch from "../../hooks/useFetch";
import { ActivityDetails } from "../../components/ActivityDetails";
import { Form } from "../../stores/formStore";

interface StudentSyncStatus {
  un: string;
  fn: string;
  ln: string;
  synced: boolean;
}

interface ActivitySyncData extends Form {
  id: number;
  students: StudentSyncStatus[];
}

export function VerifySync() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [activities, setActivities] = useState<ActivitySyncData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
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
        setError(response?.exception?.message || "Unknown error occurred.");
      }
    } catch (error: any) {
      console.error('Error fetching sync data:', error);
      setActivities([]);
      setError(error?.message || "Failed to fetch sync data.");
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
          <Title order={1} mb="lg">Absences sync verification</Title>

          <Text mb="lg">
            The following list shows all <strong>approved</strong> activities that have <strong>students</strong> and that <strong>start on the selected date</strong>. 
            <br />
            Students that do not have <strong>permission</strong> to attend are not included in the list.
            <br />
            <strong>Synced</strong> means that the student has an absence record for the activity.
            <br />
            <strong>Not Synced</strong> means that the student does not have an absence record for the activity.
          </Text>
          
          <Card withBorder mb="lg">
            <div className="flex items-center gap-6">
              <Text className="font-bold">Select Date</Text>
              <DatePickerInput
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Pick a date"
                clearable={false}
                valueFormat="DD/MM/YYYY"
                className="w-48"
              />
            </div>
          </Card>

          {loading ? (
            <Center h={200}>
              <Loader type="dots" />
            </Center>
          ) : error ? (
            <Card withBorder>
              <Center h={200}>
                <Text c="red">{error}</Text>
              </Center>
            </Card>
          ) : activities.length === 0 ? (
            <Card withBorder>
              <Center h={200}>
                <Text c="dimmed">No activities found for the selected date.</Text>
              </Center>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id} withBorder className="p-0">
                  <Text className="first-letter:uppercase p-4 border-b mb-2" fz="xl" fw={600}>{activity.activityname}</Text>
                  <ActivityDetails activity={activity as Form} isPublic={false} />
                  <div className="p-4 border-t">
                    <div className='font-bold mb-2'>Students</div>
                    <div className="space-y-2">
                      {activity.students.map((student, index) => (
                        <Group key={index} justify="space-between" className="p-2 bg-gray-50 rounded">
                          <Group gap="xs">
                            {getSyncIcon(student.synced)}
                            <Badge variant="transparent" pl={0} size="lg" h={28} color="gray.2" radius="xl" leftSection={
                                <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + student.un}><IconUser /></Avatar>
                              }
                            >
                              <Text className="ml-1 normal-case font-normal text-black text-sm">{student.fn} {student.ln} ({student.un})</Text>
                            </Badge>
                          </Group>
                          {getSyncBadge(student.synced)}
                        </Group>
                      ))}
                    </div>
                  </div>
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

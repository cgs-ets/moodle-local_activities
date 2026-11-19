import { useEffect, useState } from "react";
import { Card, Text, Loader, Center, Badge, Table, Anchor } from '@mantine/core';
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import useFetch from "../../../hooks/useFetch";
import { statuses } from "../../../utils";
import { ApprovalWaitingOn, UnapprovedRow } from "../../../components/ApprovalWaitingOn";
import { capitalise, staffName } from "../../../utils/unapproved";

interface UpcomingRow extends UnapprovedRow {
  daysuntil: number;
}

export function UpcomingTab() {
  const [rows, setRows] = useState<UpcomingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useFetch();

  useEffect(() => {
    fetchRows();
  }, []);

  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.call({
        query: {
          methodname: 'local_activities-get_upcoming_unapproved',
        }
      });
      if (response && !response.error) {
        setRows(response.data || []);
      } else {
        setRows([]);
        setError(response?.exception?.message || "Unknown error occurred.");
      }
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Failed to fetch activities.");
    } finally {
      setLoading(false);
    }
  };

  const isDraft = (row: UpcomingRow) => row.status === statuses.saved;

  return (
    <>
      <Text mb="lg" c="dimmed">
        Excursions and incursions that are <strong>in draft</strong> or <strong>in review</strong> and start in the <strong>next 14 days</strong>.
      </Text>

      {loading ? (
        <Center h={200}>
          <Loader type="dots" />
        </Center>
      ) : error ? (
        <Card withBorder>
          <Center h={120}>
            <Text c="red">{error}</Text>
          </Center>
        </Card>
      ) : rows.length === 0 ? (
        <Card withBorder>
          <Center h={120}>
            <Text c="dimmed">No unapproved activities in the next 14 days.</Text>
          </Center>
        </Card>
      ) : (
        <Card withBorder p={0}>
          <Text size="sm" c="dimmed" px="md" py="xs" className="border-b">
            {rows.length} {rows.length === 1 ? 'activity' : 'activities'}
          </Text>
          <Table.ScrollContainer minWidth={900}>
            <Table striped highlightOnHover verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Starts</Table.Th>
                  <Table.Th>Activity</Table.Th>
                  <Table.Th>Type / campus</Table.Th>
                  <Table.Th>Staff in charge</Table.Th>
                  <Table.Th>Waiting on</Table.Th>
                  <Table.Th>Progress</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => (
                  <Table.Tr key={`${row.id}-${row.timestart}`}>
                    <Table.Td className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Text size="sm">{dayjs.unix(row.timestart).format('ddd D MMM, h:mma')}</Text>
                        <Badge color={row.daysuntil <= 7 ? 'red' : 'orange'} variant="light" size="xs">
                          {row.daysuntil <= 0 ? 'today' : `in ${row.daysuntil}d`}
                        </Badge>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Anchor component={Link} to={`/${row.id}`} target="_blank" size="sm" fw={500}>
                        {row.activityname}
                      </Anchor>
                      {isDraft(row) && (
                        <Badge color="gray" variant="light" size="xs" ml={6}>Draft</Badge>
                      )}
                      {row.is_occurrence && (
                        <Text span size="xs" c="dimmed" ml={6}>Occurrence</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{capitalise(row.activitytype)} · {capitalise(row.campus)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{staffName(row.staffincharge)}</Text>
                    </Table.Td>
                    <Table.Td>
                      {isDraft(row)
                        ? <Text size="sm" c="dimmed">Not submitted</Text>
                        : <ApprovalWaitingOn nextstep={row.nextstep} />}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{isDraft(row) ? '—' : `${row.approvedcount}/${row.totalsteps}`}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      )}
    </>
  );
}

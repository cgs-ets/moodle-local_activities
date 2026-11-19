import { useEffect, useState } from "react";
import { Card, Text, Loader, Center, Badge, Table, Anchor } from '@mantine/core';
import { DatePickerInput, DatesRangeValue } from '@mantine/dates';
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import useFetch from "../../../hooks/useFetch";
import { ApprovalWaitingOn, UnapprovedRow } from "../../../components/ApprovalWaitingOn";
import { capitalise, staffName } from "../../../utils/unapproved";

interface PastRow extends UnapprovedRow {
  daysago: number;
  approvedlate: boolean;
  timeapproved: number | null;
}

export function PastTab() {
  const [range, setRange] = useState<DatesRangeValue>([dayjs().startOf('year').toDate(), dayjs().startOf('day').toDate()]);
  const [rows, setRows] = useState<PastRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useFetch();

  useEffect(() => {
    const [start, end] = range;
    if (start && end) {
      fetchRows(start, end);
    }
  }, [range]);

  const fetchRows = async (start: Date, end: Date) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.call({
        query: {
          methodname: 'local_activities-get_past_unapproved',
          from: dayjs(start).startOf('day').unix(),
          to: dayjs(end).startOf('day').unix(),
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

  const lateCount = rows.filter((row) => row.approvedlate).length;

  const renderOutcome = (row: PastRow) => {
    if (row.approvedlate && row.timeapproved) {
      const daysafter = dayjs.unix(row.timeapproved).startOf('day').diff(dayjs.unix(row.timestart).startOf('day'), 'day');
      return (
        <div className="flex flex-wrap items-center gap-1">
          <Badge color="orange" variant="light" size="xs">Approved late</Badge>
          <Text size="sm" c="dimmed">
            In review when it ran · approved {dayjs.unix(row.timeapproved).format('D MMM YYYY')}
            {daysafter > 0 ? ` (${daysafter} ${daysafter === 1 ? 'day' : 'days'} after start)` : ' (same day, after start)'}
          </Text>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-center gap-1">
        <Badge color="red" variant="light" size="xs">Still in review</Badge>
        <ApprovalWaitingOn nextstep={row.nextstep} />
      </div>
    );
  };

  return (
    <>
      <Text mb="lg" c="dimmed">
        Excursions and incursions that <strong>ran while still in review</strong>, including those <strong>approved after the fact</strong>.
      </Text>

      <Card withBorder mb="lg">
        <div className="flex flex-wrap items-center gap-4">
          <Text className="font-bold">Activity start between</Text>
          <DatePickerInput
            type="range"
            value={range}
            onChange={setRange}
            maxDate={new Date()}
            valueFormat="DD/MM/YYYY"
            allowSingleDateInRange
            className="w-64"
          />
        </div>
      </Card>

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
            <Text c="dimmed">No activities ran while in review in the selected range.</Text>
          </Center>
        </Card>
      ) : (
        <Card withBorder p={0}>
          <Text size="sm" c="dimmed" px="md" py="xs" className="border-b">
            {rows.length} {rows.length === 1 ? 'activity' : 'activities'} · {rows.length - lateCount} still in review · {lateCount} approved late
          </Text>
          <Table.ScrollContainer minWidth={1000}>
            <Table striped highlightOnHover verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Ran</Table.Th>
                  <Table.Th>Activity</Table.Th>
                  <Table.Th>Type / campus</Table.Th>
                  <Table.Th>Staff in charge</Table.Th>
                  <Table.Th>Outcome</Table.Th>
                  <Table.Th>Progress</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => (
                  <Table.Tr key={`${row.id}-${row.timestart}`}>
                    <Table.Td className="whitespace-nowrap">
                      <Text size="sm">{dayjs.unix(row.timestart).format('ddd D MMM YYYY, h:mma')}</Text>
                      <Text size="xs" c="dimmed">{row.daysago <= 0 ? 'today' : `${row.daysago}d ago`}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Anchor component={Link} to={`/${row.id}`} target="_blank" size="sm" fw={500}>
                        {row.activityname}
                      </Anchor>
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
                    <Table.Td>{renderOutcome(row)}</Table.Td>
                    <Table.Td>
                      <Text size="sm">{row.approvedcount}/{row.totalsteps}</Text>
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

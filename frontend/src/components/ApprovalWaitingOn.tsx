import { Badge, Text } from '@mantine/core';

// Shared row types for the upcoming/past unapproved lists.
export interface UserStub {
  un: string;
  fn: string;
  ln: string;
}

export interface NextStep {
  name: string;
  status: number;
  nominated: string;
  nominatedname: string;
}

export interface UnapprovedRow {
  id: number;
  activityname: string;
  activitytype: string;
  campus: string;
  status: number;
  timestart: number;
  timeend: number;
  is_occurrence: boolean;
  staffincharge: UserStub | null;
  approvedcount: number;
  totalsteps: number;
  nextstep: NextStep | null;
}

// Mirrors workflow_lib::APPROVAL_STATUS_REJECTED.
const APPROVAL_STATUS_REJECTED = 2;

/**
 * The next unactioned approval step: step name, nominee (or a warning), and a Rejected badge.
 */
export function ApprovalWaitingOn({ nextstep }: { nextstep: NextStep | null }) {
  if (!nextstep) {
    return <Text size="sm" c="dimmed">—</Text>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Text size="sm">{nextstep.name}</Text>
      {nextstep.status === APPROVAL_STATUS_REJECTED && (
        <Badge color="red" variant="light" size="xs">Rejected</Badge>
      )}
      {nextstep.nominatedname ? (
        <Text size="sm" c="dimmed">({nextstep.nominatedname})</Text>
      ) : (
        <Badge color="yellow" variant="light" size="xs">No approver nominated</Badge>
      )}
    </div>
  );
}

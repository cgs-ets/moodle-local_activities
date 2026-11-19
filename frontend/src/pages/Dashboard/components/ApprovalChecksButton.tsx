import { Button } from '@mantine/core';
import { useEffect, useState } from 'react';
import { IconClipboardCheck } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import useFetch from '../../../hooks/useFetch';

/**
 * Link to the unapproved checks page. Only shown to approvers, since the page is approver-only.
 * The approver check may query the SIS, so it is fetched after the dashboard renders.
 */
export function ApprovalChecksButton() {
  const [isApprover, setIsApprover] = useState(false)
  const api = useFetch()

  useEffect(() => {
    const check = async () => {
      const res = await api.call({
        query: {
          methodname: 'local_activities-get_is_approver',
        }
      })
      setIsApprover(!!res && !res.error && !!res.data)
    }
    check()
  }, []);

  if (!isApprover) {
    return null
  }

  return (
    <div className="px-4 py-3 border-b bg-white">
      <Button
        component={Link}
        to="/unapproved-checks"
        fullWidth
        variant="light"
        radius="lg"
        leftSection={<IconClipboardCheck size={20} />}
      >
        Approval checks
      </Button>
    </div>
  );
}

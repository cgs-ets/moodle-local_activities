import { Card, Text } from '@mantine/core';
import { statuses } from '../../../../utils';
import { useFormStore } from '../../../../stores/formStore';
import { entryStatus, excursionStatus, isActivity } from '../../../../utils/utils';


export function StatusViewOnly() {

  const status = useFormStore((state) => (state.status))
  const activitytype = useFormStore((state) => (state.activitytype))


  const statusText = () => {
    return isActivity(activitytype)
    ? excursionStatus()
    : entryStatus()
  }

  return (
    <Card withBorder radius="sm" p="md"  className="overflow-visible rounded-b-none"
      bg={
        isActivity(activitytype)
        ? status == statuses.inreview 
          ? "orange.1" 
          : (status == statuses.approved 
            ? "apprgreen.1" 
            : ''
          )
        : ""
      }
    >
      <div className="page-pretitle">Status</div>      
      <Text size="md" fw={500}>{ statusText() }</Text>

    </Card>
  )

}
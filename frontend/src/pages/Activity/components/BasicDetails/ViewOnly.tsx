import { Text, Card } from '@mantine/core';
import { IconArrowNarrowRight } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useFormStore } from "../../../../stores/formStore";

export function BasicDetailsViewOnly() {

  const formData = useFormStore()
  const description = useFormStore((state) => (state.description))

  return (
    <Card withBorder className="overflow-visible rounded p-4 flex flex-col gap-6">

      <div className="flex flex-col gap-4">
        <div>
          <Text fz="sm" mb="5px" fw={500} c="#212529">Type</Text>
          <span>{
            formData.activitytype == 'excursion' 
            ? 'Excursion' 
            : formData.activitytype == 'incursion' 
              ? 'Incursion' 
              : formData.activitytype == 'calendar' 
                ? 'Calendar entry' 
                : formData.activitytype == 'commercial'
                  ? 'Commercial'
                  : 'Assessment'
          }</span>
        </div>

        <div>
          <Text fz="sm" mb="5px" fw={500} c="#212529">Campus</Text>
          <span>{formData.campus == 'primary' ? 'Primary School' : formData.campus == 'senior' ? 'Senior School' : 'Whole School'}</span>
        </div>
        
        <div className="flex gap-4 items-center">
          <div>
            <Text fz="sm" mb="5px" fw={500} c="#212529">Start time</Text>
            <span>{dayjs.unix(Number(formData.timestart)).format("DD/MM/YYYY H:mm")}</span>
          </div>
          <div>
            <span>&nbsp;</span>
            <IconArrowNarrowRight className="size-4" />
          </div>
          <div>
            <Text fz="sm" mb="5px" fw={500} c="#212529">End time</Text>
            <span>{dayjs.unix(Number(formData.timeend)).format("DD/MM/YYYY H:mm")}</span>
          </div>
        </div>

        <div>
          <Text fz="sm" fw={500} c="#212529">Location</Text>
          <Text className="text-sm">{formData.location}</Text>
        </div>

        <div>
          <Text fz="sm" fw={500} c="#212529">Description</Text>
          <div className="text-sm"><div dangerouslySetInnerHTML={ {__html: description} }></div></div>
        </div>

      </div>
    </Card>
  );
};
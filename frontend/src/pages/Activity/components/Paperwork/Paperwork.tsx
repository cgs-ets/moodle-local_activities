import { Anchor, Card, Grid, Text } from '@mantine/core';
import { FileUploader } from './components/FileUploader/FileUploader';
import '@mantine/dropzone/styles.css';
import { IconDownload } from '@tabler/icons-react';
import { useFormStore } from '../../../../stores/formStore';
import { useStateStore } from '../../../../stores/stateStore';

export function Paperwork() {
  const activityid = useFormStore((state) => state.id)
  const cost = useFormStore((state) => state.cost)
  const viewStateProps = useStateStore((state) => (state.viewStateProps))

  return (
    <>
      <Card withBorder radius="sm">
        <Card.Section withBorder inheritPadding py="sm">
          <h3 className="text-base m-0">Documentation</h3>
        </Card.Section>
        <Card.Section>



          <div className='border-b p-4'>
            <Text className="font-semibold inline">Risk Assessment</Text>
            <Anchor target='_blank' href="https://kb.cgs.act.edu.au/guides/risk-assessment-template/" className="text-sm inline ml-2 inline-flex items-center gap-1">Template <IconDownload className='size-3' /></Anchor>
            <FileUploader inputName="riskassessment" desc="or Drag file. The file must not exceed 10mb." maxFiles={1} maxSize={10} />
          </div>

          <div className='border-b p-4'>
            <Text className="font-semibold">Other Documentation</Text>
            <FileUploader inputName="attachments" desc="or Drag files. Maximum 10 files. Each file should not exceed 10mb." maxFiles={10} maxSize={10} />
          </div>




        </Card.Section>
      </Card>
    </>
  );
};
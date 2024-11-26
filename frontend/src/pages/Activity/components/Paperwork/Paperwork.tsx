import { Anchor, Card, Grid, Text } from '@mantine/core';
import { FileUploader } from './components/FileUploader/FileUploader';
import '@mantine/dropzone/styles.css';
import { IconDownload } from '@tabler/icons-react';

export function Paperwork() {

  return (
    <>
      <Card withBorder radius="sm" pb="xl" className='overflow-visible'>
        <Card.Section withBorder inheritPadding py="sm">
          <h3 className="text-base m-0">Paperwork</h3>
        </Card.Section>
        <Card.Section inheritPadding py="sm">
          <Grid gutter="xl">
            <Grid.Col span={12}>
              <Text className="font-semibold inline">Risk Assessment</Text>
              <Anchor target='_blank' href="https://kb.cgs.act.edu.au/guides/risk-assessment-template/" className="text-sm inline ml-2 inline-flex items-center gap-1">Template <IconDownload className='size-3' /></Anchor>
              <FileUploader inputName="riskassessment" desc="or Drag file. The file must not exceed 10mb." maxFiles={1} maxSize={10} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Text className="font-semibold">Attachments</Text>
              <FileUploader inputName="attachments" desc="or Drag files. Maximum 10 files. Each file should not exceed 10mb." maxFiles={10} maxSize={10} />
            </Grid.Col>
          </Grid>
        </Card.Section>
      </Card>
    </>
  );
};
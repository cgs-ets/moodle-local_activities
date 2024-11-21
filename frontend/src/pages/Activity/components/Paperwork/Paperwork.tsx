import { Card, Grid } from '@mantine/core';
import { FileUploader } from './components/FileUploader/FileUploader';
import '@mantine/dropzone/styles.css';

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
              <FileUploader inputName="riskassessment" title="Risk Assessment" desc="or Drag file. The file must not exceed 10mb." maxFiles={1} maxSize={10} />
            </Grid.Col>
            <Grid.Col span={12}>
              <FileUploader inputName="attachments" title="Attachments" desc="or Drag files. Maximum 10 files. Each file should not exceed 10mb." maxFiles={10} maxSize={10} />
            </Grid.Col>
          </Grid>
        </Card.Section>
      </Card>
    </>
  );
};
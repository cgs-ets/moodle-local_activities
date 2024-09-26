import { Card, Grid } from '@mantine/core';
import { StaffSelector } from "./components/StaffSelector";
import { AsyncAutocomplete } from './components/StaffSelector/index2';

export function StaffDetails() {

  return (
    <Card.Section inheritPadding py="sm">
      <Grid gutter="xl">
        <Grid.Col span={12}>
          <AsyncAutocomplete />
        </Grid.Col>
        <Grid.Col span={12}>
          <StaffSelector stafftype="planning" label="Planning staff" />
        </Grid.Col>
        <Grid.Col span={12}>
          <StaffSelector stafftype="accompanying" label="Accompanying staff" />
        </Grid.Col>
      </Grid>
    </Card.Section>
  );
};
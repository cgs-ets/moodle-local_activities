import { Breadcrumbs, Container, Text } from '@mantine/core';
import { Link } from "react-router-dom";

interface Props {
  id: string;
  activityid: string;
  name: string;
}

export function PageHeader(props: Props) {
  return (
    <>
      <div className="page-header">
        <Container size="xl" my="md" p={0}>
            <Breadcrumbs fz="sm" mb="sm">
              <Link to="/">
                <Text c="blue">Activities</Text>
              </Link>
              <Link to={`/${props.activityid}`}>
                <Text c="blue">Activity</Text>
              </Link>
              <Text c="gray.6">{props.id ? `Risk Assessment` : `New Risk Assessment` }</Text>
            </Breadcrumbs>
        </Container>
      </div>
    </>
  );
}
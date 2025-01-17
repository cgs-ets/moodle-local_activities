import { Breadcrumbs, Container, Text } from '@mantine/core';
import { Link } from "react-router-dom";

interface Props {
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
              <Link to="/assessments">
                <Text c="blue">Assessments</Text>
              </Link>
              <Text c="gray.6">{props.name ? props.name : `Entry` }</Text>
            </Breadcrumbs>
            <h2 className="page-title">{props.name ? props.name : `New assessment` }</h2>
        </Container>
      </div>
    </>
  );
}
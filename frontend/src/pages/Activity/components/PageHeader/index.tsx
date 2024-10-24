import { Breadcrumbs, Container, Text } from '@mantine/core';
import { Link } from "react-router-dom";
import { statuses } from "../../../../utils";
import { useFormStore } from '../../../../stores/formStore';

export function PageHeader() {
  const name = useFormStore((state) => (state.activityname))
  const status = useFormStore((state) => (state.status))

  return (
    <>
      <div className="page-header">
        <Container size="xl" my="md" p={0}>
            <Breadcrumbs fz="sm" mb="sm">
              <Link to="/">
                <Text color="blue">Dashboard</Text>
              </Link>
              <Link to={location.pathname}>
                <Text color="gray.6">Activity</Text>
              </Link>
            </Breadcrumbs>
            <h2 className="page-title">{name ? name : ( status == statuses.draft ? 'New activity' : 'Edit activity') }</h2>
        </Container>
      </div>
    </>
  );
}
import { Breadcrumbs, Container, Text } from '@mantine/core';
import { useBasicDetailsStore } from '../../store/formFieldsStore'
import { useFormMetaStore } from '../../store/formMetaStore'
import { Link } from "react-router-dom";
import { statuses } from "../../../../utils";

export function PageHeader() {
  const name = useBasicDetailsStore((state) => (state.activityname))
  const status = useFormMetaStore((state) => (state.status))

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
            <h2 className="page-title">{name ? name : ( status == statuses.unsaved ? 'New activity' : 'Edit activity') }</h2>
        </Container>
      </div>
    </>
  );
}
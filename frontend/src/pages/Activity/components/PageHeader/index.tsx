import { Badge, Breadcrumbs, Card, Container, Text } from '@mantine/core';
import { Link } from "react-router-dom";
import { statuses } from "../../../../utils";
import { useFormStore } from '../../../../stores/formStore';
import { useStateStore } from '../../../../stores/stateStore';

export function PageHeader() {
  const name = useFormStore((state) => (state.activityname))
  const status = useFormStore((state) => (state.status))
  const viewStateProps = useStateStore((state) => (state.viewStateProps))

  return (
    <>
      <div className="page-header">
        <Container size="xl" my="md" p={0} className="relative">
            <Breadcrumbs fz="sm" mb="sm">
              <Link to="/">
                <Text c="blue">Calendar</Text>
              </Link>
              <Text c="gray.6">Activity</Text>
            </Breadcrumbs>
            <h2 className="page-title">{name ? name : ( status == statuses.draft ? `New activity` : `Edit activity`) } </h2>
            { false && viewStateProps.readOnly &&
              <Badge className="absolute top-1 right-0" bg={"orange.1"}>
                <span className="text-black">Read Only</span>
              </Badge>
            }
        </Container>
      </div>
    </>
  );
}
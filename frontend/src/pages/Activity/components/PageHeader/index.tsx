import { Breadcrumbs, Container, Text } from '@mantine/core';
import { Link } from "react-router-dom";
import { statuses } from "../../../../utils";
import { useFormStore } from '../../../../stores/formStore';

type Props = {
  entityname: string;
}
export function PageHeader(props: Props) {
  const name = useFormStore((state) => (state.activityname))
  const status = useFormStore((state) => (state.status))

  return (
    <>
      <div className="page-header">
        <Container size="xl" my="md" p={0}>
            <Breadcrumbs fz="sm" mb="sm">
              <Link to="/">
                <Text c="blue">Calendar</Text>
              </Link>
              <Text c="gray.6">{props.entityname}</Text>
            </Breadcrumbs>
            <h2 className="page-title">{name ? name : ( status == statuses.draft ? `New ${props.entityname.toLowerCase()}` : `Edit ${props.entityname.toLowerCase()}`) } </h2>
        </Container>
      </div>
    </>
  );
}
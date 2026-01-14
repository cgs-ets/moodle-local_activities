import { Breadcrumbs, Button, Container, Text } from '@mantine/core';
import { Link } from "react-router-dom";
import { defaults, useFormStore } from '../../../stores/formStore';
import { IconArrowLeft, IconMessageCircle } from '@tabler/icons-react';

interface Props {
  id: string;
  activityid: string;
  name: string;
}

export function PageHeader(props: Props) {
  //const setFormData = useFormStore((state) => state.setFormData)

  //const handleClick = () => {
  //  setFormData({...defaults})
  //}

  return (
    <>
      <div className="page-header">
        <Container size="xl" my="md" p={0}>
          <div className="flex justify-between items-center">
            <Breadcrumbs fz="sm">
              <Link to="/">
                <Text c="blue">Activities</Text>
              </Link>
              <Link to={`/${props.activityid}`}>
                <Text c="blue">Activity</Text>
              </Link>
              <Text c="gray.6">{props.id ? `Risk Assessment` : `New Risk Assessment` }</Text>
            </Breadcrumbs>
          </div>
        </Container>
      </div>
    </>
  );
}
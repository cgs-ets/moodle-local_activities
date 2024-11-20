import { Card, Timeline, Text, Avatar, Group, ThemeIcon, Anchor, List } from '@mantine/core';
import { IconUser, IconCheck, IconSun, IconVaccine, IconSend } from '@tabler/icons-react';

import { statuses } from '../../../../utils';
import { useFormStore } from '../../../../stores/formStore';
import { isExcursion } from '../../../../utils/utils';


export function NextSteps() {
  const status = useFormStore((state) => state.status)
  const activitytype = useFormStore((state) => state.activitytype)
  const permissions = useFormStore((state) => state.permissions)


  return (
    status == statuses.approved && isExcursion(activitytype) &&
    <Card withBorder radius="sm" mb="lg">
      <Card.Section withBorder inheritPadding py="sm">
        <h3 className="text-base m-0">Next steps</h3>
      </Card.Section>

      <Card.Section inheritPadding py="md">

      <Timeline bulletSize={24}>

        {permissions &&
          <Timeline.Item 
            title="Parent permissions" 
          >
            <Text c="dimmed" size="sm">
              Prepare and send parent permission requests
            </Text>
          </Timeline.Item>
        }


        <Timeline.Item 
          title="Venue Booking " 
        >
          <Text c="dimmed" size="sm">
            Have you secured a venue? Begin by confirming availability and booking through <Anchor target="_blank" href="https://sobs.com.au/ui/login.php?schoolid=728">SOBS Primary</Anchor> or <Anchor target="_blank" href="https://sobs.com.au/ui/login.php?schoolid=157">SOBS Senior</Anchor>, ensuring your reservation includes time for setup and pack-down. 
          </Text>
          <Text c="dimmed" size="sm">
            If you’re booking the Snow Concert Hall, please complete the information that’s required in SOBS. 
          </Text>
        </Timeline.Item>


        <Timeline.Item 
          title="Catering Requirements " 
        >
          <Text c="dimmed" size="sm">
            If your activity requires catering, please complete the <Anchor target="_blank" href="https://infiniti.canberragrammar.org.au/Infiniti/Produce/launch.aspx?id=db4a01bf-5152-46e3-b345-6a560946de3e&portal=1">Catering Request Form</Anchor>. 
          </Text>
          <Text c="dimmed" size="sm">
            If you’re booking the Snow Concert Hall, please complete the information that’s required in SOBS. 
          </Text>
        </Timeline.Item>



        <Timeline.Item 
          title="Logistical Support " 
        >
          <Text c="dimmed" size="sm">
            For any logistical support, such as event setup, or equipment needs, submit a request through the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Property and Facilities Support Desk link</Anchor>. As these requests are supported by different teams, can you please put in separate tickets for 
          </Text>
          <List type="unordered" c="dimmed" size="sm">
            <List.Item>Cleaning (Please specify whether the event is intended for external participants, including parents. This information is essential to ensure our spaces are appropriately presented for any external visitors) </List.Item>
            <List.Item>Event setup and pack-down requirements, with times </List.Item>
            <List.Item>Equipment needed. </List.Item>
            </List>
        </Timeline.Item>



        <Timeline.Item 
          title="IT Support " 
        >
          <Text c="dimmed" size="sm">
            For technical assistance, including audio-visual needs, doors or room access (SALTO), access control support, submit a ticket through the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Ed Tech Support Desk link</Anchor>. 
          </Text>
        </Timeline.Item>


        <Timeline.Item 
          title="Marketing, Design, and Communications " 
        >
          <Text c="dimmed" size="sm">
          For graphic design, communications (such as CGS Connect news and announcements), photography, or online RSVP/payment system (Humanitix), submit a ticket via the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Marketing, Graphic Design and Events Support Desk link</Anchor>. If you need event management support, select "Events" in the drop-down menu to notify the Events Manager and team. 
          </Text>
        </Timeline.Item>


        <Timeline.Item 
          title="Student Projects " 
        >
          <Text c="dimmed" size="sm">
          If this is a student-led project and you are the supervising staff member, direct students to raise requests via the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Student Projects Support Desk link </Anchor>. These steps will help ensure thorough preparation for your event, covering all aspects from venue to support services. 
          </Text>
        </Timeline.Item>




        <Timeline.Item title={<Text>Ready</Text>}>
          <Text color="dimmed" size="sm">You're all set to go!</Text>
        </Timeline.Item>


      </Timeline>


          

      </Card.Section>
    </Card>
  );
}
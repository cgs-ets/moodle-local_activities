import { Card, Timeline, Text, Anchor, List } from '@mantine/core';

import { statuses } from '../../../../utils';
import { useFormStore } from '../../../../stores/formStore';
import { isActivity } from '../../../../utils/utils';
import { Accordion } from '@mantine/core';
import { IconAd2, IconAward, IconBuilding, IconBuildingPavilion, IconChecklist, IconCircle, IconCircleDashedCheck, IconCloudComputing, IconMeat, IconToolsKitchen2, IconTruckLoading } from '@tabler/icons-react';


export function NextSteps() {
  const status = useFormStore((state) => state.status)
  const activitytype = useFormStore((state) => state.activitytype)
  const permissions = useFormStore((state) => state.permissions)


  return (
    status == statuses.approved && isActivity(activitytype) &&
    <Card withBorder radius="sm" mb="lg">
      <Card.Section withBorder inheritPadding py="sm">
        <h3 className="text-base m-0">Next steps</h3>
      </Card.Section>

      <Card.Section>


      <Accordion>
        {permissions &&
          <Accordion.Item value="permissions">
            <Accordion.Control
              icon={
                <IconChecklist className='size-5' />
              }
            >
              Parent permissions
            </Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed" size="sm">Prepare and send parent permission requests</Text>
            </Accordion.Panel>
          </Accordion.Item>
        }

        <Accordion.Item value="venue">
          <Accordion.Control
            icon={
              <IconBuildingPavilion className='size-5' />
            }
          >
            Venue Booking
          </Accordion.Control>
          <Accordion.Panel>
            <Text c="dimmed" size="sm">
              Have you secured a venue? Begin by confirming availability and booking through <Anchor target="_blank" href="https://sobs.com.au/ui/login.php?schoolid=728">SOBS Primary</Anchor> or <Anchor target="_blank" href="https://sobs.com.au/ui/login.php?schoolid=157">SOBS Senior</Anchor>, ensuring your reservation includes time for setup and pack-down. 
            </Text>
            <Text c="dimmed" size="sm">
              If you’re booking the Snow Concert Hall, please complete the information that’s required in SOBS. 
            </Text>
          </Accordion.Panel>
        </Accordion.Item>


        <Accordion.Item value="catering">
          <Accordion.Control
            icon={
              <IconToolsKitchen2 className='size-5' />
            }
          >
            Catering Requirements
          </Accordion.Control>
          <Accordion.Panel>
            <Text c="dimmed" size="sm">
              If your activity requires catering, please complete the <Anchor target="_blank" href="https://infiniti.canberragrammar.org.au/Infiniti/Produce/launch.aspx?id=db4a01bf-5152-46e3-b345-6a560946de3e&portal=1">Catering Request Form</Anchor>. 
            </Text>
            <Text c="dimmed" size="sm">
              If you’re booking the Snow Concert Hall, please complete the information that’s required in SOBS. 
            </Text>
          </Accordion.Panel>
        </Accordion.Item>





        <Accordion.Item value="logistics">
          <Accordion.Control
            icon={
              <IconTruckLoading className='size-5' />
            }
          >
            Logistical Support
          </Accordion.Control>
          <Accordion.Panel>
            <Text c="dimmed" size="sm">
              For any logistical support, such as event setup, or equipment needs, submit a request through the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Property and Facilities Support Desk link</Anchor>. As these requests are supported by different teams, can you please put in separate tickets for 
            </Text>
            <List type="unordered" c="dimmed" size="sm">
              <List.Item>Cleaning (Please specify whether the event is intended for external participants, including parents. This information is essential to ensure our spaces are appropriately presented for any external visitors) </List.Item>
              <List.Item>Event setup and pack-down requirements, with times </List.Item>
              <List.Item>Equipment needed. </List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="it">
          <Accordion.Control
            icon={
              <IconCloudComputing className='size-5' />
            }
          >
            IT Support
          </Accordion.Control>
          <Accordion.Panel>
            <Text c="dimmed" size="sm">
              For technical assistance, including audio-visual needs, doors or room access (SALTO), access control support, submit a ticket through the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Ed Tech Support Desk link</Anchor>. 
            </Text>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="marketing">
          <Accordion.Control
            icon={
              <IconAd2 className='size-5' />
            }
          >
            Marketing, Design, and Communications
          </Accordion.Control>
          <Accordion.Panel>
            <Text c="dimmed" size="sm">
              For graphic design, communications (such as CGS Connect news and announcements), photography, or online RSVP/payment system (Humanitix), submit a ticket via the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Marketing, Graphic Design and Events Support Desk link</Anchor>. If you need event management support, select "Events" in the drop-down menu to notify the Events Manager and team. 
            </Text>
          </Accordion.Panel>
        </Accordion.Item>



        <Accordion.Item value="projects">
          <Accordion.Control
            icon={
              <IconAward className='size-5' />
            }
          >
            Student Projects
          </Accordion.Control>
          <Accordion.Panel>
            <Text c="dimmed" size="sm">
              If this is a student-led project and you are the supervising staff member, direct students to raise requests via the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Student Projects Support Desk link </Anchor>. These steps will help ensure thorough preparation for your event, covering all aspects from venue to support services. 
            </Text>
          </Accordion.Panel>
        </Accordion.Item>


        <Accordion.Item value="ready">
          <Accordion.Control
            icon={
              <IconCircleDashedCheck className='size-5' />
            }
          >
            Ready
          </Accordion.Control>
          <Accordion.Panel>
            <Text color="dimmed" size="sm">You're all set to go!</Text>
          </Accordion.Panel>
        </Accordion.Item>



      </Accordion>














          

      </Card.Section>
    </Card>
  );
}
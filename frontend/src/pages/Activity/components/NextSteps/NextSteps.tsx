import { Card, Timeline, Text, Anchor, List } from '@mantine/core';

import { statuses } from '../../../../utils';
import { useFormStore } from '../../../../stores/formStore';
import { isActivity } from '../../../../utils/utils';
import { Accordion } from '@mantine/core';
import { IconAd2, IconAward, IconBuilding, IconBuildingPavilion, IconChecklist, IconCircle, IconCircleDashedCheck, IconCloudComputing, IconMeat, IconReportMoney, IconToolsKitchen2, IconTruckLoading } from '@tabler/icons-react';
import { useStateStore } from '../../../../stores/stateStore';


export function NextSteps() {
  const status = useFormStore((state) => state.status)
  const activitytype = useFormStore((state) => state.activitytype)
  const permissions = useFormStore((state) => state.permissions)
  const viewStateProps = useStateStore((state) => (state.viewStateProps))


  return (
    //status == statuses.approved && 
    isActivity(activitytype) && 
    viewStateProps.editable &&
    <Card withBorder radius="sm" mb="lg">
      
      {false && <Card.Section withBorder inheritPadding py="sm">
        <h3 className="text-base m-0">Next steps</h3>
      </Card.Section>}

      <Card.Section className='p-4 xbg-gray-50 border-b'>To help streamline your activity planning process at CGS, we’ve provided a list of essential components for you to consider for pre- and post-activity arrangements.</Card.Section>

      <Card.Section>
      <Accordion>
        {status == statuses.approved && permissions &&
          <Accordion.Item value="permissions">
            <Accordion.Control
              icon={
                <IconChecklist className='size-5' />
              }
            >
              Parent permissions
            </Accordion.Control>
            <Accordion.Panel>
              <Text size="sm">Prepare and send parent permission requests using the permissions feature on the left side of this page.</Text>
            </Accordion.Panel>
          </Accordion.Item>
        }

        


        <Accordion.Item value="catering">
          <Accordion.Control
            icon={
              <IconToolsKitchen2 className='size-5' />
            }
          >
            Catering Requirements
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">
              If your activity requires catering, please complete the <Anchor target="_blank" href="https://infiniti.canberragrammar.org.au/Infiniti/Produce/launch.aspx?id=db4a01bf-5152-46e3-b345-6a560946de3e&portal=1">Catering Request Form</Anchor>. 
            </Text>
          </Accordion.Panel>
        </Accordion.Item>




        <Accordion.Item value="financial">
          <Accordion.Control
            icon={
              <IconReportMoney className='size-5' />
            }
          >
            Financial Approvals
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">
            If your activity has cost implications, please ensure that the financials have been approved formally - See your line manager, HoD or Director.
            </Text>
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
            <Text size="sm">
              For technical assistance, including audio-visual needs or access control support, submit a ticket through the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Ed Tech Support Desk link</Anchor>.
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
            <Text size="sm">
              For any logistical support, such as event setup or equipment needs, submit a request through the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Property and Facilities Support Desk link</Anchor>. Remember to include pack-up information as well.
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
            <Text size="sm">
              For graphic design, communications (such as CGS Connect news and announcements), photography, or online RSVP/payment system (Humanitix), submit a ticket via the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Marketing, Graphic Design and Events Support Desk link</Anchor>. If you require event management support, select "Events" in the drop-down menu to notify the Events Manager and team.
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
            <Text size="sm">
              If this is a student-led project and you are the supervising staff member, please pass onto the student the <Anchor target="_blank" href="https://kb.cgs.act.edu.au/guides/senior-school-student-projects">Project Guidelines link</Anchor>. These guidelines will prompt students to then requests further assistance via the <Anchor target="_blank" href="https://support.cgs.act.edu.au/">Student Projects Support Desk link </Anchor>.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>


        <Accordion.Item value="venue">
          <Accordion.Control
            icon={
              <IconBuildingPavilion className='size-5' />
            }
          >
            Venue Booking
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm">
              Have you secured a venue? Begin by confirming availability and booking through <Anchor target="_blank" href="https://sobs.com.au/ui/login.php?schoolid=728">SOBS Primary</Anchor> or <Anchor target="_blank" href="https://sobs.com.au/ui/login.php?schoolid=157">SOBS Senior</Anchor>, ensuring your reservation includes time for setup and pack-up. Any classroom bookings will need to go through SOBS and an email sent to the <Anchor target="_blank" href="mailto:timetable@cgs.act.edu.au">timetable@cgs.act.edu.au</Anchor> 
            </Text>
          </Accordion.Panel>
        </Accordion.Item>


      </Accordion>


          

      </Card.Section>
    </Card>
  );
}
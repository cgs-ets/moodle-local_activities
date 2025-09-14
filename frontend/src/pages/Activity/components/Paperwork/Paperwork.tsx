import { Accordion, ActionIcon, Anchor, Avatar, Box, Button, Card, Checkbox, Collapse, Grid, Group, Loader, Modal, Switch, Table, Text, Tooltip } from '@mantine/core';
import { FileUploader } from './components/FileUploader/FileUploader';
import '@mantine/dropzone/styles.css';
import { IconArchive, IconBrandAdobe, IconCheck, IconCircle, IconDownload, IconExternalLink, IconEye, IconFileTypePdf, IconPlus, IconSquare, IconSquareCheck, IconTrash, IconUser } from '@tabler/icons-react';
import { useFormStore } from '../../../../stores/formStore';
import { useStateStore } from '../../../../stores/stateStore';
import { useEffect, useState } from 'react';
import useFetch from '../../../../hooks/useFetch';
import dayjs from 'dayjs';
import { Link, useSearchParams } from 'react-router-dom';
import { getConfig, statuses } from '../../../../utils';
import { stat } from 'fs';
import { User } from '../../../../types/types';

export function Paperwork() {
  const [searchParams] = useSearchParams()
  const raid = searchParams.get('ra')
  const activityid = useFormStore((state) => state.id)
  const status = useFormStore((state) => state.status)
  const api = useFetch();
  const [raGenerations, setRaGenerations] = useState<any[]>([]);
  const [pulsing, setPulsing] = useState(false);
  const [selectedRA, setSelectedRA] = useState<any>(null);
  const [previewHtml, setPreviewHtml] = useState<any>(null);
  const viewStateProps = useStateStore((state) => (state.viewStateProps))
  const isapprover = useFormStore((state) => (state.isapprover))
  const isacknowledger = useFormStore((state) => (state.isacknowledger))
  const acknowledgers = useFormStore((state) => (state.acknowledgers))
  const hasUserAcknowledged = useFormStore((state) => (state.hasUserAcknowledged))
  const setHasUserAcknowledged = useFormStore((state) => (state.setHasUserAcknowledged))
  const [acknowledgedModalOpened, setAcknowledgedModalOpened] = useState(false);

  useEffect(() => {
    getRaGenerations();
  }, [activityid]);

  useEffect(() => {
    if (raid) {
      // Scroll to Paperwork section
      const paperworkSection = document.getElementById('paperwork-section');
      if (paperworkSection) {
        paperworkSection.scrollIntoView({ behavior: 'smooth' });
      }
      // Pulse the row
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 3000); // stop after 3s
      return () => clearTimeout(timer);
    }
  }, [raid]);

  const getRaGenerations = async () => {
    const response = await api.call({
      query: {
        methodname: 'local_activities-get_ra_generations',
        id: activityid,
      }
    });
    if (response.error) {
      return;
    }
    console.log(response.data);
    setRaGenerations(response.data);
  };

  const deleteRaGeneration = async (id: number) => {
    await api.call({
      query: {
        methodname: 'local_activities-delete_ra_generation',
        id: id,
      }
    });
    getRaGenerations();
  }

  const approveRaGeneration = async (id: number, approved: boolean) => {
    await api.call({
      query: {
        methodname: 'local_activities-approve_ra_generation',
        id: id,
        approved: approved ? 1 : 0,
      }
    });
    getRaGenerations();
  }

  const acknowledgeActivity = async (acknowledge: boolean) => {
    setHasUserAcknowledged(acknowledge);
    await api.call({
      query: {
        methodname: 'local_activities-acknowledge_activity',
        id: activityid,
        acknowledge: acknowledge ? 1 : 0,
      }
    });
  }

  /*const previewRA = async (raGeneration: any) => {
    const response = await api.call({
      query: {
        methodname: 'local_activities-preview_ra',
        id: raGeneration.id,
      }
    });
    if (response.error) {
      return;
    }
    setPreviewHtml(response.data);
  }

  useEffect(() => {
    if (selectedRA) {
      previewRA(selectedRA);
    } else {
      setPreviewHtml(null);
    }
  }, [selectedRA]);*/


  return (
    <>
      <Card withBorder radius="sm" id="paperwork-section">
        <Card.Section withBorder inheritPadding py="sm">
          <h3 className="text-base m-0">Documentation</h3>
        </Card.Section>

        <Card.Section>

          {(getConfig().user.un == '43563' || getConfig().user.un == 'admin') &&

            <>
              <div className='border-b p-4 space-y-2'>
                <Accordion variant="contained">
                  <Accordion.Item value="acknowledgments">
                    <Accordion.Control>
                      <div className='flex items-center gap-2'>
                        {hasUserAcknowledged 
                          ? <IconCheck className='size-6 text-green-500' /> 
                          : <IconCircle className='size-6 text-gray-400' />
                        }
                        <Text className="font-semibold">Acknowledgments</Text>
                      </div>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Text className="font-semibold">STAFF IN CHARGE (LEADER)</Text>
                      <Text className="text-sm">As the Staff Member in charge of the activity, I acknowledge that all Staff and Volunteers participating will be made aware of the risk mitigation strategies to be implemented and any additional activity documentation. I acknowledge I am responsible for all activity form updates in CAPMS to ensure all information is current for staff and school community reference. I understand I an actively responsible for engaging in the measures outlined in addition to CGS Policies, Procedures, and Guidelines.</Text>

                      <Text className="font-semibold">SECOND IN CHARGE (STAND BY LEADER)</Text>
                      <Text className="text-sm">If the Staff Member in charge of the activity is unable to attend, I will take the responsibility as Staff in Charge. I acknowledge that all Staff and Volunteers participating will be made aware of the risk mitigation strategies to be implemented and any additional activity documentation. I understand I an actively responsible for engaging in the measures outlined in addition to CGS Policies, Procedures, and Guidelines.</Text>

                      <Text className="font-semibold">ACCOMPANYING STAFF ACKNOWLEDGEMENT</Text>
                      <Text className="text-sm">I have read and understood the activity details and risk assessment. I understand the possible hazards and what measures will be put in place to lower the risk. I understand I an actively responsible for engaging in the measures outlined in addition to CGS Policies, Procedures, and Guidelines.</Text>
                    
                      {isacknowledger && viewStateProps.editable && 
                        <Checkbox 
                          checked={hasUserAcknowledged}
                          onChange={(v) => acknowledgeActivity(v.target.checked)} 
                          className="mt-5 mb-2" 
                          label="I acknowledge and accept my responsibilities in accordance with the above acknowledgments." 
                        />
                      }
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
                
                
                
                {acknowledgers.length > 0 && 
                  <div className='flex justify-start'>
                    <div className='flex items-center gap-2 py-2 px-4 bg-blue-50 border rounded-md cursor-pointer' onClick={() => setAcknowledgedModalOpened(true)}>
                      <Text className="text-sm font-semibold">Acknowledged by:</Text>
                      <Avatar.Group>
                        {acknowledgers.map((user: User, i: number) => {
                          return <Avatar size={24} key={i} src={'/local/activities/avatar.php?username=' + user.un}><IconUser /></Avatar>
                        })}
                      </Avatar.Group>
                    </div>
                  </div>

                }

              </div>

            { !activityid || (status == statuses.draft) ? 
              (
                <div className='border-b p-4 space-y-2'>
                  <Text className="font-semibold">Digital Risk Assessment</Text>
                  <Text className='text-xs bg-orange-100 p-2 rounded-md'>Save this activity to access the Risk Assessment generator.</Text>
                </div>
              ) : (
                <div className='border-b p-4 space-y-2'>
                
                  <div className='flex items-center justify-between'>
                    <Text className="font-semibold">Digital Risk Assessment</Text>
                    {viewStateProps.editable && raGenerations.length > 0 && <Link to={`/${activityid}/risk`}><Button leftSection={<IconPlus className='size-4' />} radius='xl' variant='filled' size='compact-sm'>Generate</Button></Link>}
                  </div>

                  {!raGenerations.length && api.state.loading && <Loader className='mx-auto' size='sm' />}

                  {raGenerations.length > 0 ?
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Td className='w-44'>Date</Table.Td>
                          <Table.Td>Categories</Table.Td>
                          <Table.Td className='w-56'></Table.Td>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {raGenerations.map((raGeneration) => (
                          <Table.Tr
                            key={raGeneration.id}
                            id={`risk-assessment-row-${raGeneration.id}`}
                            className={`${raid === raGeneration.id ? "bg-yellow-100" : ""} ${
                              pulsing ? "xanimate-pulse" : ""
                            }`}
                          >
                            <Table.Td>{dayjs.unix(Number(raGeneration.timecreated)).format("D MMM YYYY H:mma")}</Table.Td>
                            <Table.Td>{raGeneration.classifications.map((classification: any) => classification.name).join(', ')}</Table.Td>
                            <Table.Td>
                              { viewStateProps.editable && (

                                <Group className="justify-end pr-1">
                                  <ActionIcon onClick={() => deleteRaGeneration(raGeneration.id)} color='red' variant='light' size='compact-xs'><IconTrash className='size-4' /></ActionIcon>
                                
                                  <Button onClick={() => window.open(raGeneration.download_url + '?action=open', '_blank')} variant='light' size='compact-xs' rightSection={<IconDownload className='size-3' />}>PDF</Button>

                                  {isapprover ? (
                                    <Checkbox disabled={api.state.loading} checked={Number(raGeneration.approved) === 1} onChange={(v) => approveRaGeneration(raGeneration.id, v.target.checked)} />
                                  ) : (
                                    raGeneration.approved == 1 
                                    ? <Text className='text-xs text-green-500'>Approved</Text>
                                    : <Text className='text-xs text-gray-500'>Unapproved</Text>
                                  )}
                                </Group>
                              )}
                              
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  : !api.state.loading && 
                    <div>
                      <Text className='text-xs mb-3'>No Risk Assessments have been generated for this activity. Click the Generate button to create one.</Text>
                      {viewStateProps.editable && <Link to={`/${activityid}/risk`}><Button leftSection={<IconPlus className='size-4' />} radius='xl' variant='filled' size='compact-md'>Generate</Button></Link>}
                    </div>
                  }
                </div> 
              )
            }

          </>



          }

          <div className='border-b p-4'>
            <Text className="font-semibold inline">Risk Assessment</Text>
            <Anchor target='_blank' href="https://cgsacteduau.sharepoint.com/:f:/r/sites/cgssharedfolders/Primary%20School/Activity-Excursion%20Planning/Risk%20Assessment%20Templates?csf=1&web=1&e=0gnCbm" className="text-sm inline ml-2 inline-flex items-center gap-1">PS Templates <IconExternalLink className='size-3' /></Anchor>
            <FileUploader inputName="riskassessment" desc="or Drag file. The file must not exceed 10mb." maxFiles={1} maxSize={10} />
          </div>

          <div className='border-b p-4'>
            <Text className="font-semibold">Other Documentation</Text>
            <Text className='text-xs'>Other files, such as the programme outline, provider risk assessment, risk waivers, child safe policy etc, should be uploaded here.</Text>
            <FileUploader inputName="attachments" desc="or Drag files. Maximum 10 files. Each file should not exceed 10mb." maxFiles={10} maxSize={10} />
          </div>

        </Card.Section>
      </Card>

      <Modal
        title="Risk Assessment"
        opened={selectedRA} 
        withCloseButton={false}
        onClose={() => setSelectedRA(null)} 
        size="90%"
        styles={{
          header: {
            borderBottom: '0.0625rem solid #dee2e6',
          },
          title: {
            fontWeight: 600,
          },
          body: {
            padding: 0,
          }
        }}
      >
        {previewHtml ? (


            <div className="rendered-ra text-base p-10">
              <div dangerouslySetInnerHTML={ {__html: previewHtml || ''} }></div>
            </div>



        ) : (
          <div className="rendered-ra text-base">
            <Box className="flex flex-col justify-center items-center min-h-[200px]">
              <Loader size="lg" type="dots" />
              Please wait will the system generates a preview.
            </Box>
          </div>
        )}

      </Modal>

      <Modal
        opened={acknowledgedModalOpened} 
        onClose={() => setAcknowledgedModalOpened(false)} 
        title={`Acknowledgments`}
        size="md"
        styles={{
          header: {
            borderBottom: '0.0625rem solid #dee2e6',
          },
          title: {
            fontWeight: 600,
          },
          body: {
            padding: 0
          }
        }}
        >
          <div className="flex flex-col">
            {acknowledgers.map((user: User) => {
              return (
                <div key={user.un} className="flex gap-2 border-b px-4 py-2">
                  <Avatar size={24} key={user.un} src={'/local/activities/avatar.php?username=' + user.un}><IconUser /></Avatar>
                  <Text>{user.fn} {user.ln} ({user.un})</Text>
                </div>
              )
            })}
          </div>
      </Modal>
    </>
  );
};
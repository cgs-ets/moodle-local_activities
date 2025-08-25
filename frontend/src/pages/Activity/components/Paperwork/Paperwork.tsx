import { ActionIcon, Anchor, Button, Card, Checkbox, Collapse, Grid, Group, Switch, Table, Text } from '@mantine/core';
import { FileUploader } from './components/FileUploader/FileUploader';
import '@mantine/dropzone/styles.css';
import { IconArchive, IconBrandAdobe, IconDownload, IconExternalLink, IconEye, IconFileTypePdf, IconPlus } from '@tabler/icons-react';
import { useFormStore } from '../../../../stores/formStore';
import { useStateStore } from '../../../../stores/stateStore';
import { useEffect, useState } from 'react';
import useFetch from '../../../../hooks/useFetch';
import dayjs from 'dayjs';
import { Link, useSearchParams } from 'react-router-dom';

export function Paperwork() {
  const [searchParams] = useSearchParams()
  const raid = searchParams.get('ra')
  const activityid = useFormStore((state) => state.id)
  const cost = useFormStore((state) => state.cost)
  const viewStateProps = useStateStore((state) => (state.viewStateProps))
  const api = useFetch();
  const [raGenerations, setRaGenerations] = useState<any[]>([]);
  const [pulsing, setPulsing] = useState(false);
  const [showPreviousRAs, setShowPreviousRAs] = useState(false);
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

  return (
    <>
      <Card withBorder radius="sm" id="paperwork-section">
        <Card.Section withBorder inheritPadding py="sm">
          <h3 className="text-base m-0">Documentation</h3>
        </Card.Section>

        <Card.Section>

          {false &&
            <div className='border-b p-4 space-y-2'>
              <div className='flex items-center justify-between'>
                <Text className="font-semibold">Risk Assessment</Text>
                <Link to={`/${activityid}/risk`}><Button leftSection={<IconPlus className='size-4' />} radius='xl' variant='filled' size='compact-sm'>Generate</Button></Link>
              </div>
              {/* Show a list of RA Generations.
              It includes a list of classifications the user selected and a VIEW button which opens to the PDF rendering? */}
              
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Td className='w-44'>Date</Table.Td>
                    <Table.Td>Categories</Table.Td>
                    <Table.Td className='w-20'>Output</Table.Td>
                    <Table.Td className='w-26'>Actions</Table.Td>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {raGenerations.map((raGeneration) => (
                    <Table.Tr
                      key={raGeneration.id}
                      id={`risk-assessment-row-${raGeneration.id}`}
                      className={`${raid === raGeneration.id ? "bg-yellow-100" : ""} ${
                        pulsing ? "animate-pulse" : ""
                      }`}
                    >
                      <Table.Td>{dayjs.unix(Number(raGeneration.timecreated)).format("D MMM YYYY H:mma")}</Table.Td>
                      <Table.Td>{raGeneration.classifications.map((classification: any) => classification.name).join(', ')}</Table.Td>
                      <Table.Td>
                        <Button variant='light' size='compact-xs' onClick={() => window.open(raGeneration.download_url + '?action=open', '_blank')}>PDF</Button>
                      </Table.Td>
                      <Table.Td>
                        <Group>
                          <ActionIcon disabled={api.state.loading} onClick={() => deleteRaGeneration(raGeneration.id)} color='red' variant='light' size='compact-xs'><IconArchive className='size-4' /></ActionIcon>
                          <Checkbox disabled={api.state.loading} checked={Number(raGeneration.approved) === 1} onChange={(v) => approveRaGeneration(raGeneration.id, v.target.checked)} />
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
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
    </>
  );
};
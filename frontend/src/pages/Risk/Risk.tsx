import { useEffect, useState } from "react";
import { Box, Container, Center, Text, Loader, Card, Checkbox, Group, Stack, Grid, Button, Table, Badge, ActionIcon, Modal, Textarea, TextInput, Select } from '@mantine/core';
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import dayjs from "dayjs";
import { defaults, useFormStore } from "../../stores/formStore";
import { ActivityDetails } from "./Components/ActivityDetails";
import useFetch from "../../hooks/useFetch";
import { PageHeader } from "./Components/PageHeader";
import { SvgRenderer } from "../../components/SvgRenderer";
import { IconTornado, IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { Classification } from "./Settings";

interface RiskAssessment {
  riskVersion: number;
  selectedClassifications: number[];
}

interface CustomRisk {
  id?: number;
  hazard: string;
  riskrating_before: number;
  controlmeasures: string;
  riskrating_after: number;
  responsible_person: string;
  control_timing: string;
  risk_benefit: string;
}

export function Risk() {
  let { id } = useParams();
  let { activityid } = useParams();

  const formData = useFormStore()
  const setFormData = useFormStore((state) => state.setState)
  const api = useFetch()
  const [loading, setLoading] = useState(true)
  const [classifications, setClassifications] = useState<Classification[]>([])
  const [classificationsLoading, setClassificationsLoading] = useState(true)
  const navigate = useNavigate()

  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment>({
    riskVersion: 0,
    selectedClassifications: []
  })

  // Custom risks state
  const [customRisks, setCustomRisks] = useState<CustomRisk[]>([])
  const [customRiskModalOpen, setCustomRiskModalOpen] = useState(false)
  const [editingCustomRisk, setEditingCustomRisk] = useState<CustomRisk | null>(null)
  const [customRiskForm, setCustomRiskForm] = useState<CustomRisk>({
    hazard: '',
    riskrating_before: 1,
    controlmeasures: '',
    riskrating_after: 1,
    responsible_person: '',
    control_timing: '',
    risk_benefit: ''
  })

  document.title = 'Risk Assessment'

  useEffect(() => {
    if (activityid) {
      getActivity()
    }
  }, [activityid]);

  useEffect(() => {
    if (id) {
      getRiskAssessment()
    }
  }, [id]);

  useEffect(() => {
    loadPublishedRA()
    // Scroll page to top
    window.scrollTo(0, 0)
  }, []);

  const loadPublishedRA = async () => {
    setClassificationsLoading(true)
    try {
      const response = await api.call({
        query: {
          methodname: 'local_activities-get_ra_classifications',
          id: activityid,
        }
      })
      
      if (!response.error) {
        setClassifications(response.data.classifications)
        setRiskAssessment({
          riskVersion: response.data.version,
          selectedClassifications: response.data.classifications.filter((c: Classification) => !!c.preselected).map((c: Classification) => c.id),
        })
      }
    } catch (error) {
      console.error('Error loading classifications:', error)
    } finally {
      setClassificationsLoading(false)
    }
  }

  const getActivity = async () => {
    setLoading(true)
    const fetchResponse = await api.call({
      query: {
        methodname: 'local_activities-get_activity',
        id: activityid,
      }
    })
  
    if (fetchResponse && !fetchResponse.error) {
      document.title = fetchResponse.data.activityname + " - Risk Assessment";
      const data = {
        ...fetchResponse.data,
        timestart: Number(fetchResponse.data.timestart) ? fetchResponse.data.timestart : dayjs().unix(),
        timeend: Number(fetchResponse.data.timeend) ? fetchResponse.data.timeend : dayjs().unix(),
      }
      setFormData({...defaults, ...data})
    }
    setLoading(false)
  }

  const getRiskAssessment = async () => {
    const fetchResponse = await api.call({
      query: {
        methodname: 'local_activities-get_risk_assessment',
        id: id,
      }
    })
  
    if (fetchResponse && !fetchResponse.error) {
      console.log(fetchResponse.data)
      // TODO: Load existing risk assessment data if available
    }
  }

  // Custom risk functions
  const openCustomRiskModal = (risk?: CustomRisk) => {
    if (risk) {
      setEditingCustomRisk(risk)
      setCustomRiskForm(risk)
    } else {
      setEditingCustomRisk(null)
      setCustomRiskForm({
        hazard: '',
        riskrating_before: 1,
        controlmeasures: '',
        riskrating_after: 1,
        responsible_person: '',
        control_timing: '',
        risk_benefit: ''
      })
    }
    setCustomRiskModalOpen(true)
  }

  const saveCustomRisk = () => {
    if (editingCustomRisk) {
      // Update existing risk
      setCustomRisks(customRisks.map(r => 
        r === editingCustomRisk ? customRiskForm : r
      ))
    } else {
      // Add new risk
      setCustomRisks([...customRisks, { ...customRiskForm, id: Date.now() }])
    }
    setCustomRiskModalOpen(false)
  }

  const deleteCustomRisk = (risk: CustomRisk) => {
    setCustomRisks(customRisks.filter(r => r !== risk))
  }

  const generateRiskAssessment = async () => {
    const response = await api.call({
      method: 'POST',
      body: {
        methodname: 'local_activities-generate_ra',
        args: {
          activityid: activityid,
          riskassessment: riskAssessment,
          customRisks: customRisks,
        }
      }
    })

    if (response && !response.error) {
      // Navigate back to the activity page, with a search query for "paperwork"
      navigate(`/${activityid}?ra=${response.data.id}`)  
    }
  }

  const handleRiskAssessmentChange = (value: string[]) => {
    // conver to ints
    const ids = value.map(id => parseInt(id))

    //Loop through selected, and for each one that is selected, check if it has any contexts that are not selected
    const selected = ids.filter(id => {
      const classification = classifications.find(c => c.id === id)
      if (classification && isContextSelected(classification, ids)) {
        return true
      }
      return false
    })

    setRiskAssessment({
      ...riskAssessment,
      selectedClassifications: selected
    })
  }

  const isContextSelected = (classification: Classification, selectedIds: number[]) => {
    if (classification.contexts.length > 0 && !classification.contexts.every(c => selectedIds.includes(c))) {
      return false;
    }
    return true;
  }

  return (
    <>
      <Header />
      <div className="page-wrapper" style={{minHeight: 'calc(100vh - 154px)'}}>

      { !activityid 
          ? <Center h={200} mx="auto"><Loader type="dots" /></Center> : null
        }

        {
          loading &&
          <Container size="xl">
            <Center h={300}>
              <Loader type="dots" />
            </Center>
          </Container>
        }

        { !loading && !formData.usercanedit ?
          <Container size="xl">
            <Center h={300}>
              <Text fw={600} fz="lg">Sorry, activity not found or you do not have access to this page.</Text>
            </Center>
          </Container> : null
        }

        { activityid
          ? <>
              <Container size="xl">
                <PageHeader name={formData.activityname} id={id ?? ''} activityid={activityid} />
              </Container>
              <Container size="xl" my="md" className="space-y-6">
                <Box className="flex flex-col gap-4 border">
                  <ActivityDetails activity={formData}  />
                </Box>

                <Box className="flex flex-col gap-4">
                  <Card withBorder className="">
                    <Text fz="md">Specify the context</Text>
                    
                    {classificationsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader size="sm" />
                      </div>
                    ) : (

                      <Checkbox.Group
                        value={riskAssessment.selectedClassifications.map(id => id.toString())}
                        onChange={handleRiskAssessmentChange}
                        label=""
                      >
                        <Grid pt="md" gutter="md" columns={12}>
                          {classifications.filter(c => c.type === 'context').map((classification) => {
                            // Only display this classification if all of its contexts are selected
                            if (!isContextSelected(classification, riskAssessment.selectedClassifications)) {
                              return null;
                            }
                            // Don't display if standard or hidden
                            if (classification.isstandard || classification.hidden) {
                              return null;
                            }
                            return (
                              <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={classification.id}>
                                <Checkbox.Card 
                                  radius="md" 
                                  value={classification.id.toString()} 
                                  className="p-4 h-full flex items-start"
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="pt-1">
                                      <Checkbox.Indicator />
                                    </div>
                                    <div>
                                      <div className="flex items-start gap-2">
                                        {classification.icon && (<SvgRenderer svgString={classification.icon} className="w-6 h-6 flex-shrink-0" />)}
                                        <Text className="font-semibold text-md">{classification.name}</Text>
                                      </div>
                                      <Text c="dimmed" fz="sm">{classification.description}</Text>
                                    </div>
                                  </div>
                                </Checkbox.Card>
                              </Grid.Col>
                            )
                          })}
                        </Grid>
                      </Checkbox.Group>
                    )}
                  </Card>
                </Box>

                <Box className="flex flex-col gap-4">
                  <Card withBorder className="">
                    <Text fz="md">Select all that apply</Text>
                    
                    {classificationsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader size="sm" />
                      </div>
                    ) : (

                      <Checkbox.Group
                        value={riskAssessment.selectedClassifications.map(id => id.toString())}
                        onChange={handleRiskAssessmentChange}
                        label=""
                      >
                        <Grid pt="md" gutter="md" columns={12}>
                          {classifications.filter(c => c.type === 'hazards').map((classification) => {
                            // Only display this classification if all of its contexts are selected
                            if (!isContextSelected(classification, riskAssessment.selectedClassifications)) {
                              return null;
                            }
                            // Don't display if standard or hidden
                            if (classification.isstandard || classification.hidden) {
                              return null;
                            }
                            return (
                              <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={classification.id}>
                                <Checkbox.Card 
                                  radius="md" 
                                  value={classification.id.toString()} 
                                  className="p-4 h-full flex items-start"
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="pt-1">
                                      <Checkbox.Indicator />
                                    </div>
                                    <div>
                                      <div className="flex items-start gap-2">
                                        {classification.icon && (<SvgRenderer svgString={classification.icon} className="w-6 h-6 flex-shrink-0" />)}
                                        <Text className="font-semibold text-md">{classification.name}</Text>
                                      </div>
                                      <Text c="dimmed" fz="sm">{classification.description}</Text>
                                    </div>
                                  </div>
                                </Checkbox.Card>
                              </Grid.Col>
                            )
                          })}
                        </Grid>
                      </Checkbox.Group>
                    )}
                  </Card>
                </Box>

                <Box className="flex flex-col gap-4">
                  <Card withBorder>
                    <Group justify="space-between" mb="md">
                      <Text fz="md">Custom Risks</Text>
                      <Button 
                        leftSection={<IconPlus size={16} />}
                        onClick={() => openCustomRiskModal()}
                        size="compact-md"
                        radius="xl"
                      >
                        Add Custom Risk
                      </Button>
                    </Group>
                    
                    {customRisks.length === 0 ? (
                      <span></span>
                    ) : (
                      <Table
                        style={{ width: 'auto', tableLayout: 'auto' }}
                        withColumnBorders
                        highlightOnHover
                      >
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Hazard</Table.Th>
                            <Table.Th>Risk Rating (Before)</Table.Th>
                            <Table.Th>Control Measures</Table.Th>
                            <Table.Th>Risk Rating (After)</Table.Th>
                            <Table.Th>Responsible Person</Table.Th>
                            <Table.Th>Control Timing</Table.Th>
                            <Table.Th>Risk/Benefit</Table.Th>
                            <Table.Th style={{ width: '90px' }}>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {customRisks.map((risk) => (
                            <Table.Tr key={risk.id}>
                              <Table.Td>
                                <Text size="sm">{risk.hazard}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge variant="light" color={
                                  risk.riskrating_before === 1 ? "red" :
                                  risk.riskrating_before === 2 ? "orange" :
                                  risk.riskrating_before === 3 ? "yellow" :
                                  risk.riskrating_before === 4 ? "lime" :
                                  risk.riskrating_before === 5 ? "green" :
                                  "gray"
                                }>
                                  {risk.riskrating_before}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{risk.controlmeasures}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge variant="light" color={
                                  risk.riskrating_after === 1 ? "red" :
                                  risk.riskrating_after === 2 ? "orange" :
                                  risk.riskrating_after === 3 ? "yellow" :
                                  risk.riskrating_after === 4 ? "lime" :
                                  risk.riskrating_after === 5 ? "green" :
                                  "gray"
                                }>
                                  {risk.riskrating_after}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{risk.responsible_person}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{risk.control_timing}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{risk.risk_benefit}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Group gap="xs">
                                  <ActionIcon 
                                    variant="subtle" 
                                    color="blue"
                                    onClick={() => openCustomRiskModal(risk)}
                                  >
                                    <IconEdit size={16} />
                                  </ActionIcon>
                                  <ActionIcon 
                                    variant="subtle" 
                                    color="red"
                                    onClick={() => deleteCustomRisk(risk)}
                                  >
                                    <IconTrash size={16} />
                                  </ActionIcon>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Card>
                </Box>

                <div>
                  <Button 
                    onClick={() => generateRiskAssessment()}
                    color="blue"
                    size="compact-md"
                    radius="xl"
                  >
                    Generate Risk Assessment
                  </Button>
                </div>

                {false &&
                  <div>
                    <Text fz="sm" c="dimmed" mb="xs">Debug Information:</Text>
                    <pre className="text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify({
                        formData: {
                          activityname: formData.activityname,
                          campus: formData.campus,
                          studentlist: formData.studentlist?.length || 0
                        },
                        riskAssessment,
                        selectedClassifications: riskAssessment.selectedClassifications.map(id => 
                          classifications.find(c => c.id === id)?.name
                        ),
                        customRisks: customRisks.length
                      }, null, 2)}
                    </pre>
                  </div>
                }
              </Container>
            </> : null
        }
        

      </div>

      {/* Custom Risk Modal */}
      <Modal 
        opened={customRiskModalOpen} 
        onClose={() => setCustomRiskModalOpen(false)}
        title={editingCustomRisk ? 'Edit Custom Risk' : 'Add Custom Risk'}
        size="xl"
      >
        <Box>
          <Textarea
            label="Hazard"
            placeholder="Describe the hazard..."
            value={customRiskForm.hazard}
            onChange={(e) => setCustomRiskForm({ ...customRiskForm, hazard: e.target.value })}
            mb="md"
            required
            autosize
            minRows={3}
          />
          
          <Textarea
            label="Control Measures"
            placeholder="Describe the control measures..."
            value={customRiskForm.controlmeasures}
            onChange={(e) => setCustomRiskForm({ ...customRiskForm, controlmeasures: e.target.value })}
            mb="md"
            required
            minRows={3}
            autosize
          />

          <Group grow>
            <Select
              label="Risk Rating (Before)"
              value={customRiskForm.riskrating_before.toString()}
              onChange={(value) => setCustomRiskForm({ ...customRiskForm, riskrating_before: parseInt(value || '1') })}
              mb="md"
              required
              data={[
                { value: '1', label: '1 - Very High' },
                { value: '2', label: '2 - High' },
                { value: '3', label: '3 - Medium' },
                { value: '4', label: '4 - Low' },
                { value: '5', label: '5 - Very Low' },
              ]}
            />
            <Select
              label="Risk Rating (After)"
              value={customRiskForm.riskrating_after.toString()}
              onChange={(value) => setCustomRiskForm({ ...customRiskForm, riskrating_after: parseInt(value || '1') })}
              mb="md"
              required
              data={[
                { value: '1', label: '1 - Very High' },
                { value: '2', label: '2 - High' },
                { value: '3', label: '3 - Medium' },
                { value: '4', label: '4 - Low' },
                { value: '5', label: '5 - Very Low' },
              ]}
            />
          </Group>
          
          <Group grow>
            <TextInput
              label="Responsible Person"
              placeholder="Who is responsible for this control measure?"
              value={customRiskForm.responsible_person}
              onChange={(e) => setCustomRiskForm({ ...customRiskForm, responsible_person: e.target.value })}
              mb="md"
              required
            />
            <TextInput
              label="Control Timing"
              placeholder="When should this control be implemented?"
              value={customRiskForm.control_timing}
              onChange={(e) => setCustomRiskForm({ ...customRiskForm, control_timing: e.target.value })}
              mb="md"
              required
            />
          </Group>
          
          <Textarea
            label="Risk/Benefit Analysis"
            placeholder="Describe the risk vs benefit analysis..."
            value={customRiskForm.risk_benefit}
            onChange={(e) => setCustomRiskForm({ ...customRiskForm, risk_benefit: e.target.value })}
            mb="md"
            minRows={2}
            autosize
          />
          
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setCustomRiskModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCustomRisk}>
              {editingCustomRisk ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Box>
      </Modal>

      <Footer />
    </>
  )
}
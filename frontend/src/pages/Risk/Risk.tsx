import { useEffect, useState } from "react";
import { Box, Container, Center, Text, Loader, Card, Checkbox, Group, Stack, Grid, Button, Table, Badge, ActionIcon, Modal, Textarea, TextInput, Select } from '@mantine/core';
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { defaults, useFormStore } from "../../stores/formStore";
import { ActivityDetails } from "./Components/ActivityDetails";
import useFetch from "../../hooks/useFetch";
import { PageHeader } from "./Components/PageHeader";
import { SvgRenderer } from "../../components/SvgRenderer";
import { IconTornado, IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { Classification } from "./Settings";
import { DatePicker, DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';

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

  // Additional fields local state
  const [additionalFields, setAdditionalFields] = useState({
    reasonForActivity: '',
    proposedActivities: '',
    anticipatedStudents: '',
    anticipatedAdults: '',
    leader: '',
    leaderContact: '',
    secondInCharge: '',
    secondInChargeContact: '',
    locationContactPerson: '',
    locationContactNumber: '',
    siteVisitReviewer: '',
    siteVisitDate: dayjs().unix().toString(),
    waterHazardsPresent: '',
    staffQualifications: [] as string[],
    otherQualifications: ''
  })

  document.title = 'Risk Assessment'

  useEffect(() => {
    if (activityid) {
      getActivity()
    }
  }, [activityid]);

  useEffect(() => {
    if (id) {
      // TODO: Load existing generation?
      //getRiskAssessment()
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

    const [
      activityRes, 
      lastGenRes, 
    ] = await Promise.all([
      api.call({ query: { methodname: 'local_activities-get_activity', id: activityid } }),
      api.call({ query: { methodname: 'local_activities-get_last_ra_gen', activityid: activityid } }),
    ]);
  
    if (activityRes && !activityRes.error) {
      document.title = activityRes.data.activityname + " - Risk Assessment";
      const data = {
        ...activityRes.data,
        timestart: Number(activityRes.data.timestart) ? activityRes.data.timestart : dayjs().unix(),
        timeend: Number(activityRes.data.timeend) ? activityRes.data.timeend : dayjs().unix(),
      }
      setFormData({...defaults, ...data})
    }



    if (lastGenRes && !lastGenRes.error) {

      setAdditionalFields(
        {
          reasonForActivity: lastGenRes.data.reason_for_activity,
          proposedActivities: lastGenRes.data.proposed_activities,
          anticipatedStudents: lastGenRes.data.anticipated_students,
          anticipatedAdults: lastGenRes.data.anticipated_adults,
          leader: lastGenRes.data.leader,
          leaderContact: lastGenRes.data.leader_contact,
          secondInCharge: lastGenRes.data.second_in_charge,
          secondInChargeContact: lastGenRes.data.second_in_charge_contact,
          locationContactPerson: lastGenRes.data.location_contact_person,
          locationContactNumber: lastGenRes.data.location_contact_number,
          siteVisitReviewer: lastGenRes.data.site_visit_reviewer,
          siteVisitDate: Number(lastGenRes.data.site_visit_date) > 0 ? lastGenRes.data.site_visit_date : dayjs().unix().toString(),
          waterHazardsPresent: lastGenRes.data.water_hazards_present,
          staffQualifications: lastGenRes.data.staff_qualifications ? JSON.parse(lastGenRes.data.staff_qualifications) : [],
          otherQualifications: lastGenRes.data.other_qualifications,
        }
      )
      setCustomRisks(lastGenRes.data.custom_risks)
    }


    setLoading(false)
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
          // Additional fields
          reasonForActivity: additionalFields.reasonForActivity,
          proposedActivities: additionalFields.proposedActivities,
          anticipatedStudents: additionalFields.anticipatedStudents,
          anticipatedAdults: additionalFields.anticipatedAdults,
          leader: additionalFields.leader,
          leaderContact: additionalFields.leaderContact,
          secondInCharge: additionalFields.secondInCharge,
          secondInChargeContact: additionalFields.secondInChargeContact,
          locationContactPerson: additionalFields.locationContactPerson,
          locationContactNumber: additionalFields.locationContactNumber,
          siteVisitReviewer: additionalFields.siteVisitReviewer,
          siteVisitDate: Number(additionalFields.siteVisitDate),
          waterHazardsPresent: additionalFields.waterHazardsPresent,
          staffQualifications: JSON.stringify(additionalFields.staffQualifications),
          otherQualifications: additionalFields.otherQualifications,
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

                {/* Additional fields */}
                <Box className="flex flex-col gap-4">
                  <Card withBorder className="space-y-4">
                    <Text fz="md" fw={500}>Additional Information</Text>
                    
                    <Textarea
                      label="Reason for undertaking the activity"
                      placeholder="Describe the reason for undertaking this activity..."
                      value={additionalFields.reasonForActivity || ''}
                      onChange={(e) => setAdditionalFields({ ...additionalFields, reasonForActivity: e.target.value })}
                      autosize
                      minRows={3}
                    />

                    <Textarea
                      label="Proposed activities"
                      placeholder="Describe the proposed activities..."
                      value={additionalFields.proposedActivities || ''}
                      onChange={(e) => setAdditionalFields({ ...additionalFields, proposedActivities: e.target.value })}
                      autosize
                      minRows={3}
                    />

                    <Group grow>
                      <TextInput
                        label="Anticipated number of students attending"
                        type="number"
                        min={0}
                        placeholder="0"
                        value={additionalFields.anticipatedStudents || ''}
                        onChange={(e) => setAdditionalFields({ ...additionalFields, anticipatedStudents: e.target.value })}
                      />
                      <TextInput
                        label="Anticipated number of responsible adults (staff and volunteers) attending"
                        type="number"
                        min={0}
                        placeholder="0"
                        value={additionalFields.anticipatedAdults || ''}
                        onChange={(e) => setAdditionalFields({ ...additionalFields, anticipatedAdults: e.target.value })}
                      />
                    </Group>

                    <Group grow>
                      <TextInput
                        label="Leader"
                        placeholder="Leader name"
                        value={additionalFields.leader || ''}
                        onChange={(e) => setAdditionalFields({ ...additionalFields, leader: e.target.value })}
                      />
                      <TextInput
                        label="Leader contact number"
                        placeholder="Leader contact number"
                        value={additionalFields.leaderContact || ''}
                        onChange={(e) => setAdditionalFields({ ...additionalFields, leaderContact: e.target.value })}
                      />
                    </Group>

                    <Group grow>
                      <TextInput
                        label="Second in Charge (if leader unable to attend)"
                        placeholder="Second in charge name"
                        value={additionalFields.secondInCharge || ''}
                        onChange={(e) => setAdditionalFields({ ...additionalFields, secondInCharge: e.target.value })}
                      />
                      <TextInput
                        label="Second in Charge contact number"
                        placeholder="Second in charge contact number"
                        value={additionalFields.secondInChargeContact || ''}
                        onChange={(e) => setAdditionalFields({ ...additionalFields, secondInChargeContact: e.target.value })}
                      />
                    </Group>

                    <Group grow>
                      <TextInput
                        label="Contact person at the location of activity"
                        placeholder="Contact person name"
                        value={additionalFields.locationContactPerson || ''}
                        onChange={(e) => setAdditionalFields({ ...additionalFields, locationContactPerson: e.target.value })}
                      />
                      <TextInput
                        label="Contact number at location of activity"
                        placeholder="Location contact number"
                        value={additionalFields.locationContactNumber || ''}
                        onChange={(e) => setAdditionalFields({ ...additionalFields, locationContactNumber: e.target.value })}
                      />
                    </Group>

                    <Group grow>
                      <TextInput
                        label="Site visit completed / reviewed by"
                        placeholder="Site visit reviewer name"
                        value={additionalFields.siteVisitReviewer || ''}
                        onChange={(e) => setAdditionalFields({ ...additionalFields, siteVisitReviewer: e.target.value })}
                      />

                      <DatePickerInput
                        value={dayjs.unix(Number(additionalFields.siteVisitDate)).toDate()} // Convert to Date
                        dropdownType="popover"
                        label="Site visit completed / reviewed date"
                        onChange={(newValue) => {
                          setAdditionalFields({ ...additionalFields, siteVisitDate: dayjs(newValue).unix().toString() })
                        }}
                      />

                    </Group>

                    <Select
                      label="Are there any water hazards present?"
                      placeholder="Select an option"
                      value={additionalFields.waterHazardsPresent || ''}
                      onChange={(value) => setAdditionalFields({ ...additionalFields, waterHazardsPresent: value || '' })}
                      data={[
                        { value: 'Yes', label: 'Yes' },
                        { value: 'No', label: 'No' },
                      ]}
                    />

                    <div>
                      <Text fz="sm" fw={500} mb="xs">Supervising staff relevant qualifications (select all that apply)</Text>
                      <Checkbox.Group
                        value={additionalFields.staffQualifications || []}
                        onChange={(value) => setAdditionalFields({ ...additionalFields, staffQualifications: value })}
                      >
                        <Group gap="md">
                          <Checkbox value="First Aid" label="First Aid" />
                          <Checkbox value="CPR" label="CPR" />
                          <Checkbox value="Bronze Medallion" label="Bronze Medallion" />
                          <Checkbox value="Other" label="Other" />
                        </Group>
                      </Checkbox.Group>
                      {additionalFields.staffQualifications?.includes('Other') && (
                        <TextInput
                          label="Other qualifications"
                          placeholder="Specify other qualifications..."
                          value={additionalFields.otherQualifications || ''}
                          onChange={(e) => setAdditionalFields({ ...additionalFields, otherQualifications: e.target.value })}
                          mt="xs"
                        />
                      )}
                    </div>
                  </Card>
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
import { useEffect, useState, useMemo } from "react";
import { 
  Box, 
  Container, 
  Text, 
  Loader, 
  Card, 
  Button, 
  Group, 
  TextInput, 
  Textarea, 
  Checkbox,
  ActionIcon,
  Table,
  Modal,
  Badge,
  Flex,
  CloseButton,
  Combobox,
  useCombobox,
  Pill,
  PillsInput,
  Tooltip,
  Grid
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconTag, IconAlertSquare, IconX, IconCheck, IconGripVertical } from '@tabler/icons-react';
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import useFetch from "../../hooks/useFetch";

interface Classification {
  id: number;
  name: string;
  sortorder: number;
}

interface Risk {
  id: number;
  hazard: string;
  riskrating_before: number;
  controlmeasures: string;
  riskrating_after: number;
  responsible_person: string;
  control_timing: string;
  risk_benefit: string;
  isstandard: number;
  classification_ids: number[];
}

export function Settings() {
  const api = useFetch();
  const [loading, setLoading] = useState(true);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  
  // Classification modal state
  const [classificationModalOpen, setClassificationModalOpen] = useState(false);
  const [editingClassification, setEditingClassification] = useState<Classification | null>(null);
  const [classificationForm, setClassificationForm] = useState({ name: '' });
  const [classificationError, setClassificationError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  
  // Risk filter state
  const [riskFilterSearch, setRiskFilterSearch] = useState('');
  const [riskFilterSearchResults, setRiskFilterSearchResults] = useState<Classification[]>([]);
  const [selectedRiskFilters, setSelectedRiskFilters] = useState<Classification[]>([]);
  const riskFilterCombobox = useCombobox({
    onDropdownClose: () => riskFilterCombobox.resetSelectedOption(),
    onDropdownOpen: () => riskFilterCombobox.updateSelectedOptionIndex('active'),
  });
  
  // Risk modal state
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [riskForm, setRiskForm] = useState({ 
    hazard: '', 
    riskrating_before: 1,
    controlmeasures: '',
    riskrating_after: 1,
    responsible_person: '',
    control_timing: '',
    risk_benefit: '',
    isstandard: 0,
    classification_ids: [] as number[]
  });
  
  // Classification selector state
  const [classificationSearch, setClassificationSearch] = useState('');
  const [classificationSearchResults, setClassificationSearchResults] = useState<Classification[]>([]);
  const [selectedClassifications, setSelectedClassifications] = useState<Classification[]>([]);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  document.title = 'Risk Settings';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classificationsRes, risksRes] = await Promise.all([
        api.call({ query: { methodname: 'local_activities-get_classifications' } }),
        api.call({ query: { methodname: 'local_activities-get_risks' } })
      ]);
      
      if (!classificationsRes.error) {
        setClassifications(classificationsRes.data);
      }
      
      if (!risksRes.error) {
        setRisks(risksRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Classification functions
  const openClassificationModal = (classification?: Classification) => {
    if (classification) {
      setEditingClassification(classification);
      setClassificationForm({ name: classification.name });
    } else {
      setEditingClassification(null);
      setClassificationForm({ name: '' });
    }
    setClassificationError(null);
    setClassificationModalOpen(true);
  };

  const saveClassification = async () => {
    try {
      setClassificationError(null);
      
      const data = {
        ...classificationForm,
        id: editingClassification?.id
      };
      
      const response = await api.call({
        method: 'POST',
        body: {
          methodname: 'local_activities-save_classification',
          args: data
        }
      });
      
      if (!response.error) {
        setClassificationModalOpen(false);
        loadData();
      } else {
        // Handle error from API
        setClassificationError(response.exception?.message || 'An error occurred while saving the classification.');
      }
    } catch (error: any) {
      console.error('Error saving classification:', error);
      setClassificationError(error?.message || 'An error occurred while saving the classification.');
    }
  };

  const deleteClassification = async (id: number) => {
    if (!confirm('Are you sure you want to delete this classification?')) return;
    
    try {
      setDeleteError(null);
      const response = await api.call({
        method: 'POST',
        body: {
          methodname: 'local_activities-delete_classification',
          args: { id }
        }
      });
      
      if (!response.error) {
        loadData();
      } else {
        // Handle error from API
        setDeleteError(response.exception?.message || 'An error occurred while deleting the classification.');
      }
    } catch (error: any) {
      console.error('Error deleting classification:', error);
      setDeleteError(error?.message || 'An error occurred while deleting the classification.');
    }
  };

  // Risk functions
  const openRiskModal = (risk?: Risk) => {
    if (risk) {
      setEditingRisk(risk);
      setRiskForm({ 
        hazard: risk.hazard, 
        riskrating_before: risk.riskrating_before,
        controlmeasures: risk.controlmeasures,
        riskrating_after: risk.riskrating_after,
        responsible_person: risk.responsible_person,
        control_timing: risk.control_timing,
        risk_benefit: risk.risk_benefit,
        isstandard: risk.isstandard,
        classification_ids: risk.classification_ids
      });
      
      // Load selected classifications
      const selected = classifications.filter(c => risk.classification_ids.includes(c.id));
      setSelectedClassifications(selected);
    } else {
      setEditingRisk(null);
      setRiskForm({ 
        hazard: '', 
        riskrating_before: 1,
        controlmeasures: '',
        riskrating_after: 1,
        responsible_person: '',
        control_timing: '',
        risk_benefit: '',
        isstandard: 0,
        classification_ids: []
      });
      setSelectedClassifications([]);
    }
    setRiskModalOpen(true);
  };

  const saveRisk = async () => {
    try {
      const data = {
        ...riskForm,
        id: editingRisk?.id,
        classification_ids: selectedClassifications.map(c => c.id)
      };
      
      const response = await api.call({
        method: 'POST',
        body: {
          methodname: 'local_activities-save_risk',
          args: data
        }
      });
      
      if (!response.error) {
        setRiskModalOpen(false);
        loadData();
      }
    } catch (error) {
      console.error('Error saving risk:', error);
    }
  };

  const deleteRisk = async (id: number) => {
    if (!confirm('Are you sure you want to delete this risk?')) return;
    
    try {
      const response = await api.call({
        method: 'POST',
        body: {
          methodname: 'local_activities-delete_risk',
          args: { id }
        }
      });
      
      if (!response.error) {
        loadData();
      } else {
        // Handle error from API
        console.error('Error deleting risk:', response.exception?.message);
      }
    } catch (error: any) {
      console.error('Error deleting risk:', error);
    }
  };

  // Classification search functions
  const searchClassifications = async (query: string) => {
    setClassificationSearch(query);
    if (!query.length) {
      setClassificationSearchResults([]);
      return;
    }
    
    try {
      const response = await api.call({
        query: {
          methodname: 'local_activities-search_classifications',
          query: query
        }
      });
      
      if (!response.error) {
        setClassificationSearchResults(response.data);
      }
    } catch (error) {
      console.error('Error searching classifications:', error);
    }
  };

  const handleClassificationSelect = (classification: Classification) => {
    if (!selectedClassifications.find(c => c.id === classification.id)) {
      setSelectedClassifications([...selectedClassifications, classification]);
    }
    setClassificationSearch('');
    setClassificationSearchResults([]);
  };

  const handleClassificationRemove = (classification: Classification) => {
    setSelectedClassifications(selectedClassifications.filter(c => c.id !== classification.id));
  };

  // Risk filter functions
  const searchRiskFilters = async (query: string) => {
    setRiskFilterSearch(query);
    if (!query.length) {
      setRiskFilterSearchResults([]);
      return;
    }
    
    try {
      const response = await api.call({
        query: {
          methodname: 'local_activities-search_classifications',
          query: query
        }
      });
      
      if (!response.error) {
        setRiskFilterSearchResults(response.data);
      }
    } catch (error) {
      console.error('Error searching classifications for filter:', error);
    }
  };

  const handleRiskFilterSelect = (classification: Classification) => {
    if (!selectedRiskFilters.find(c => c.id === classification.id)) {
      setSelectedRiskFilters([...selectedRiskFilters, classification]);
    }
    setRiskFilterSearch('');
    setRiskFilterSearchResults([]);
    riskFilterCombobox.resetSelectedOption();
  };

  const handleRiskFilterRemove = (classification: Classification) => {
    setSelectedRiskFilters(selectedRiskFilters.filter(c => c.id !== classification.id));
  };

  // Filter risks based on selected classifications
  const filteredRisks = useMemo(() => {
    if (selectedRiskFilters.length === 0) {
      return risks;
    }
    
    return risks.filter(risk => {
      return selectedRiskFilters.some(filter => 
        risk.classification_ids.includes(filter.id)
      );
    });
  }, [risks, selectedRiskFilters]);

  // Drag and drop functions
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = classifications.findIndex(c => c.id === draggedItem);
    const targetIndex = classifications.findIndex(c => c.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    // Create new array with reordered items
    const newClassifications = [...classifications];
    const [draggedClassification] = newClassifications.splice(draggedIndex, 1);
    newClassifications.splice(targetIndex, 0, draggedClassification);
    
    // Update sortorder values
    const updatedClassifications = newClassifications.map((classification, index) => ({
      ...classification,
      sortorder: index + 1
    }));
    
    setClassifications(updatedClassifications);
    setDraggedItem(null);

    // Save the new order to the backend
    try {
      const sortorder = updatedClassifications.map(c => c.id);
      const response = await api.call({
        method: 'POST',
        body: {
          methodname: 'local_activities-update_classification_sort',
          args: { sortorder }
        }
      });
      
      if (response.error) {
        console.error('Error updating sort order:', response.exception?.message);
        // Reload data to revert changes
        loadData();
      }
    } catch (error) {
      console.error('Error updating sort order:', error);
      // Reload data to revert changes
      loadData();
    }
  };



  return (
    <>
      <Header />
      <div className="page-wrapper" style={{ minHeight: 'calc(100vh - 154px)' }}>
        <Container fluid my="md" className="space-y-6">
          <Text fz="xl" fw={600}>Risk Settings</Text>

          {loading && (
            <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Loader type="dots" />
            </Box>
          )}


          
              {/* Risks Section */}
              <Card withBorder>
                <Group justify="space-between" mb="md">
                  <Text fz="lg" fw={500}>Risks</Text>
                  <Button 
                    leftSection={<IconPlus size={16} />}
                    onClick={() => openRiskModal()}
                    radius="xl"
                    size="compact-md"
                  >
                    Add Risk
                  </Button>
                </Group>
                
                {/* Risk Filter */}
                <div className="flex justify-end items-center mb-4">
                  <Box mb="md" className="w-1/2">
                    <Combobox 
                      store={riskFilterCombobox} 
                      onOptionSubmit={(optionValue: string) => {
                        const classification = JSON.parse(optionValue);
                        handleRiskFilterSelect(classification);
                      }}
                      withinPortal={false}
                    >
                    <Combobox.DropdownTarget>
                      <PillsInput 
                        pointer 
                        leftSection={<IconTag size={18} />}
                      >
                        <Pill.Group>
                          {selectedRiskFilters.map((classification) => (
                            <Badge key={classification.id} variant='filled' pr={0} color="gray.2" size="lg" radius="xl">
                              <Flex gap={4}>
                                <Text className="normal-case font-normal text-black text-sm">{classification.name}</Text>
                                <CloseButton
                                  onMouseDown={() => handleRiskFilterRemove(classification)}
                                  variant="transparent"
                                  size={22}
                                  iconSize={14}
                                  tabIndex={-1}
                                  color="black"
                                />
                              </Flex>
                            </Badge>
                          ))}
                          <Combobox.EventsTarget>
                            <PillsInput.Field
                              onFocus={() => riskFilterCombobox.openDropdown()}
                              onClick={() => riskFilterCombobox.openDropdown()}
                              onBlur={() => riskFilterCombobox.closeDropdown()}
                              value={riskFilterSearch}
                              placeholder="Search classifications to filter..."
                              onChange={(event) => {
                                searchRiskFilters(event.currentTarget.value);
                                if (event.currentTarget.value.length > 0) {
                                  riskFilterCombobox.openDropdown();
                                }
                              }}
                            />
                          </Combobox.EventsTarget>
                        </Pill.Group>
                      </PillsInput>
                    </Combobox.DropdownTarget>

                    <Combobox.Dropdown hidden={!riskFilterSearchResults.length}>
                      <Combobox.Options>
                        {riskFilterSearchResults.length > 0 
                          ? riskFilterSearchResults.map((classification) => (
                              <Combobox.Option value={JSON.stringify(classification)} key={classification.id}>
                                <Text>{classification.name}</Text>
                              </Combobox.Option>
                            ))
                          : <Combobox.Empty>Nothing found...</Combobox.Empty>
                        }
                      </Combobox.Options>
                    </Combobox.Dropdown>
                  </Combobox>
                  
                  {selectedRiskFilters.length > 0 && (
                    <Text fz="xs" c="dimmed" mt="xs">
                      Showing {filteredRisks.length} of {risks.length} risks
                    </Text>
                  )}
                </Box>
                </div>
                
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
                      <Table.Th>Classifications</Table.Th>
                      <Table.Th style={{ width: '90px' }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredRisks.map((risk) => (
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
                          <Group gap="xs">
                            {risk.classification_ids.map((classificationId) => {
                              const classification = classifications.find(c => c.id === classificationId);
                              return classification ? (
                                <Badge key={classificationId} variant="light" size="sm">
                                  {classification.name}
                                </Badge>
                              ) : null;
                            })}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon 
                              variant="subtle" 
                              color="blue"
                              onClick={() => openRiskModal(risk)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon 
                              variant="subtle" 
                              color="red"
                              onClick={() => deleteRisk(risk.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>









              {/* Classifications Section */}
              <Card withBorder className="max-w-screen-md mx-auto">
                <Group justify="space-between" mb="md">
                  <Text fz="lg" fw={500}>Risk Classifications</Text>
                  <Button 
                    leftSection={<IconPlus size={16} />}
                    onClick={() => openClassificationModal()}
                    radius="xl"
                    size="compact-md"
                  >
                    Add Classification
                  </Button>
                </Group>
                
                {deleteError && (
                  <Text c="red" size="sm" mb="md">
                    {deleteError}
                  </Text>
                )}
                
                <Table
                  style={{ width: 'auto', tableLayout: 'auto' }}
                  highlightOnHover
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: '40px' }}></Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th style={{ width: '90px' }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {classifications.map((classification) => (
                      <Table.Tr 
                        key={classification.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, classification.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, classification.id)}
                        style={{ 
                          cursor: 'grab',
                          opacity: draggedItem === classification.id ? 0.5 : 1,
                          backgroundColor: draggedItem === classification.id ? '#f8f9fa' : 'transparent'
                        }}
                      >
                        <Table.Td>
                          <IconGripVertical size={16} color="#6c757d" style={{ cursor: 'grab' }} />
                        </Table.Td>
                        <Table.Td>{classification.name}</Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon 
                              variant="subtle" 
                              color="blue"
                              onClick={() => openClassificationModal(classification)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon 
                              variant="subtle" 
                              color="red"
                              onClick={() => deleteClassification(classification.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
              



        </Container>
      </div>

      {/* Classification Modal */}
      <Modal 
        opened={classificationModalOpen} 
        onClose={() => setClassificationModalOpen(false)}
        title={editingClassification ? 'Edit Classification' : 'Add Classification'}
        size="md"
      >
        <Box>
          {classificationError && (
            <Text c="red" size="sm" mb="md">
              {classificationError}
            </Text>
          )}
          <TextInput
            label="Name"
            placeholder="e.g., 0-4 students"
            value={classificationForm.name}
            onChange={(e) => setClassificationForm({ ...classificationForm, name: e.target.value })}
            mb="md"
            required
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setClassificationModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveClassification}>
              {editingClassification ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Risk Modal */}
      <Modal 
        opened={riskModalOpen} 
        onClose={() => setRiskModalOpen(false)}
        title={editingRisk ? 'Edit Risk' : 'Add Risk'}
        size="lg"
      >
        <Box>
          <Textarea
            label="Hazard"
            placeholder="Describe the hazard..."
            value={riskForm.hazard}
            onChange={(e) => setRiskForm({ ...riskForm, hazard: e.target.value })}
            mb="md"
            required
            minRows={3}
          />
          
          <Group grow>
            <TextInput
              label="Risk Rating (Before)"
              type="number"
              min={1}
              max={10}
              value={riskForm.riskrating_before}
              onChange={(e) => setRiskForm({ ...riskForm, riskrating_before: parseInt(e.target.value) || 1 })}
              mb="md"
              required
            />
            <TextInput
              label="Risk Rating (After)"
              type="number"
              min={1}
              max={10}
              value={riskForm.riskrating_after}
              onChange={(e) => setRiskForm({ ...riskForm, riskrating_after: parseInt(e.target.value) || 1 })}
              mb="md"
              required
            />
          </Group>
          
          <Textarea
            label="Control Measures"
            placeholder="Describe the control measures..."
            value={riskForm.controlmeasures}
            onChange={(e) => setRiskForm({ ...riskForm, controlmeasures: e.target.value })}
            mb="md"
            required
            minRows={3}
          />
          
          <Group grow>
            <TextInput
              label="Responsible Person"
              placeholder="Who is responsible for this control measure?"
              value={riskForm.responsible_person}
              onChange={(e) => setRiskForm({ ...riskForm, responsible_person: e.target.value })}
              mb="md"
              required
            />
            <TextInput
              label="Control Timing"
              placeholder="When should this control be implemented?"
              value={riskForm.control_timing}
              onChange={(e) => setRiskForm({ ...riskForm, control_timing: e.target.value })}
              mb="md"
              required
            />
          </Group>
          
          <Textarea
            label="Risk/Benefit Analysis"
            placeholder="Describe the risk vs benefit analysis..."
            value={riskForm.risk_benefit}
            onChange={(e) => setRiskForm({ ...riskForm, risk_benefit: e.target.value })}
            mb="md"
            minRows={2}
          />
          
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Text fz="sm" fw={500}>Classifications</Text>
              <Tooltip label="Tag this risk with relevant classifications" multiline withArrow>
                <div className="flex items-center gap-1 text-blue-600">
                  <IconAlertSquare className="size-4" />
                  <Text size="xs">Help</Text>
                </div>
              </Tooltip>
            </div>
            
            <Combobox 
              store={combobox} 
              onOptionSubmit={(optionValue: string) => {
                const classification = JSON.parse(optionValue);
                handleClassificationSelect(classification);
                combobox.closeDropdown();
              }}
              withinPortal={false}
            >
              <Combobox.DropdownTarget>
                <PillsInput 
                  pointer 
                  leftSection={<IconTag size={18} />}
                >
                  <Pill.Group>
                    {selectedClassifications.map((classification) => (
                      <Badge key={classification.id} variant='filled' pr={0} color="gray.2" size="lg" radius="xl">
                        <Flex gap={4}>
                          <Text className="normal-case font-normal text-black text-sm">{classification.name}</Text>
                          <CloseButton
                            onMouseDown={() => handleClassificationRemove(classification)}
                            variant="transparent"
                            size={22}
                            iconSize={14}
                            tabIndex={-1}
                          />
                        </Flex>
                      </Badge>
                    ))}
                    <Combobox.EventsTarget>
                      <PillsInput.Field
                        onFocus={() => combobox.openDropdown()}
                        onClick={() => combobox.openDropdown()}
                        onBlur={() => combobox.closeDropdown()}
                        value={classificationSearch}
                        placeholder="Search classifications"
                        onChange={(event) => {
                          searchClassifications(event.currentTarget.value);
                        }}
                      />
                    </Combobox.EventsTarget>
                  </Pill.Group>
                </PillsInput>
              </Combobox.DropdownTarget>

              <Combobox.Dropdown hidden={!classificationSearchResults.length}>
                <Combobox.Options>
                  {classificationSearchResults.length > 0 
                    ? classificationSearchResults.map((classification) => (
                        <Combobox.Option value={JSON.stringify(classification)} key={classification.id}>
                          <Text>{classification.name}</Text>
                        </Combobox.Option>
                      ))
                    : <Combobox.Empty>Nothing found...</Combobox.Empty>
                  }
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </div>

          <Checkbox
            label="Standard Risk"
            checked={riskForm.isstandard === 1}
            onChange={(e) => setRiskForm({ ...riskForm, isstandard: e.currentTarget.checked ? 1 : 0 })}
            mb="lg"
          />
          
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setRiskModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRisk}>
              {editingRisk ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Box>
      </Modal>

      <Footer />
    </>
  );
}

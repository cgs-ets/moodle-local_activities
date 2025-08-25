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
  Alert,
  Tabs,
  Space,
  Select,
  Stack,
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconAlertSquare, IconX, IconCheck, IconGripVertical, IconEye, IconEyeOff, IconGitBranch, IconAlertCircle, IconFirstAidKit, IconCategory2, IconSettings, IconCat, IconGitCommit, IconCheckbox, IconGitFork, IconPictureInPicture, IconPhotoCircle, IconPhoto } from '@tabler/icons-react';
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import useFetch from "../../hooks/useFetch";
import { SvgRenderer } from "../../components/SvgRenderer";
import { useSearchParams, useNavigate } from "react-router-dom";

export interface Classification {
  id: number;
  name: string;
  sortorder: number;
  icon: string;
  description: string;
  type: string;
  isstandard: number;
  contexts: number[];
  preselected: boolean;
  hidden: boolean;
}

export interface Risk {
  id: number;
  hazard: string;
  riskrating_before: number;
  controlmeasures: string;
  riskrating_after: number;
  responsible_person: string;
  control_timing: string;
  risk_benefit: string;
  isstandard: number;
  classification_sets: number[][]; // Array of classification sets, each set is an array of classification IDs
  version: number;
}

export interface Version {
  id: number;
  version: number;
  is_published: number;
  published_by: string;
  timepublished: number;
  timecreated: number;
  description: string;
  risk_count?: number;
  classification_count?: number;
  has_been_used?: number;
}

export function Settings() {
  const api = useFetch();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
  
  // Classification modal state
  const [classificationModalOpen, setClassificationModalOpen] = useState(false);
  const [editingClassification, setEditingClassification] = useState<Classification | null>(null);
  const [editingClassificationIcon, setEditingClassificationIcon] = useState<Classification | null>(null);
  const [classificationForm, setClassificationForm] = useState({ 
    name: '', 
    icon: '', 
    description: '', 
    type: 'hazards', 
    isstandard: 0, 
    contexts: [] as number[]
  });
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
    classification_sets: [] as number[][] // Start with no classification sets
  });
  
  // Classification selector state
  const [classificationSearch, setClassificationSearch] = useState('');
  const [classificationSearchResults, setClassificationSearchResults] = useState<Classification[]>([]);
  const [selectedClassifications, setSelectedClassifications] = useState<Classification[]>([]);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });
  const [selectedContexts, setSelectedContexts] = useState<Classification[]>([]);
  
  // Single combobox for adding new classification sets
  const addSetCombobox = useCombobox({
    onDropdownClose: () => addSetCombobox.resetSelectedOption(),
    onDropdownOpen: () => addSetCombobox.updateSelectedOptionIndex('active'),
  });
  
  // State for the current classification set being built
  const [currentSetClassifications, setCurrentSetClassifications] = useState<Classification[]>([]);
  
  // State for the search input in the classification set combobox
  const [classificationSetSearchInput, setClassificationSetSearchInput] = useState('');

  const [tab, setTab] = useState('risks');

  document.title = 'Risk Settings';

  // Get version from URL parameter
  const getVersionFromUrl = () => {
    const versionParam = searchParams.get('v');
    return versionParam ? parseInt(versionParam, 10) : null;
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  // Initialize search results when classifications are loaded
  useEffect(() => {
    setClassificationSearchResults(classifications);
    setRiskFilterSearchResults(classifications);
  }, [classifications]);

  const loadData = async () => {
    setLoading(true);

    const version = getVersionFromUrl();

    if (!version) {
      loadVersions();
      return;
    }

    try {      
      const [
        classificationsRes, 
        risksRes, 
        versionsRes, 
      ] = await Promise.all([
        api.call({ query: { methodname: 'local_activities-get_classifications', version: version } }),
        api.call({ query: { methodname: 'local_activities-get_risks', version: version } }),
        api.call({ query: { methodname: 'local_activities-get_versions' } }),
      ]);
      
      if (!classificationsRes.error) {
        setClassifications(classificationsRes.data);
      }
      
      if (!risksRes.error) {
        setRisks(risksRes.data);
      }
      
      if (!versionsRes.error) {
        setVersions(versionsRes.data);
      }

      setCurrentVersion(versionsRes.data.find((v: Version) => v.version === version));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    setLoading(true);

    try {      
      const [
        versionsRes, 
      ] = await Promise.all([
        api.call({ query: { methodname: 'local_activities-get_versions' } }),
      ]);
      
      if (!versionsRes.error) {
        setVersions(versionsRes.data);
        setTab('versions');
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Classification functions
  const openClassificationModal = (classification?: Classification) => {
    setEditingClassification(null);
    setEditingClassificationIcon(null);
    setClassificationForm({ 
      name: '', 
      description: '', 
      icon: '', 
      type: 'hazards', 
      isstandard: 0, 
      contexts: []
    });
    if (classification) {
      setEditingClassification(classification);
      setClassificationForm({ 
        name: classification.name, 
        description: classification.description, 
        type: classification.type, 
        isstandard: classification.isstandard, 
        contexts: classification.contexts || []
      } as Classification);
      // Load selected classifications
      const selected = classifications.filter(c => classification.contexts.includes(c.id));
      setSelectedContexts(selected);
    }
    setClassificationError(null);
    setClassificationModalOpen(true);
  };

  const openClassificationIconModal = (classification: Classification) => {
    setEditingClassification(null);
    setEditingClassificationIcon(classification);
    setClassificationForm({icon: classification.icon } as Classification);
    setClassificationError(null);
    setClassificationModalOpen(true);
  };

  const saveClassification = async () => {
    try {
      setClassificationError(null);
      
      const data = {
        ...classificationForm,
        id: editingClassificationIcon !== null ? editingClassificationIcon.id : editingClassification?.id,
        version: currentVersion?.version,
        editingIcon: editingClassificationIcon !== null,
        contexts: selectedContexts.map(c => c.id)
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
          args: { id, version: currentVersion?.version }
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
          classification_sets: risk.classification_sets
        });
        
        // Load selected classifications from the first set (for backward compatibility in the UI)
        const selected = classifications.filter(c => risk.classification_sets[0]?.includes(c.id) || false);
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
          classification_sets: []
        });
        setSelectedClassifications([]);
    }
    
    // Reset current set classifications
    setCurrentSetClassifications([]);
    // Reset search input
    setClassificationSetSearchInput('');
    
    setRiskModalOpen(true);
  };

  const saveRisk = async () => {
    try {
      // Filter out empty sets
      const validClassificationSets = riskForm.classification_sets.filter(set => set.length > 0);
      
      const data = {
        ...riskForm,
        id: editingRisk?.id,
        classification_sets: validClassificationSets,
        version: currentVersion?.version
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
          args: { id, version: currentVersion?.version }
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
  const searchClassifications = (query: string) => {
    setClassificationSearch(query);
    if (!query.length) {
      setClassificationSearchResults(classifications);
      return;
    }
    
    // Filter classifications locally based on query
    const filtered = classifications.filter(classification =>
      classification.name.toLowerCase().includes(query.toLowerCase())
    );
    setClassificationSearchResults(filtered);
  };

  const handleClassificationSelect = (classification: Classification) => {
    // This function is now only used for the old single classification system
    // The new classification sets system handles selection differently
    if (!selectedClassifications.find(c => c.id === classification.id)) {
      setSelectedClassifications([...selectedClassifications, classification]);
    }
    setClassificationSearch('');
    setClassificationSearchResults([]);
  };

  const handleClassificationRemove = (classification: Classification) => {
    setSelectedClassifications(selectedClassifications.filter(c => c.id !== classification.id));
  };

  const handleContextSelect = (context: Classification) => {
    if (!selectedContexts.find(c => c.id === context.id)) {
      setSelectedContexts([...selectedContexts, context]);
    }
  };

  const handleContextRemove = (context: Classification) => {
    setSelectedContexts(selectedContexts.filter(c => c.id !== context.id));
  };

  // Helper functions for adding classification sets
  const addClassificationToCurrentSet = (classification: Classification) => {
    if (!currentSetClassifications.find(c => c.id === classification.id)) {
      setCurrentSetClassifications([...currentSetClassifications, classification]);
    }
    // Clear search text when selecting a classification
    setClassificationSearchResults(classifications);
    // Clear the search input field
    setClassificationSetSearchInput('');
    // Don't close dropdown immediately - let user select multiple classifications
  };

  const removeClassificationFromCurrentSet = (classification: Classification) => {
    setCurrentSetClassifications(currentSetClassifications.filter(c => c.id !== classification.id));
  };

  const addCurrentSetToRisk = () => {
    if (currentSetClassifications.length === 0) {
      return; // Don't add empty sets
    }
    
    const newSet = currentSetClassifications.map(c => c.id);
    setRiskForm({ 
      ...riskForm, 
      classification_sets: [...riskForm.classification_sets, newSet] 
    });
    
    // Clear the current set and close dropdown
    setCurrentSetClassifications([]);
    addSetCombobox.closeDropdown();
  };


  // Risk filter functions
  const searchRiskFilters = (query: string) => {
    setRiskFilterSearch(query);
    if (!query.length) {
      setRiskFilterSearchResults(classifications);
      return;
    }
    
    // Filter classifications locally based on query
    const filtered = classifications.filter(classification =>
      classification.name.toLowerCase().includes(query.toLowerCase())
    );
    setRiskFilterSearchResults(filtered);
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
        risk.classification_sets.some(set => set.includes(filter.id))
      );
    });
  }, [risks, selectedRiskFilters]);

  // Version control functions
  const createDraftVersion = async (version: number) => {
    try {
      const response = await api.call({
        method: 'POST',
        body: {
          methodname: 'local_activities-create_draft_version',
          args: { version }
        }
      });
      
      if (!response.error && response.data.version) {
        setTab('risks');
        navigate(`/risk/settings?v=${response.data.version}`);
      }
    } catch (error) {
      console.error('Error creating draft version:', error);
    }
  };

  const publishVersion = async (version: number) => {
    try {
      const response = await api.call({
        method: 'POST',
        body: {
          methodname: 'local_activities-publish_version',
          args: { version }
        }
      });
      
      if (!response.error && response.data.version) {
        setTab('risks');
        if (currentVersion?.version !== response.data.version) {
          navigate(`/risk/settings?v=${response.data.version}`);
        } else {
          loadData();
        }
      }
    } catch (error) {
      console.error('Error publishing version:', error);
    }
  };

  const deleteVersion = async (version: number) => {
    if (!confirm('Are you sure you want to delete this version?')) return;
    
    try {
      const response = await api.call({
        method: 'POST',
        body: {
          methodname: 'local_activities-delete_version',
          args: { version }
        }
      });
      
      if (!response.error) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting version:', error);
    }
  };

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
          args: { sortorder, version: currentVersion?.version }
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

  const switchToVersion = async (version: number) => {
    setTab('risks');
    navigate(`/risk/settings?v=${version}`);
  };

  return (
    <>
      <Header />
      <div className="page-wrapper" style={{ minHeight: 'calc(100vh - 154px)' }}>
        <Container fluid my="md" className="space-y-6">
          <Group justify="space-between" align="center">
            <Text fz="xl" fw={600}>Risk Settings: Version {getVersionFromUrl()}</Text>

            {loading && (
              <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader size="sm" type="dots" />
              </Box>
            )}
          </Group>


          <Tabs value={tab} onChange={(value) => setTab(value || 'risks')}>
            <Tabs.List>
              <Tabs.Tab value="risks" leftSection={<IconFirstAidKit size={12} />}>
                Risks
              </Tabs.Tab>
              <Tabs.Tab value="classifications" leftSection={<IconCategory2 size={12} />}>
                Classifications
              </Tabs.Tab>
              <Tabs.Tab value="versions" leftSection={<IconGitBranch size={12} />}>
                Versions
              </Tabs.Tab>
            </Tabs.List>

            <Space h="md" />

            <Tabs.Panel value="risks">
              
              { !!currentVersion && (
              <>
                <Group justify="start" mb="md">
                  <div>
                    {currentVersion.version !== 0 && currentVersion.is_published === 0 && (
                      <Alert 
                        color="dark" 
                        title={`Draft version`}
                        icon={<IconAlertCircle size={16} 
                      />}>
                        {currentVersion.has_been_used === 0
                          ? <Text className="mb-3">You're currently editing a draft version. When you're done, you can publish it.</Text>
                          : <Text className="mb-3">This version has been used in an activity. You can't edit it.</Text>
                        }
                        <Group>
                          <Button 
                            leftSection={<IconCheck size={16} />}
                            onClick={() => publishVersion(currentVersion.version)}
                            color="green"
                            size="compact-md"
                            radius="xl"
                          >
                            Publish
                          </Button>
                          {currentVersion.has_been_used === 1 && (
                            <Button 
                              leftSection={<IconGitBranch size={16} />}
                              onClick={() => createDraftVersion(currentVersion.version)}
                              color="blue"
                              size="compact-md"
                              radius="xl"
                            >
                              Create Fork
                            </Button>
                          )}
                        </Group>
                      </Alert>
                    )}

                    {currentVersion.version !== 0 && currentVersion.is_published === 1 && (
                      <Alert color="blue" title="Published version" icon={<IconAlertCircle size={16} />}>
                        <Text className="mb-3">You're currently viewing a published version. Create a forked version to make changes.</Text>
                        <Button 
                          leftSection={<IconGitBranch size={16} />}
                          onClick={() => createDraftVersion(currentVersion.version)}
                          color="blue"
                          size="compact-md"
                          radius="xl"
                        >
                          Create Fork
                        </Button>
                      </Alert>
                    )}
                  </div>
                </Group>


                {/* 
                -------------------
                RISKS
                -------------------
                */}
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
                          leftSection={<IconCategory2 size={18} />}
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
                                onFocus={() => {
                                  setRiskFilterSearchResults(classifications);
                                  riskFilterCombobox.openDropdown();
                                }}
                                onClick={() => {
                                  setRiskFilterSearchResults(classifications);
                                  riskFilterCombobox.openDropdown();
                                }}
                                onBlur={() => riskFilterCombobox.closeDropdown()}
                                value={riskFilterSearch}
                                placeholder="Search classifications to filter..."
                                onChange={(event) => {
                                  searchRiskFilters(event.currentTarget.value);
                                  riskFilterCombobox.openDropdown();
                                }}
                              />
                            </Combobox.EventsTarget>
                          </Pill.Group>
                        </PillsInput>
                      </Combobox.DropdownTarget>

                      <Combobox.Dropdown>
                        <Combobox.Options style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                        <Table.Th style={{ minWidth: '250px' }}>Classifications</Table.Th>
                        <Table.Th>Benefit</Table.Th>
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
                            <Stack gap="xs">
                              {risk.classification_sets.map((classificationSet, setIndex) => (
                                <div key={`set-${setIndex}`} className="bg-gray-100 p-2 rounded-md">
                                  <Group gap="xs">
                                    {classificationSet.map((classificationId) => {
                                      const classification = classifications.find(c => c.id === classificationId);
                                      return classification ? (
                                        <Badge key={classificationId} variant="light" size="sm" color={classification.type === 'hazards' ? 'red' : 'blue'}>
                                          {classification.name}
                                        </Badge>
                                      ) : null;
                                    })}
                                  </Group>
                                </div>
                              ))}
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{risk.risk_benefit}</Text>
                          </Table.Td>
                          <Table.Td>
                            {currentVersion.is_published === 0 && currentVersion.has_been_used === 0 && (
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
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>
              </>
              )}
            </Tabs.Panel>






            {/* 
            -------------------
            CLASSIFICATIONS
            -------------------
            */}
            <Tabs.Panel value="classifications">
                
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
                      <Table.Th style={{ width: '90px' }}>Type</Table.Th>
                      <Table.Th style={{ width: '90px' }}>Standard</Table.Th>
                      <Table.Th style={{ width: '110px' }}>Actions</Table.Th>
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
                        <Table.Td>
                          <div className="flex items-center gap-2">
                            {classification.icon && <SvgRenderer svgString={classification.icon} className="w-6 h-6" />}
                            <Text>{classification.name}</Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color={classification.type === 'hazards' ? 'red' : 'blue'}>
                            <span className="capitalize">{classification.type}</span>
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {classification.type === 'context' && (
                            <Badge variant="light" color="gray">
                              <span className="capitalize">NA</span>
                            </Badge>
                          )}
                          {classification.type === 'hazards' && (
                            <Badge variant="light" color={classification.isstandard === 1 ? 'green' : 'gray'}>
                              <span className="capitalize">{classification.isstandard === 1 ? 'Yes' : 'No'}</span>
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="1">
                            {currentVersion?.is_published === 0 && currentVersion?.has_been_used === 0 && (
                              <>
                                <ActionIcon 
                                  variant="subtle" 
                                  color="blue"
                                  onClick={() => openClassificationIconModal(classification)}
                                >
                                  <IconPhoto size={16} />
                                </ActionIcon>
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
                              </>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>

            </Tabs.Panel>






            <Tabs.Panel value="versions">
              {/* Version Control Section */}
              <Card withBorder>
                <Group justify="space-between" mb="md">
                  <Text fz="lg" fw={500}>Version Control</Text>
                </Group>

                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Version</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Published By</Table.Th>
                      <Table.Th>Published Date</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {versions.map((version) => (
                      <Table.Tr 
                        key={version.id} 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => switchToVersion(version.version)}
                      >
                        <Table.Td>
                          <div className="flex items-center gap-2">
                            <Text fw={500}>v{version.version}</Text>
                            {currentVersion?.version === version.version && (
                              <Badge size="xs" color="blue" ml="xs">Viewing</Badge>
                            )}
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge 
                            variant={version.is_published ? "filled" : "light"}
                            color={version.is_published ? "green" : "gray"}
                          >
                            {version.is_published ? "Published" : "Draft"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{version.published_by || "-"}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {version.timepublished ? new Date(version.timepublished * 1000).toLocaleDateString() : "-"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {!version.is_published && (
                              <>
                                <ActionIcon 
                                  variant="subtle" 
                                  color="green"
                                  onClick={() => publishVersion(version.version)}
                                  title="Publish version"
                                >
                                  <IconCheckbox size={16} />
                                </ActionIcon>
                              </>
                            )}
                      
                            <ActionIcon 
                              variant="subtle" 
                              color="blue"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                createDraftVersion(version.version);
                              }}
                              title="Create new draft"
                            >
                              <IconGitBranch size={16} />
                            </ActionIcon>

                            {!version.has_been_used && (
                              <ActionIcon 
                                variant="subtle" 
                                color="red"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click
                                  deleteVersion(version.version);
                                }}
                                title="Delete version"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            )}
                      
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </Tabs.Panel>
          </Tabs>

          


          

      

        </Container>
      </div>

      {/* Classification Modal */}
      <Modal 
        opened={classificationModalOpen} 
        onClose={() => setClassificationModalOpen(false)}
        title={editingClassificationIcon ? 'Edit Classification Icon' : editingClassification ? 'Edit Classification' : 'Add Classification'}
        size="md"
      >
        <Box>
          {classificationError && (
            <Text c="red" size="sm" mb="md">
              {classificationError}
            </Text>
          )}
          
          {editingClassificationIcon && (
          <Textarea
            label="Icon"
            placeholder="<svg..."
            value={classificationForm.icon}
            onChange={(e) => setClassificationForm({ ...classificationForm, icon: e.target.value })}
            mb="md"
            autosize
            minRows={2}
          />
          )}
          {!editingClassificationIcon && (
            <>
              <TextInput
                label="Name"
                placeholder="e.g., 0-4 students"
                value={classificationForm.name}
                onChange={(e) => setClassificationForm({ ...classificationForm, name: e.target.value })}
                mb="md"
                required
              />

              <Textarea
                label="Description"
                value={classificationForm.description}
                onChange={(e) => setClassificationForm({ ...classificationForm, description: e.target.value })}
                mb="md"
                autosize
                minRows={2}
              />

              <Select
                label="Type"
                value={classificationForm.type}
                onChange={(value) => setClassificationForm({ ...classificationForm, type: value || 'hazards' })}
                mb="md"
                required
                data={[
                  { value: 'hazards', label: 'Hazards' },
                  { value: 'context', label: 'Context' },
                ]}
              >
              </Select>

              {classificationForm.type === 'hazards' && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Text fz="sm" fw={500}>Contexts</Text>
                      <Tooltip w={300} label="This determines when the hazard should be displayed as an option to the user. For example, this might be a hazard that only applies to incursions. Leave blank to display in all contexts." multiline withArrow>
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
                        handleContextSelect(classification);
                        combobox.closeDropdown();
                      }}
                      withinPortal={false}
                    >
                      <Combobox.DropdownTarget>
                        <PillsInput 
                          pointer 
                          leftSection={<IconCategory2 size={18} />}
                        >
                          <Pill.Group>
                            {selectedContexts.map((context) => (
                              <Badge key={context.id} variant='filled' pr={0} color={context.type === 'hazards' ? 'red.2' : 'blue.2'} size="lg" radius="xl">
                                <Flex gap={4}>
                                  <Text className="normal-case font-normal text-black text-sm">{context.name}</Text>
                                  <CloseButton
                                    onMouseDown={() => handleContextRemove(context)}
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
                                onFocus={() => {
                                  setClassificationSearchResults(classifications);
                                  combobox.openDropdown();
                                }}
                                onClick={() => {
                                  setClassificationSearchResults(classifications);
                                  combobox.openDropdown();
                                }}
                                onBlur={() => combobox.closeDropdown()}
                                value={classificationSearch}
                                placeholder="Search classifications"
                                onChange={(event) => {
                                  searchClassifications(event.currentTarget.value);
                                  combobox.openDropdown();
                                }}
                              />
                            </Combobox.EventsTarget>
                          </Pill.Group>
                        </PillsInput>
                      </Combobox.DropdownTarget>

                      <Combobox.Dropdown>
                        <Combobox.Options style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {classificationSearchResults.length > 0 
                            ? classificationSearchResults.filter((classification) => classification.type === 'context').map((classification) => (
                                <Combobox.Option value={JSON.stringify(classification)} key={classification.id}>
                                  <Text className="normal-case font-normal text-black text-sm">{classification.name}</Text>
                                </Combobox.Option>
                              ))
                            : <Combobox.Empty>Nothing found...</Combobox.Empty>
                          }
                        </Combobox.Options>
                      </Combobox.Dropdown>
                    </Combobox>
                  </div>
                

                  <Checkbox
                    label={
                      <Group>
                        <Text size="sm">Standard Classification</Text>
                        <Tooltip w={300} label="Risks under this classification will be included in the risk assessment by default, as long as context conditions are met." multiline withArrow>
                          <div className="flex items-center gap-1 text-blue-600">
                            <IconAlertSquare className="size-4" />
                            <Text size="xs">Help</Text>
                          </div>
                        </Tooltip>
                      </Group>
                    }
                    checked={classificationForm.isstandard === 1}
                    onChange={(e) => setClassificationForm({ ...classificationForm, isstandard: e.currentTarget.checked ? 1 : 0 })}
                    mb="lg"
                  />
                </>
              )}
            </>
          )}

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setClassificationModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveClassification}>
              {editingClassificationIcon ? 'Update Icon' : editingClassification ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Risk Modal */}
      <Modal 
        opened={riskModalOpen} 
        onClose={() => setRiskModalOpen(false)}
        title={editingRisk ? 'Edit Risk' : 'Add Risk'}
        size="xl"
      >
        <Box>
          <Textarea
            label="Hazard"
            placeholder="Describe the hazard..."
            value={riskForm.hazard}
            onChange={(e) => setRiskForm({ ...riskForm, hazard: e.target.value })}
            mb="md"
            required
            autosize
            minRows={3}
          />
          
          <Textarea
            label="Control Measures"
            placeholder="Describe the control measures..."
            value={riskForm.controlmeasures}
            onChange={(e) => setRiskForm({ ...riskForm, controlmeasures: e.target.value })}
            mb="md"
            required
            minRows={3}
            autosize
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
            autosize
          />
          
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Text fz="sm" fw={500}>Classification Sets</Text>
              <Tooltip label="Create sets of classifications where this risk should appear. A risk will be included if ANY of its sets match the selected classifications in the risk assessment." multiline withArrow>
                <div className="flex items-center gap-1 text-blue-600">
                  <IconAlertSquare className="size-4" />
                  <Text size="xs">Help</Text>
                </div>
              </Tooltip>
            </div>
            
            {/* Single combobox for adding new classification sets */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Combobox 
                    store={addSetCombobox} 
                    onOptionSubmit={(optionValue: string) => {
                      const classification = JSON.parse(optionValue);
                      addClassificationToCurrentSet(classification);
                    }}
                    withinPortal={false}
                  >
                    <Combobox.DropdownTarget>
                      <PillsInput 
                        pointer 
                        leftSection={<IconCategory2 size={18} />}
                      >
                        <Pill.Group>
                          {currentSetClassifications.map((classification) => (
                            <Badge key={classification.id} variant='filled' pr={0} color={classification.type === 'hazards' ? 'red.2' : 'blue.2'} size="lg" radius="xl">
                              <Flex gap={4}>
                                <Text className="normal-case font-normal text-black text-sm">{classification.name}</Text>
                                <CloseButton
                                  onMouseDown={() => removeClassificationFromCurrentSet(classification)}
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
                              onFocus={() => {
                                addSetCombobox.openDropdown();
                              }}
                              onClick={() => {
                                addSetCombobox.openDropdown();
                              }}
                              onBlur={() => addSetCombobox.closeDropdown()}
                              placeholder="Search and select classifications for this set..."
                              value={classificationSetSearchInput}
                              onChange={(event) => {
                                // Filter classifications based on search
                                const query = event.currentTarget.value;
                                setClassificationSetSearchInput(query);
                                if (!query.length) {
                                  setClassificationSearchResults(classifications);
                                } else {
                                  const filtered = classifications.filter(classification =>
                                    classification.name.toLowerCase().includes(query.toLowerCase())
                                  );
                                  setClassificationSearchResults(filtered);
                                }
                                addSetCombobox.openDropdown();
                              }}
                            />
                          </Combobox.EventsTarget>
                        </Pill.Group>
                      </PillsInput>
                    </Combobox.DropdownTarget>

                    <Combobox.Dropdown>
                      <Combobox.Options style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {classificationSearchResults.length > 0 
                          ? classificationSearchResults.map((classification) => (
                              <Combobox.Option value={JSON.stringify(classification)} key={classification.id}>
                                <Text className="normal-case font-normal text-black text-sm">{classification.name}</Text>
                              </Combobox.Option>
                            ))
                          : <Combobox.Empty>Nothing found...</Combobox.Empty>
                        }
                      </Combobox.Options>
                    </Combobox.Dropdown>
                  </Combobox>
                </div>
                
                {/* Add button */}
                <Button
                  variant="light"
                  leftSection={<IconPlus size={16} />}
                  onClick={addCurrentSetToRisk}
                  size="sm"
                  disabled={currentSetClassifications.length === 0}
                  className="self-end"
                >
                  + Add
                </Button>
              </div>
            </div>
            
            {/* Display existing classification sets */}
            {riskForm.classification_sets.length > 0 && (
              <>
                {riskForm.classification_sets.map((set, setIndex) => (
                  <div key={setIndex} className="mb-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Text fz="sm" fw={500}>Set {setIndex + 1}</Text>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => {
                          const newSets = [...riskForm.classification_sets];
                          newSets.splice(setIndex, 1);
                          setRiskForm({ ...riskForm, classification_sets: newSets });
                        }}
                      >
                        Remove Set
                      </Button>
                    </div>
                    
                    {/* Display classifications in this set */}
                    <Group gap="xs">
                      {set.map((classificationId) => {
                        const classification = classifications.find(c => c.id === classificationId);
                        return classification ? (
                          <Badge key={classificationId} variant='filled' pr={0} color={classification.type === 'hazards' ? 'red.2' : 'blue.2'} size="lg" radius="xl">
                            <Flex gap={4}>
                              <Text className="normal-case font-normal text-black text-sm">{classification.name}</Text>
                              <CloseButton
                                onMouseDown={() => {
                                  const newSets = [...riskForm.classification_sets];
                                  newSets[setIndex] = newSets[setIndex].filter(id => id !== classificationId);
                                  setRiskForm({ ...riskForm, classification_sets: newSets });
                                }}
                                variant="transparent"
                                size={22}
                                iconSize={14}
                                tabIndex={-1}
                              />
                            </Flex>
                          </Badge>
                        ) : null;
                      })}
                    </Group>
                  </div>
                ))}
              </>
            )}
          </div>
          
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

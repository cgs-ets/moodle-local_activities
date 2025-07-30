import { useEffect, useState } from "react";
import { Box, Container, Center, Text, Loader, Card, Checkbox, Group, Stack, Grid } from '@mantine/core';
import { useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import dayjs from "dayjs";
import { defaults, useFormStore } from "../../stores/formStore";
import { ActivityDetails } from "./Components/ActivityDetails";
import useFetch from "../../hooks/useFetch";
import { PageHeader } from "./Components/PageHeader";
import { SvgRenderer } from "../../components/SvgRenderer";

interface Classification {
  id: number;
  name: string;
  sortorder: number;
  icon: string;
  description: string;
}

interface RiskAssessment {
  selectedClassifications: number[];
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

  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment>({
    selectedClassifications: []
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
    loadClassifications()
  }, []);

  const loadClassifications = async () => {
    setClassificationsLoading(true)
    try {
      const response = await api.call({
        query: {
          methodname: 'local_activities-get_classifications'
        }
      })
      
      if (!response.error) {
        setClassifications(response.data)
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

  const handleClassificationChange = (classificationId: number, checked: boolean) => {
    setRiskAssessment(prev => ({
      ...prev,
      selectedClassifications: checked 
        ? [...prev.selectedClassifications, classificationId]
        : prev.selectedClassifications.filter(id => id !== classificationId)
    }))
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
                    <Text fz="md">What attributes of the activity are present?</Text>
                    
                    {classificationsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader size="sm" />
                      </div>
                    ) : (

                      <Checkbox.Group
                        value={riskAssessment.selectedClassifications.map(id => id.toString())}
                        onChange={(value) => setRiskAssessment({...riskAssessment, selectedClassifications: value.map(id => parseInt(id))})}
                        label=""
                        description="Select all that apply"
                      >
                        <Grid pt="md" gutter="md" columns={12}>
                          {classifications.map((classification) => (
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
                          ))}
                        </Grid>
                      </Checkbox.Group>
                    )}
                  </Card>
                </Box>

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
                      )
                    }, null, 2)}
                  </pre>
                </div>

              </Container>
            </> : null
        }
        

      </div>
      <Footer />
    </>
  )
}
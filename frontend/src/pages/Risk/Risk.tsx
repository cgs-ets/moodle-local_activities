import { useEffect, useState } from "react";
import { Box, Container, Center, Text, Loader, Card, Checkbox, Group } from '@mantine/core';
import { useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import dayjs from "dayjs";
import { defaults, useFormStore } from "../../stores/formStore";
import { ActivityDetails } from "./Components/ActivityDetails";
import useFetch from "../../hooks/useFetch";
import { PageHeader } from "./Components/PageHeader";

interface RiskOptions {
  ageRange: string[]
  transport: boolean
  localAreaWalk: boolean
  volunteersAssisting: boolean
  waterHazard: boolean
  externalSwimmingPool: boolean
  publicPlayground: boolean
  sportsPhysicalActivity: boolean
  powerkartRaceway: boolean
  museumGallery: boolean
  farmZoo: boolean
  aviary: boolean
  moviesTheatre: boolean
  cookingSchool: boolean
  vrLaserTag: boolean
  golfCourse: boolean
  treetopsRopes: boolean
  fishing: boolean
  waiverRequired: boolean
  primarySchoolOvernight: boolean
  overnightExcursion: boolean
}

export function Risk() {
  let { id } = useParams();
  let { activityid } = useParams();

  const formData = useFormStore()
  const setFormData = useFormStore((state) => state.setState)
  const api = useFetch()
  const [loading, setLoading] = useState(true)

  const [riskOptions, setRiskOptions] = useState<RiskOptions>({
    ageRange: [],
    transport: false,
    localAreaWalk: false,
    volunteersAssisting: false,
    waterHazard: false,
    externalSwimmingPool: false,
    publicPlayground: false,
    sportsPhysicalActivity: false,
    powerkartRaceway: false,
    museumGallery: false,
    farmZoo: false,
    aviary: false,
    moviesTheatre: false,
    cookingSchool: false,
    vrLaserTag: false,
    golfCourse: false,
    treetopsRopes: false,
    fishing: false,
    waiverRequired: false,
    primarySchoolOvernight: false,
    overnightExcursion: false,
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
    }
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
                    <Text fz="md">Participant age range</Text>
                    <Checkbox.Group
                      value={riskOptions.ageRange}
                      onChange={(value) => setRiskOptions({...riskOptions, ageRange: value})}
                    >
                      <Group mt="xs">
                        <Checkbox value="0-4" label="0-4" />
                        <Checkbox value="5-12" label="5-12" />
                        <Checkbox value="13+" label="13+" />
                      </Group>
                    </Checkbox.Group>

                    

                  </Card>
                </Box>

                <Box className="flex flex-col gap-4">
                  <Card withBorder className="">
                    <Text fz="md">Select all that apply</Text>
                    <div className="flex flex-col gap-2 mt-2">

                      <Checkbox
                        label="Transport - school or external bus"
                        checked={riskOptions.transport}
                        onChange={(event) => setRiskOptions({...riskOptions, transport: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Local area walk or bush school (no transport required)"
                        checked={riskOptions.localAreaWalk}
                        onChange={(event) => setRiskOptions({...riskOptions, localAreaWalk: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Volunteers assisting with supervision"
                        checked={riskOptions.volunteersAssisting}
                        onChange={(event) => setRiskOptions({...riskOptions, volunteersAssisting: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Water Hazard - Creek/River/Lake/Pond utilised for activity on in close vicinity"
                        checked={riskOptions.waterHazard}
                        onChange={(event) => setRiskOptions({...riskOptions, waterHazard: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="External Swimming Pool or Aqua Park"
                        checked={riskOptions.externalSwimmingPool}
                        onChange={(event) => setRiskOptions({...riskOptions, externalSwimmingPool: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Use of Public Playground"
                        checked={riskOptions.publicPlayground}
                        onChange={(event) => setRiskOptions({...riskOptions, publicPlayground: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Sports & Physical Activity Participation"
                        checked={riskOptions.sportsPhysicalActivity}
                        onChange={(event) => setRiskOptions({...riskOptions, sportsPhysicalActivity: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Powerkart raceway"
                        checked={riskOptions.powerkartRaceway}
                        onChange={(event) => setRiskOptions({...riskOptions, powerkartRaceway: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Museum or Gallery Visit"
                        checked={riskOptions.museumGallery}
                        onChange={(event) => setRiskOptions({...riskOptions, museumGallery: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Farm or Zoo Visit"
                        checked={riskOptions.farmZoo}
                        onChange={(event) => setRiskOptions({...riskOptions, farmZoo: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Aviary Visit"
                        checked={riskOptions.aviary}
                        onChange={(event) => setRiskOptions({...riskOptions, aviary: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Movies/Theatre"
                        checked={riskOptions.moviesTheatre}
                        onChange={(event) => setRiskOptions({...riskOptions, moviesTheatre: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Cooking School"
                        checked={riskOptions.cookingSchool}
                        onChange={(event) => setRiskOptions({...riskOptions, cookingSchool: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="VR/ Laser Tag / Arcades / Commercial Play Spaces"
                        checked={riskOptions.vrLaserTag}
                        onChange={(event) => setRiskOptions({...riskOptions, vrLaserTag: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Golf Course or Driving Range"
                        checked={riskOptions.golfCourse}
                        onChange={(event) => setRiskOptions({...riskOptions, golfCourse: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Treetops ropes course"
                        checked={riskOptions.treetopsRopes}
                        onChange={(event) => setRiskOptions({...riskOptions, treetopsRopes: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Fishing"
                        checked={riskOptions.fishing}
                        onChange={(event) => setRiskOptions({...riskOptions, fishing: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Waiver required for external organisation"
                        checked={riskOptions.waiverRequired}
                        onChange={(event) => setRiskOptions({...riskOptions, waiverRequired: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Primary School Overnight Outdoor Education Camp (with External Provider)"
                        checked={riskOptions.primarySchoolOvernight}
                        onChange={(event) => setRiskOptions({...riskOptions, primarySchoolOvernight: event.currentTarget.checked})}
                      />

                      <Checkbox
                        label="Overnight Excursion with CGS Staff (no external provider)"
                        checked={riskOptions.overnightExcursion}
                        onChange={(event) => setRiskOptions({...riskOptions, overnightExcursion: event.currentTarget.checked})}
                      />

                    </div>
                  </Card>
                </Box>




<div>
Ok, so, I need to find out what kind of risk assessment this is to start. The beginning is AGE BASED.

If the activity has students, I need to know how OLD they are, and base it off that.

If he activity does not have students, I need to ask the user to select age ranges of the participants.

For now, use campus based instead of age based.


<pre>
  {JSON.stringify(formData, null, 2)}
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
import { useEffect } from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { Box, Button, Card, Container, Grid, Group } from "@mantine/core";
import { getConfig } from "../../utils";
import { IconCalendarPlus } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export function Dashboard() {

  useEffect(() => {
    document.title = 'Activities Dashboard';
    console.log(getConfig().roles)
  }, []);


  return (
    <>
      <Header />
      <div className="page-wrapper">
        <div>
          <Container size="xl" mt={50} mb="xl">
            <Grid grow>
              <Grid.Col span={{ base: 12, lg: 9 }}>
                <Card 
                  className="rounded-sm rounded-b-none overflow-visible mb-6 pb-0"
                  withBorder 
                >
                  <Card.Section p="md" withBorder>
                    <div className="flex justify-between items-center">
                      <div className="font-medium">Activities</div>
                      { getConfig().roles.includes('staff') 
                        ? <Button component={Link} to="/new" size="compact-md" radius="lg" variant="light" leftSection={<IconCalendarPlus size={14} />}>Add events</Button> : null
                      }
                    </div>
                  </Card.Section>
                </Card>
              </Grid.Col>
                <Grid.Col span={{ base: 12, lg: 3 }}>
                  <Box>
                    <Grid grow>


                    </Grid>
                  </Box>
                </Grid.Col>
            </Grid>
          </Container>
        </div>
      </div>
      <Footer />

    </>
  );
};
import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ActionIcon, Container, Grid, SegmentedControl } from "@mantine/core";
import { getConfig } from "../../utils";
import { Calendar } from "./components/Calendar";
import { IconCalendarWeek, IconList, IconListDetails, IconTable } from "@tabler/icons-react";
import { List } from "./components/List";
import { MyEvents } from "./components/MyEvents";
import { useSearchParams } from "react-router-dom";

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'Activities Dashboard';
  }, []);

  const [caltype, setCaltype] = useState<string>(searchParams.get('type') || 'calendar')

  useEffect(() => {
    if (caltype) {
      setSearchParams(params => {
        params.set("type", caltype);
        return params;
      });
    }
  }, [caltype])

  return (
    <>
      <Header />
      <div className="page-wrapper">
        <Container size="xl" className="w-full max-w-full p-0">

          <Grid grow gutter={0}>
            <Grid.Col span={{ base: 12, lg: 9 }} className="border-r min-h-screen bg-white pb-6">
              { getConfig().roles.includes("staff") &&
                <>
                  {false &&
                    <div className="flex justify-end p-3">
                      <ActionIcon.Group>
                        <ActionIcon onClick={() => setCaltype('calendar')} size="lg" variant={caltype == 'calendar' ? 'filled' : 'light'} ml={2}>
                          <IconCalendarWeek stroke={1.5} />
                        </ActionIcon>
                        <ActionIcon onClick={() => setCaltype('list')} size="lg" variant={caltype == 'list' ? 'filled' : 'light'} ml={2}>
                          <IconListDetails stroke={1.5} />
                        </ActionIcon>
                      </ActionIcon.Group>
                    </div>
                  }

                  { caltype == 'calendar'
                    ? <Calendar setCaltype={setCaltype} />
                    : <List setCaltype={setCaltype} />
                  }
                </>
              }
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 3 }}>
              <div>
                <MyEvents />

              </div>
            </Grid.Col>
          </Grid>

        </Container>




      </div>

    </>
  );
};
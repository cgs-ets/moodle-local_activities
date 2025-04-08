import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { Container, Grid } from "@mantine/core";
import { getConfig } from "../../utils";
import { Calendar } from "./components/Calendar";
import { List } from "./components/List";
import { MyActivities } from "./components/MyActivities";
import { useSearchParams } from "react-router-dom";

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'Activities Dashboard';
  }, []);

  const defaultCalType = 'calendar'

  const [caltype, setCaltype] = useState<string>(searchParams.get('type') || defaultCalType)

  useEffect(() => {
    if (!searchParams.get('type') && caltype == defaultCalType) {
      return // Default caltype, don't append as it adds to hisory.
    }
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
          { getConfig().roles.includes("staff") 
            ? <Container size="xl" className="w-full max-w-full p-0">
                <Grid grow gutter={0}>
                    <Grid.Col span={{ base: 12, lg: 9 }} className="border-r min-h-screen bg-white pb-6">
                      { caltype == 'calendar'
                        ? <Calendar setCaltype={setCaltype} />
                        : <List setCaltype={setCaltype} />
                      }
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, lg: 3 }}>
                    <div>
                      <div className='bg-white border-b p-4'>
                        <span className="text-base">My upcoming activities</span>
                      </div>
                      <MyActivities />
                    </div>
                  </Grid.Col>
                </Grid>
                </Container>
            : <Container size="xl" className="p-4">
                <div className='bg-white border rounded-t p-4'>
                  <span className="text-base">My upcoming activities</span>
                </div>
                <div className="border-x">
                  <MyActivities />
                </div>
              </Container>
          }
      </div>
    </>
  );
};
import { useEffect, useState } from "react";
import { Container, Grid } from "@mantine/core";
import { List } from "./components/List";
import { useSearchParams } from "react-router-dom";
import { Calendar } from "./components/Calendar";
import { Header } from "./components/Header";

export function Public() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'CGS Calendar';
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
        <Container size="xl" className="w-full max-w-full p-0">
          <Grid grow gutter={0}>
              <Grid.Col span={{ base: 12, lg: 9 }} className="border-r min-h-screen bg-white pb-6">
                { caltype == 'calendar'
                  ? <Calendar setCaltype={setCaltype} />
                  : <List setCaltype={setCaltype} />
                }
            </Grid.Col>
          </Grid>
          </Container>
      </div>
    </>
  );
};
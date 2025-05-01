import { useEffect, useState } from "react";
import { Button, Container, Grid } from "@mantine/core";
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
  const defaultCategories = [] as string[]
  const [caltype, setCaltype] = useState<string>(searchParams.get('type') || defaultCalType)
  const [categories, setCategories] = useState<string[]>(searchParams.get('categories')?.split(',') || defaultCategories as string[])

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
      <Header calType={caltype} />
      <div className="page-wrapper">
        <Container size="xl" className="w-full max-w-full p-0">
          <Grid grow gutter={0}>
              <Grid.Col span={{ base: 12, lg: 9 }} className="border-r min-h-screen bg-white pb-6">
                { caltype == 'calendar'
                  ? <Calendar setCaltype={setCaltype} defaultCategories={categories} />
                  : <List setCaltype={setCaltype} defaultCategories={categories} />
                }
            </Grid.Col>
          </Grid>
          </Container>
      </div>
    </>
  );
};
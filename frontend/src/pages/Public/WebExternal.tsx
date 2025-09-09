import { useEffect } from "react";
import { Container, Grid } from "@mantine/core";
import { List } from "./components/List";
import { useSearchParams } from "react-router-dom";
import { Calendar } from "./components/Calendar";
import { Header } from "./components/Header";
import { useCalViewStore } from "../../stores/calViewStore";
import { useFilterStore } from "../../stores/filterStore";

export function WebExternal() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'CGS Calendar';
  }, []);
  
  const calView = useCalViewStore((state) => state)
  const setCalView = useCalViewStore((state) => (state.setState))

  const filters = useFilterStore((state) => state)
  const setFilters = useFilterStore((state) => (state.setState))

  
  useEffect(() => {
    if (!searchParams.get('type') && calView.type == 'calendar') {
      return // if caltype is already default, don't append as it adds to history.
    }
    console.log('calView.type', calView.type)
    if (calView.type) {
      setSearchParams(params => {
        params.set("type", calView.type);
        return params;
      });
      setCalView({...calView, type: calView.type})
    }
  }, [calView.type])

  const defaultFilters = [
    "Whole School/Website External",
    "Senior School/Website External",
    "Primary School/Website External",
  ]
  useEffect(() => {
    setFilters({...filters, categories: defaultFilters})
  }, []);

  // Default to list view
  useEffect(() => {
    setCalView({...calView, type: searchParams.get('type') || 'list'})
  }, [])

 
  return (
    <>
      <Header hideNav hideSearch />
      <div className="page-wrapper">
        <Container size="xl" className="w-full max-w-full p-0">
          <Grid grow gutter={0}>
              <Grid.Col span={{ base: 12, lg: 9 }} className="border-r min-h-screen bg-white pb-6">
                { calView.type == 'calendar'
                  ? <Calendar hideFilters />
                  : <List hideFilters />
                }
            </Grid.Col>
          </Grid>
          </Container>
      </div>
    </>
  );
};
import { useEffect, useState } from "react";
import { Button, Container, Grid } from "@mantine/core";
import { List } from "./components/List";
import { useSearchParams } from "react-router-dom";
import { Calendar } from "./components/Calendar";
import { Header } from "./components/Header";
import { useCalViewStore } from "../../stores/calViewStore";
import { useFilterStore } from "../../stores/filterStore";

export function Public() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'CGS Calendar';
  }, []);

  //const defaultCategories = [] as string[]
  //const [categories, setCategories] = useState<string[]>(searchParams.get('categories')?.split(',') || defaultCategories as string[])
  
  const calView = useCalViewStore((state) => state)
  const setCalView = useCalViewStore((state) => (state.setState))

  console.log(calView)

  const filters = useFilterStore((state) => state)
  const setFilters = useFilterStore((state) => (state.setState))

  useEffect(() => {
    if (!searchParams.get('type') && calView.type == 'calendar') {
      return // if caltype is already default, don't append as it adds to history.
    }
    if (calView.type) {
      setSearchParams(params => {
        params.set("type", calView.type);
        return params;
      });
      setCalView({...calView, type: calView.type})
    }
  }, [calView.type])

  // Add filters from search param.
  useEffect(() => {
    setFilters({...filters, categories: searchParams.get('categories')?.split(',').filter(Boolean) || [] as string[]})
  }, [searchParams.get('categories')])


  // If PS or SS categories are removed from filters, remove them from search params.
  useEffect(() => {
    if (filters.categories.length == 0) {
      setSearchParams({categories: '', type: calView.type, year: calView.year, month: calView.month, term: calView.term})
    }
  }, [filters.categories])

 
  return (
    <>
      <Header />
      <div className="page-wrapper">
        <Container size="xl" className="w-full max-w-full p-0">
          <Grid grow gutter={0}>
              <Grid.Col span={{ base: 12, lg: 9 }} className="border-r min-h-screen bg-white pb-6">
                { calView.type == 'calendar'
                  ? <Calendar />
                  : <List />
                }
            </Grid.Col>
          </Grid>
          </Container>
      </div>
    </>
  );
};
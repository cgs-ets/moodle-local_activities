import { useEffect } from "react";
import { Container, Tabs, Title } from '@mantine/core';
import { IconCalendarClock, IconHistory } from '@tabler/icons-react';
import { useSearchParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { UpcomingTab } from "./components/UpcomingTab";
import { PastTab } from "./components/PastTab";

const TABS = ['upcoming', 'past'];

export function UnapprovedChecks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab') ?? '';
  const tab = TABS.includes(requested) ? requested : 'upcoming';

  useEffect(() => {
    document.title = 'Unapproved checks';
  }, []);

  const changeTab = (value: string | null) => {
    setSearchParams(value && value !== 'upcoming' ? { tab: value } : {}, { replace: true });
  };

  return (
    <>
      <Header />
      <div className="page-wrapper" style={{minHeight: 'calc(100vh - 154px)'}}>
        <Container size="xl" py="md">
          <Title order={1} mb="md">Unapproved checks</Title>
          {/* keepMounted={false}: each tab fetches only when it is shown. */}
          <Tabs value={tab} onChange={changeTab} keepMounted={false}>
            <Tabs.List mb="md">
              <Tabs.Tab value="upcoming" leftSection={<IconCalendarClock size={16} />}>Upcoming</Tabs.Tab>
              <Tabs.Tab value="past" leftSection={<IconHistory size={16} />}>Past</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="upcoming">
              <UpcomingTab />
            </Tabs.Panel>
            <Tabs.Panel value="past">
              <PastTab />
            </Tabs.Panel>
          </Tabs>
        </Container>
      </div>
      <Footer />
    </>
  );
}

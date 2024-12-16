import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ActionIcon, Container, SegmentedControl } from "@mantine/core";
import { getConfig } from "../../utils";
import { Calendar } from "./components/Calendar";
import { IconCalendarWeek, IconList, IconListDetails } from "@tabler/icons-react";
import { List } from "./components/List";

export function Dashboard() {

  useEffect(() => {
    document.title = 'Activities Dashboard';
  }, []);

  const [caltype, setCaltype] = useState<string>('calendar')

  return (
    <>
      <Header />
      <div className="page-wrapper">
        <Container size="xl" mb="xl" className="pt-6">
        { getConfig().roles.includes("staff") &&
          <>
            <div className="flex justify-end">
              <ActionIcon.Group>
                <ActionIcon onClick={() => setCaltype('calendar')} size="lg" variant={caltype == 'calendar' ? 'filled' : 'light'} ml={2}>
                  <IconCalendarWeek stroke={1.5} />
                </ActionIcon>

                <ActionIcon onClick={() => setCaltype('list')} size="lg" variant={caltype == 'list' ? 'filled' : 'light'} ml={2}>
                  <IconListDetails stroke={1.5} />
                </ActionIcon>
              </ActionIcon.Group>
            </div>
            { caltype == 'calendar'
              ? <Calendar />
              : <List />
            }
          </>
        }
        </Container>
      </div>
      <Footer />

    </>
  );
};
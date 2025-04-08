import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { getConfig } from "../../utils";
import { Container } from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import { List } from "./components/List";
import { Calendar } from "./components/Calendar";

export function Assessments() {
  const [searchParams, setSearchParams] = useSearchParams();
  
    useEffect(() => {
      document.title = 'Assessments';
    }, []);
  
    const defaultCalType = 'list'
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
          { getConfig().roles?.includes("staff") 
            ? <Container size="xl" className="w-full max-w-full p-0">
                { caltype == 'calendar'
                  ? <Calendar setCaltype={setCaltype} />
                  : <List setCaltype={setCaltype} />
                }
              </Container>
            :null
          }
      </div>
    </>
  )
}
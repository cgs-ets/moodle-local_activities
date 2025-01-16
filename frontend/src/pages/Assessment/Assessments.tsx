import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { getConfig } from "../../utils";
import { Container } from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import { Calendar } from "../Dashboard/components/Calendar";
import { List } from "./components/List";

export function Assessments() {
  const [searchParams, setSearchParams] = useSearchParams();
  
    useEffect(() => {
      document.title = 'Assessments';
    }, []);
  
    const [caltype, setCaltype] = useState<string>(searchParams.get('type') || 'list')
  
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
          { getConfig().roles.includes("staff") 
            ? <Container size="xl" className="w-full max-w-full p-0">
                <List setCaltype={setCaltype} />
              </Container>
            :null
          }
      </div>
    </>
  )
}
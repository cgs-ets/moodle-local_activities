import { useEffect } from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { Container } from "@mantine/core";
import { getConfig } from "../../utils";
import { Calendar } from "./components/Calendar";

export function Dashboard() {

  useEffect(() => {
    document.title = 'Activities Dashboard';
  }, []);

  return (
    <>
      <Header />
      <div className="page-wrapper">
        <Container size="xl" mb="xl" className="pt-10">
        { getConfig().roles.includes("staff") &&
          <Calendar />
        }
        </Container>
      </div>
      <Footer />

    </>
  );
};
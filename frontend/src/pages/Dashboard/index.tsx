import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { Container } from "@mantine/core";
import { getConfig } from "../../utils";
import dayjs from "dayjs";
import { Calendar } from "./components/Calendar";

export function Dashboard() {


  useEffect(() => {
    document.title = 'Activities Dashboard';
    console.log(getConfig().roles)
  }, []);

  return (
    <>
      <Header />
      <div className="page-wrapper">
        <Container size="xl" mb="xl" className="pt-10">
          <Calendar />
        </Container>
      </div>
      <Footer />

    </>
  );
};
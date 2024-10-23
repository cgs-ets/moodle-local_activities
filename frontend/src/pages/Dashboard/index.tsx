import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { Container } from "@mantine/core";
import { getConfig } from "../../utils";
import dayjs from "dayjs";
import { Calendar } from "./components/Calendar";

export function Dashboard() {

  const [month, setMonth] = useState<string>(dayjs().format("MM"))
  const [year, setYear] = useState<string>(dayjs().format("YYYY"))

  useEffect(() => {
    document.title = 'Activities Dashboard';
    console.log(getConfig().roles)
  }, []);


  return (
    <>
      <Header />
      <div className="page-wrapper">
        <Container size="xl" mb="xl">
          <Calendar month={Number(month)} year={Number(year)} />

        </Container>
      </div>
      <Footer />

    </>
  );
};
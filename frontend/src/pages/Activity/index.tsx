import { Fragment } from "react";
import { Container } from '@mantine/core';
//import { useParams } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

export function Activity() {
  //let { id } = useParams();
  
  return (
    <Fragment>
      <Header />
      <div className="page-wrapper" style={{minHeight: 'calc(100vh - 154px)'}}>
        <Container size="xl">
          Header
        </Container>
        <Container size="xl" my="md">
          <form noValidate onSubmit={() => {alert("submit")}}>
            Hello
          </form>
        </Container>
      </div>
      <Footer />
    </Fragment>
  )
}
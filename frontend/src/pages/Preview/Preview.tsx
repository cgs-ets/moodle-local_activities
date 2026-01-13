import { useParams } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { useEffect, useState } from "react";
import { Form } from "../../stores/formStore";
import { getConfig } from "../../utils";
import { EventPreview } from "../../components/EventPreview";

export function Preview() {
  let { id } = useParams();
  const api = useFetch()
  const [activity, setActivity] = useState<Form | null>(null)

  useEffect(() => {
    document.title = 'Activity Preview';

    if (id) {
      getActivity()
    }
  }, [id]);

  const getActivity = async () => {

    const fetchResponse = await api.call({
      query: {
        methodname: 'local_activities-get_activity_with_permission',
        id: id,
      }
    })
    if (fetchResponse.error) {
      return
    }
    setActivity(fetchResponse.data)
  }


  return (
    <>
      <EventPreview activity={activity} hideOpenButton={!getConfig().roles?.includes("staff")} />
    </>
  );
};
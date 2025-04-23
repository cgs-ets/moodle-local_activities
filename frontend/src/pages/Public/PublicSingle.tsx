import { useNavigate, useParams } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { useEffect, useState } from "react";
import { Form } from "../../stores/formStore";
import { EventModal } from "../../components/EventModal";
import { getConfig } from "../../utils";
import { EventPreview } from "../../components/EventPreview";

export function PublicSingle() {
  let { id } = useParams();
  const api = useFetch()
  const [activity, setActivity] = useState<Form | null>(null)

  useEffect(() => {
    document.title = 'Activity';

    if (id) {
      getActivity()
    }
  }, [id]);

  const getActivity = async () => {

    const fetchResponse = await api.call({
      query: {
        methodname: 'local_activities-get_public_activity',
        id: id,
      }
    }, getConfig().wwwroot + '/local/activities/service-public.php')
    
    if (fetchResponse.error) {
      return
    }
    setActivity(fetchResponse.data)
    document.title = fetchResponse.data.activityname
  }

  return (
    <>
      <EventPreview activity={activity} isPublic={true} hideOpenButton={true} />
    </>
  );
};
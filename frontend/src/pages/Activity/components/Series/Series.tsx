import { useEffect, useState } from "react";
import useFetch from "../../../../hooks/useFetch";
import { Card } from "@mantine/core";
import { LoadingOverlay } from "@mantine/core";

export function Series({
  activityid,
}: {
  activityid: number,
}) {
  const api = useFetch()
  const [series, setSeries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSeries()
  }, [activityid]);

  const getSeries = async () => {
    setLoading(true)
    const response = await api.call({
      query: {
        methodname: 'local_activities-get_series',
        id: activityid,
      },
    });
    if (!response.error) {
      setSeries(response.data)
    }
    setLoading(false)
  }


  
  return (
    <>
          <Card withBorder radius="sm" className="p-0 rounded-t-none -mt-[1px]" mb="lg">
            
            <div className="px-4 py-2">
              <span className="text-base">Recurring series</span>
            </div>
            
            <div className="relative flex flex-col border-t text-sm">
              <LoadingOverlay visible={loading} />
              {series.map((series: any, i) => 
                <div key={series.id}>
                  <div>{series.activityname}</div>
                  <div>{series.timestart}</div>
                  <div>{series.timeend}</div>
                </div>
              )}
            </div>

          </Card>
          
        </>
  )
}

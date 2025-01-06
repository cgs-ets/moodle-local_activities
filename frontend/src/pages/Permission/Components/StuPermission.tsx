import { Avatar, Group, LoadingOverlay, Radio, SegmentedControl, Switch, Text } from "@mantine/core"
import { IconUser } from "@tabler/icons-react"
import { useAjax } from "../../../hooks/useAjax";
import { useEffect, useState } from "react";
import { cn } from "../../../utils/utils";
import { User } from "../../../types/types";

export function StuPermission({
  expired,
  student,
  init,
  permissionid,
}: {
  expired: boolean,
  student: User,
  init: number,
  permissionid: number,
}) {
  const [response, setResponse] = useState<number>(init)
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function
  
  const onRespond = (checked: boolean) => {
    return submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-submit_permission',
        args: {
          permissionid: permissionid,
          response: checked ? 1 : 2
        },
      }
    })
  }

  useEffect(() => {
    if (submitResponse && !submitError) {
      setResponse(submitResponse.data)
    }
  }, [submitResponse]);


  return (
    <div 
      className={
        cn(
          "border-t gap-2 px-4",
          response == 1 
          ? "bg-[#d4edda]" 
          : response == 2
            ? "bg-red-200" 
            : "bg-gray-100",
          submitLoading
          ? "opacity-40 pointer-events-none"
          : ""
        )
      }
    >

      <div className="flex items-center justify-between gap-2 py-2 relative">
        <div>
          <Group gap="sm">
            <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + student.un} />
            <Text>{ student.fn} { student.ln}</Text>
          </Group>
        </div>
        
        { /*
        <div className="flex gap-3">
          <div>No</div>
          <Switch
            checked={response == 1}
            onChange={(event) => onRespond(event.currentTarget.checked)}
            readOnly={expired}
            color={expired ? "dark" : "blue"}
          />
          <div>Yes</div>
        </div>
        */ }

        <Radio.Group
          name={student.un + 'permission'}
          value={response == 1 ? 'Yes' : response == 2 ? 'No' : undefined}
          onChange={(value) => value == 'Yes' ? onRespond(true) : onRespond(false)}
        >
          <Group>
            <Radio color="red" value="No" label="No" />
            <Radio color="green" value="Yes" label="Yes" />
          </Group>
        </Radio.Group>
      

      </div>
    </div>
  )
}

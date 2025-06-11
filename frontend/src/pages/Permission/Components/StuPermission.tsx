import { Avatar, Group, LoadingOverlay, Radio, SegmentedControl, Switch, Text, Notification, NotificationProps, rem, CloseButton } from "@mantine/core"
import { IconCheck, IconUser } from "@tabler/icons-react"
import { useAjax } from "../../../hooks/useAjax";
import { useEffect, useState } from "react";
import { cn } from "../../../utils/utils";
import { User } from "../../../types/types";
import { keyframes } from '@emotion/react';
import useFetch from "../../../hooks/useFetch";

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
  const [notification, setNotification] = useState<NotificationProps | null>(null)
  const api = useFetch()
  
  const onRespond = async (checked: boolean) => {
    const response = await api.call({
      method: "POST",
      body: {
        methodname: 'local_activities-submit_permission',
        args: {
          permissionid: permissionid,
          response: checked ? 1 : 2
        },
      }
    })

    if (response && !response.error) {
      setNotification({
        icon: <IconCheck className="size-4" />,
        color: "teal",
        title: null,
        children: (
          <div className="flex gap-3 items-center">
            Response saved
          </div>
        ),
      })
    }
    setResponse(response.data)
  }

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 10000); // Auto-close after 10 seconds
  
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Define animations
  const slideIn = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
  `;

  return (
    <>
    <div 
      className={
        cn(
          "border-t gap-2 px-4",
          response == 1 
          ? "bg-[#d4edda]" 
          : response == 2
            ? "bg-red-200" 
            : "bg-gray-100",
          api.state.loading
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

    {notification && (
        <Notification
          {...notification}
          onClose={() => setNotification(null)}
          className="fixed bottom-0 right-0 m-4"
          style={{
            position: 'fixed',
            bottom: rem(16),
            right: rem(16),
            animation: notification ? `${slideIn} 300ms ease-out` : undefined,
          }}
        />
      )}

      
    </>
  )
}

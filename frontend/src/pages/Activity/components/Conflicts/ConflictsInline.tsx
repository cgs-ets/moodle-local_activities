import { Alert, Anchor, Avatar, Button, Card, Modal, Table, Text } from "@mantine/core"
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import useFetch from "../../../../hooks/useFetch";
import { useFormStore } from "../../../../stores/formStore";
import { IconCalendarX, IconChevronDown, IconChevronRight, IconChevronUp } from "@tabler/icons-react";
import { statuses } from "../../../../utils";
import { cn } from "../../../../utils/utils";

export function ConflictsInline() {
  
  const [conflicts, setConflicts] = useState<any>([])
  const [conflictsOpened, {open: showConflicts, close: hideConflicts}] = useDisclosure(false);
  const getConflictsAPI = useFetch()
  const timestart = useFormStore((state) => (state.timestart))
  const timeend = useFormStore((state) => (state.timeend))
  const id = useFormStore((state) => (state.id))
  const status = useFormStore((state) => state.status)

  const getConflicts = async () => {
    console.log("Checking for conflicts..")
    setConflicts([])
    hideConflicts()
    if (timestart && timeend && timestart != timeend) {
      const res = await getConflictsAPI.call({
        query: {
          methodname: 'local_activities-check_conflicts',
          timestart: timestart,
          timeend: timeend,
          activityid: id,
        }
      })
      setConflicts(res.data)
    }
  }

  // When times change, look for conflicts
  useEffect(() => {
    getConflicts()
  }, [id, timestart, timeend])

  
  return (
    !!conflicts.length
    ? <div> 
        <Text fz="sm" mb="5px" fw={500} c="#212529">Conflicts</Text>
        <div className="flex">
          <Alert className={cn("p-0 m-0 inline-block shadow-none", status == statuses.approved ? "bg-gray-100" : "bg-[#f8d1b6]")} variant="light">
            <Button c="black" onClick={() => conflictsOpened ? hideConflicts() : showConflicts()} variant="transparent" className="px-3 font-normal" rightSection={conflictsOpened ? <IconChevronDown className="size-5"/> : <IconChevronRight className="size-5"/>}>
              {conflicts.length} {conflicts.length > 1 ? "overlap" : "time overlaps" } found
            </Button>
          </Alert>
          <Modal
            opened={conflictsOpened} 
            onClose={hideConflicts} 
            title="Conflicts" 
            size="xl"
            styles={{
              header: {
                borderBottom: '0.0625rem solid #dee2e6',
              },
              title: {
                fontWeight: 600,
              },
              body: {
                padding: 0,
              }
            }}
          >
            <div className="p-0 shadow-none rounded-none">
              <div>
                <Table>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Th>Title</Table.Th>
                      <Table.Th>Start</Table.Th>
                      <Table.Th>End</Table.Th>
                      <Table.Th>Location</Table.Th>
                      <Table.Th>Areas</Table.Th>
                      <Table.Th>Owner</Table.Th>
                    </Table.Tr>
                    {conflicts.map((conflict: any) => (
                      <Table.Tr key={conflict.activityid}>
                        <Table.Td><Anchor target="_blank" href={`/local/activities/${conflict.activityid}`}>{conflict.activityname}</Anchor></Table.Td>
                        <Table.Td>{conflict.timestart} <span className="text-xs">{conflict.datestart}</span></Table.Td>
                        <Table.Td>{conflict.timeend} <span className="text-xs">{conflict.dateend}</span></Table.Td>
                        <Table.Td>{conflict.location}</Table.Td>
                        <Table.Td>{conflict.areas && conflict.areas.join(', ')}</Table.Td>
                        <Table.Td><Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + conflict.owner.un} /></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            </div>
          </Modal>

        </div>
      </div>
    : null
  )
}

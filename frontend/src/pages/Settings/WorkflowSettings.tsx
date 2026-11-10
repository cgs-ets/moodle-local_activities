import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Loader,
  Table,
  Tabs,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconTrash, IconUser } from "@tabler/icons-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import useFetch from "../../hooks/useFetch";
import { StaffSelector } from "../Activity/components/StaffDetails/components/StaffSelector/StaffSelector";
import { User } from "../../types/types";

type Approver = {
  username: string,
  fn: string,
  ln: string,
  silent: boolean,
  exists: boolean,
}

type Step = {
  key: string,
  name: string,
  group: string,
  fromsqlproc: boolean,
  approvers: Approver[],
}

type WorkflowConfig = {
  hash: string,
  writable: boolean,
  steps: Step[],
}

const GROUP_ORDER = ['Senior School', 'Primary School', 'Whole School', 'Commercial', 'Co-curricular', 'Other']

// What the server compares: usernames, order and silent flags.
const signature = (step: Step) => JSON.stringify(step.approvers.map(a => [a.username, a.silent]))

export function WorkflowSettings() {
  document.title = 'Workflow Settings';

  const getApi = useFetch()
  const saveApi = useFetch()
  const [original, setOriginal] = useState<WorkflowConfig | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const applyConfig = (config: WorkflowConfig) => {
    setOriginal(config)
    setSteps(config.steps)
  }

  const load = async () => {
    setLoadError(null)
    try {
      const res = await getApi.call({ query: { methodname: 'local_activities-get_workflow_config' } })
      if (res.error) {
        setLoadError(res.exception?.message ?? "Error loading workflow config.")
        return
      }
      applyConfig(res.data)
    } catch (e) {
      setLoadError((e as Error)?.message ?? "Error loading workflow config.")
    }
  }

  useEffect(() => { load() }, [])

  const changedKeys = useMemo(() => {
    if (!original) return []
    const before = Object.fromEntries(original.steps.map(s => [s.key, signature(s)]))
    return steps.filter(s => before[s.key] !== signature(s)).map(s => s.key)
  }, [original, steps])

  const isDirty = changedKeys.length > 0

  useEffect(() => {
    if (!isDirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const updateStep = (key: string, fn: (approvers: Approver[]) => Approver[]) => {
    setSaved(false)
    setSteps(prev => prev.map(s => s.key === key ? { ...s, approvers: fn(s.approvers) } : s))
  }

  const addApprover = (key: string, user: User, silent: boolean) => {
    if (!user?.un) return
    updateStep(key, approvers => approvers.some(a => a.username === user.un)
      ? approvers
      : [...approvers, { username: user.un, fn: user.fn, ln: user.ln, silent, exists: true }]
    )
  }

  const removeApprover = (key: string, username: string) => {
    updateStep(key, approvers => approvers.length > 1 ? approvers.filter(a => a.username !== username) : approvers)
  }

  const toggleSilent = (key: string, username: string, silent: boolean) => {
    updateStep(key, approvers => approvers.map(a => a.username === username ? { ...a, silent } : a))
  }

  const discard = () => {
    if (original) setSteps(original.steps)
    setSaveError(null)
  }

  const save = async () => {
    if (!original || !isDirty) return
    setSaveError(null)
    setSaved(false)
    const payload = Object.fromEntries(
      steps.filter(s => changedKeys.includes(s.key))
        .map(s => [s.key, s.approvers.map(a => ({ username: a.username, silent: a.silent }))])
    )
    try {
      const res = await saveApi.call({
        method: 'POST',
        body: {
          methodname: 'local_activities-save_workflow_approvers',
          args: { hash: original.hash, steps: payload },
        },
      })
      if (res.error) {
        setSaveError(res.exception?.message ?? "Error saving workflow config.")
        return
      }
      applyConfig(res.data)
      setSaved(true)
    } catch (e) {
      setSaveError((e as Error)?.message ?? "Error saving workflow config.")
    }
  }

  const groups = GROUP_ORDER.filter(g => steps.some(s => s.group === g))

  return (
    <>
      <Header />
      <div className="page-wrapper" style={{ minHeight: 'calc(100vh - 154px)' }}>
        <Container size="lg" my="md" className="space-y-4">
          <Group justify="space-between" align="center" className="sticky top-0 z-10 py-2">
            <div>
              <Text fz="xl" fw={600}>Workflow Settings</Text>
              <Text fz="sm" c="dimmed">Add or remove approvers for each workflow step.</Text>
            </div>
            {original &&
              <Group gap="sm">
                {saved && !isDirty && <Group gap={4} c="green"><IconCheck size={16} /><Text fz="sm">Saved</Text></Group>}
                {isDirty && <Text fz="sm" c="dimmed">{changedKeys.length} step{changedKeys.length > 1 ? 's' : ''} changed</Text>}
                <Button variant="default" onClick={discard} disabled={!isDirty || saveApi.state.loading}>Discard</Button>
                <Button onClick={save} disabled={!isDirty || !original.writable} loading={saveApi.state.loading}>Save changes</Button>
              </Group>
            }
          </Group>

          {getApi.state.loading && !original && <Loader size="sm" />}

          {loadError &&
            <Alert color="red" icon={<IconAlertCircle />} title="Unable to load workflow settings">{loadError}</Alert>
          }

          {saveError &&
            <Alert color="red" icon={<IconAlertCircle />} title="Changes not saved" withCloseButton onClose={() => setSaveError(null)}>
              {saveError}
            </Alert>
          }

          {original && !original.writable &&
            <Alert color="orange" icon={<IconAlertCircle />}>
              config.php or the configs backup folder is not writable by the web server, so changes cannot be saved.
            </Alert>
          }

          {original &&
            <Tabs defaultValue={groups[0]} keepMounted={false}>
              <Tabs.List>
                {groups.map(g => {
                  const changed = steps.some(s => s.group === g && changedKeys.includes(s.key))
                  return <Tabs.Tab key={g} value={g}>{g}{changed ? ' •' : ''}</Tabs.Tab>
                })}
              </Tabs.List>
              {groups.map(g => (
                <Tabs.Panel key={g} value={g} pt="md" className="space-y-4">
                  {steps.filter(s => s.group === g).map(step => (
                    <StepCard
                      key={step.key}
                      step={step}
                      changed={changedKeys.includes(step.key)}
                      onAdd={(user, silent) => addApprover(step.key, user, silent)}
                      onRemove={(username) => removeApprover(step.key, username)}
                      onToggleSilent={(username, silent) => toggleSilent(step.key, username, silent)}
                    />
                  ))}
                </Tabs.Panel>
              ))}
            </Tabs>
          }
        </Container>
      </div>
      <Footer />
    </>
  );
}

type StepCardProps = {
  step: Step,
  changed: boolean,
  onAdd: (user: User, silent: boolean) => void,
  onRemove: (username: string) => void,
  onToggleSilent: (username: string, silent: boolean) => void,
}

function StepCard({ step, changed, onAdd, onRemove, onToggleSilent }: StepCardProps) {
  const [addSilent, setAddSilent] = useState(false)
  const onlyOne = step.approvers.length <= 1

  return (
    <Card withBorder radius="sm" p="md">
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <Text fw={600}>{step.name}</Text>
          <Badge variant="light" color="gray" className="normal-case">{step.key}</Badge>
          {changed && <Badge variant="light" color="orange">Unsaved</Badge>}
        </Group>
      </Group>

      {step.fromsqlproc
        ? <Text fz="sm" c="dimmed">Approvers for this step are resolved from Synergetic and cannot be edited here.</Text>
        : <>
            <Table verticalSpacing="xs" withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Approver</Table.Th>
                  <Table.Th>Username</Table.Th>
                  <Table.Th w={90}>
                    <Tooltip label="Silent approvers can approve, but are not listed as approvers or sent approval emails." multiline w={260} withArrow>
                      <span className="cursor-help underline decoration-dotted">Silent</span>
                    </Tooltip>
                  </Table.Th>
                  <Table.Th w={50}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {step.approvers.map(a => (
                  <Table.Tr key={a.username}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size={24} radius="xl" src={'/local/activities/avatar.php?username=' + a.username}><IconUser /></Avatar>
                        {a.exists
                          ? <Text fz="sm">{a.fn} {a.ln}</Text>
                          : <Badge color="red" variant="light">User not found</Badge>
                        }
                      </Group>
                    </Table.Td>
                    <Table.Td><Text fz="sm">{a.username}</Text></Table.Td>
                    <Table.Td>
                      <Checkbox checked={a.silent} onChange={(e) => onToggleSilent(a.username, e.currentTarget.checked)} />
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label={onlyOne ? "A step needs at least one approver" : "Remove"} withArrow>
                        <ActionIcon variant="subtle" color="red" disabled={onlyOne} onClick={() => onRemove(a.username)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Group align="flex-end" mt="sm" gap="md">
              <div className="flex-1 max-w-md">
                <StaffSelector
                  staff={[]}
                  setStaff={(users: User[]) => { if (users.length) onAdd(users[users.length - 1], addSilent) }}
                  label="Add approver"
                  multiple={false}
                  readOnly={false}
                />
              </div>
              <Checkbox mb={8} label="Add as silent" checked={addSilent} onChange={(e) => setAddSilent(e.currentTarget.checked)} />
            </Group>
          </>
      }
    </Card>
  );
}

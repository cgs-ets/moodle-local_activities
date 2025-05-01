import { Card, Flex, Text, Checkbox, NumberInput, Grid, Button, Group, Alert, Paper, Center, Tooltip, Popover } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconCopy, IconHelpHexagon, IconMail, IconQuestionMark } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useClipboard } from 'use-clipboard-copy';
import { useCallback, useEffect, useRef } from 'react';
import { getConfig, statuses } from '../../../../utils';
import { Form, useFormStore, defaults } from '../../../../stores/formStore';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useStateStore } from '../../../../stores/stateStore';


export function Permissions({openSendMessage} : {openSendMessage: () => void}) {

  const activityid = useFormStore((state) => state.id)
  const status = useFormStore((state) => state.status)
  const permissions = useFormStore((state) => state.permissions)
  const permissionslimit = useFormStore((state) => state.permissionslimit)
  const permissionsdueby = useFormStore((state) => state.permissionsdueby)
  const permissionsent = useFormStore((state) => state.permissionsent)
  const studentlist = useFormStore((state) => state.studentlist)
  const setState = useFormStore((state) => state.setState)
  const config = getConfig()
  const [openedPermissionsURL, togglePermissionsURL] = useDisclosure(false);
  const viewStateProps = useStateStore((state) => (state.viewStateProps))
  const timestart = useFormStore((state) => state.timestart);
  const manuallyEdited = useRef(false);

  const permissionsUrlClipboard = useClipboard({
    copiedTimeout: 1000,
  });

  const handleCopyLink = useCallback(
    (text: string) => {
      if (text.length) {
        permissionsUrlClipboard.copy(text)
      }
    },
    [permissionsUrlClipboard.copy]
  )

  const updateField = (name: string, value: any) => {
    setState({
      [name]: value
    } as Form)
  }

  const permissionsLabel = (
    <>
      <Text>Parent permissions required</Text> 
      { status < statuses.approved && 
        permissions &&
        <Text mt={3} size="xs" color="dimmed">You will be able to request permissions and track responses once the activity details are approved</Text>
      }
    </>
  )

  // Update permissionsdueby when timestart changes
  useEffect(() => {
    if (permissions && !manuallyEdited.current) {
      updateField('permissionsdueby', timestart.toString());
    }
  }, [timestart, permissions]);

  const tip = () => (
    <div>
      <p className="mb-4">Do not request parent permission unnecessarily. Bulk excursion permissions are obtained from parents annually.</p>

      <p className="mb-4">You only need to request parent permission for your excursion if it is:</p>

      <ul className="list-disc pl-4 mt-2">
        <li>International</li>
        <li>Overnight</li>
        <li>CGS Care, PreK or Pre S or</li>
        <li>Additional risks (such as swimming) have been identified</li>
      </ul>
    </div>
  )


  return (
    <>
      <Card withBorder radius="sm" className="p-0">

        <div className="px-4 py-3 flex items-center gap-4">
          <span className="text-base">Permissions</span>
          <Popover width={320} position="bottom" withArrow shadow="md">
            <Popover.Target>
              <div className="flex items-center gap-1 text-blue-600 cursor-pointer">
                <IconHelpHexagon className="size-5" />
                Do I need parent permission?
              </div>
            </Popover.Target>
            <Popover.Dropdown>
              {tip()}
            </Popover.Dropdown>
          </Popover>
        </div>

        <div className="p-4 border-t border-gray-300">
          <Flex direction="column" gap="lg" >
            <Checkbox
              label={permissionsLabel}
              checked={permissions}
              onChange={(e) => updateField('permissions', e.target.checked)}
              readOnly={viewStateProps.readOnly}
            />
          </Flex>
        </div>

        { 
          permissions &&
          <>
            <div className="p-4 border-t border-gray-300 flex gap-4">
              <NumberInput
                label="Capacity"
                description="0 means unlimited"
                min={0}
                value={permissionslimit}
                onChange={(e) => updateField('permissionslimit', e)}
                className='flex-1'
                readOnly={viewStateProps.readOnly}
              />
    
              <div className='flex-1'>
                <Text className="normal-case font-semibold text-black text-sm mb-1">Acceptance cut-off</Text>
                <Text className='text-xs text-gray-500 mb-1'>Responses will not be accepted after this time</Text>
                <DateTimePicker 
                  value={dayjs.unix(Number(permissionsdueby))}
                  onChange={(newValue) => {
                    manuallyEdited.current = true;
                    updateField('permissionsdueby', (newValue?.unix() ?? 0).toString());
                  }}
                  views={['day', 'month', 'year', 'hours', 'minutes']}
                  readOnly={viewStateProps.readOnly}
                />
              </div>
              
            </div>

            { permissions && status == statuses.approved && viewStateProps.editable &&
              <>
                
                <div className="p-4 border-t border-gray-300 flex justify-between">
                  {studentlist.length
                    ? <>
                        <Button size="compact-md" radius="xl" leftSection={<IconMail size={14} />} className="bg-tablr-blue" onClick={openSendMessage}>Send permission requests</Button>
                        <Button size="compact-md" onClick={togglePermissionsURL.toggle} radius="xl" className="bg-tablr-blue-light" variant="subtle" rightSection={openedPermissionsURL ? <IconChevronUp size={14}/> : <IconChevronDown size={14}/> }>Send manually</Button>
                      </>
                    : <div className='bg-yellow-100 px-1'>You must add students before you can finalise permission settings</div>
                  }
                </div>

                { openedPermissionsURL &&
                  <div className="p-4 border-t border-gray-300">
                    <Text mb="xs" fw={500}>
                      Direct parents to the following URL for permission registration: 
                    </Text>
                    <Paper 
                      className="break-all cursor-pointer transition-all"
                      p="sm"
                      radius="sm"
                      onMouseDown={() => {
                        handleCopyLink(`${config.wwwroot}/local/activities/${activityid}/permission`)
                      }}
                      bg={permissionsUrlClipboard.copied ? 'green.1' : 'blue.1'}
                    >
                      <Flex justify="space-between" align="center">
                        <Text size="ms" pr="xs" ff="monospace">{config.wwwroot}/local/activities/{activityid}/permission</Text>
                        <Button 
                          size="compact-md"
                          variant="outline" 
                          radius="xl" 
                          leftSection={<IconCopy size={14} />} 
                          className="bg-tablr-blue-light" 
                          w={120}
                        >{permissionsUrlClipboard.copied ? 'Copied!' : 'Copy URL'}</Button>
                      </Flex>
                    </Paper>
                  </div>
                }

                { !permissionsent &&
                  <div className="p-4 border-t border-gray-300 bg-[#ffe8cc]">
                    <Text className="text-md font-semibold text-black">Permission requests have not been sent yet!</Text>
                    <Text className="text-sm text-gray-500">You can send them now by clicking the button above.</Text>
                  </div>
                }


              </>
            }
          </>
        }


      </Card>


    </>
  );
};
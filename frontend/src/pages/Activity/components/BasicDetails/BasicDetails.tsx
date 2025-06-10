import { useEffect, useRef, useState } from "react";
import { TextInput, Text, SegmentedControl, Card, Button, Switch, Alert, Checkbox, Anchor, Tooltip, Notification, NotificationProps, rem, ActionIcon, CloseButton } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { Link as RouterLink } from 'react-router-dom';
import { useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { IconArrowNarrowRight, IconCheck, IconExternalLink, IconRefreshDot, IconUnlink, IconX } from "@tabler/icons-react";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Form, useFormStore, useFormValidationStore } from "../../../../stores/formStore";
import { useStateStore } from "../../../../stores/stateStore";
import { Link as NavLink } from "react-router-dom";
import { ConflictsInline } from "../Conflicts/ConflictsInline";
import { DatePickerInput } from "@mantine/dates";
import { RecurrenceModal } from "../../../../components/RecurrenceModal";
import useFetch from "../../../../hooks/useFetch";
import { OccurrenceModal } from "./OccurrenceModal";
import { keyframes } from '@emotion/react';


export function BasicDetails() {

  const formData = useFormStore()
  const description = useFormStore((state) => (state.description))
  const activitytype = useFormStore((state) => (state.activitytype))
  const setState = useFormStore(state => state.setState)
  const viewStateProps = useStateStore((state) => (state.viewStateProps))
  const savedtime = useStateStore((state) => (state.savedtime))
  const assessmentid = useFormStore((state) => state.assessmentid)
  const manuallyEdited = useRef(false);
  const [recurringModal, setRecurringModal] = useState(false);
  const recurrenceApi = useFetch()
  const [recurringDatesReadable, setRecurringDatesReadable] = useState<{start: string, end: string}[]>([])
  const [occurrenceModal, setOccurrenceModal] = useState<'delete' | 'detach' | null>(null);
  const [occurrence, setOccurrence] = useState<{start: string, end: string, id: number} | null>(null);
  const [notification, setNotification] = useState<NotificationProps | null>(null)

  const updateField = (name: string, value: any) => {
    if (viewStateProps.readOnly) {
      return
    }
    setState({
      [name]: value
    } as Form)
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
    ],
    content: formData.description,
    onBlur({ editor }) {
      updateField('description', editor.getHTML())
    },
    ...viewStateProps
  });

  // Need to programatically set content after fetch changes state.
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(description)
    }
  }, [editor, description])

  const errors = useFormValidationStore((state) => state.formErrors)

  // Update timeend and timestart when isallday changes
  useEffect(() => {
    let timeend = formData.timeend
    if (formData.timestart > formData.timeend) {
      timeend = Number(formData.timestart) + 3600 // Plus 1 hour
    }
    if (formData.isallday) {
      // Update timestart to selected date with time 00:00:00
      const timestartMs = formData.timestart * 1000
      const timeendMs = timeend * 1000
      updateField('timestart', dayjs(timestartMs ).startOf('day').unix());
      // Update timeend to selected date with time 23:59:59
      timeend = dayjs(timeendMs ).endOf('day').unix()
    }
    updateField('timeend', timeend);
  }, [formData.isallday, formData.timestart, formData.timeend]);

  const enableRecurring = async () => {
    setState({
      recurring: true
    } as Form)
    setRecurringModal(false)
    // Get the expanded dates.
    const fetchResponse = await recurrenceApi.call({
      query: {
        methodname: 'local_activities-expand_dates',
        recurrence: JSON.stringify(formData.recurrence),
        timestart: formData.timestart,
        timeend: formData.timeend,
      }
    })
    // if the response is an error, or if there are no dates, disable the recurring switch.
    if (fetchResponse.error || fetchResponse.data.datesReadable.length === 0) {
      setState({
        recurring: false
      } as Form)
    } else {
      setRecurringDatesReadable(fetchResponse.data.datesReadable)
    }
  }

  useEffect(() => {
    if (formData.recurring && !formData.id) {
      enableRecurring()
    }
    if (!formData.recurring) {
      setRecurringDatesReadable([])
    }
  }, [formData.recurring])

  useEffect(() => {
    if (savedtime) {
      const getSeries = async () => {
        const fetchResponse = await recurrenceApi.call({
          query: {
            methodname: 'local_activities-get_series',
            activityid: formData.id,
          }
        })
        updateField('occurrences', fetchResponse.data)
        setRecurringDatesReadable([])
      }
      getSeries()
    }
  }, [savedtime])

  const recurringChanged = () => {
    // The activity has been recurring, but the recurring switch has been turned off, or the dates have changed.
    if (formData.id && 
      (
        (formData.occurrences.datesReadable.length > 0 && !formData.recurring) || 
        (recurringDatesReadable.length > 0 && !arraysHaveSameElements(formData.occurrences.datesReadable, recurringDatesReadable))
      )
    ) {
      return true;
    } else {
      return false;
    }
  }

  const undoChanges = () => {
    if (recurringChanged()) {
      setState({
        recurring: true
      } as Form)
      setRecurringDatesReadable([])
    }
  }

  const arraysHaveSameElements = (arr1: {start: string, end: string}[], arr2: {start: string, end: string}[]) => {
    if (arr1.length !== arr2.length) return false;
  
    const serialize = (obj: {start: string, end: string}) => `${obj.start}-${obj.end}`;
  
    const set1 = new Set(arr1.map(serialize));
    const set2 = new Set(arr2.map(serialize));
  
    for (let val of set1) {
      if (!set2.has(val)) return false;
    }
  
    return true;
  }


  const deleteOrDetachOccurrence = async () => {
    setOccurrence(null)
    const response = await recurrenceApi.call({
      query: {
        methodname: 'local_activities-delete_or_detach_occurrence',
        type: occurrenceModal,
        activityid: formData.id,
        occurrenceid: occurrence?.id,
      }
    })
    if (response.data.new_activity_id) {
      setNotification({
        icon: <IconUnlink className="size-4" />,
        color: "teal",
        title: null,
        children: (
          <div className="flex gap-3 items-center">
            <a className="text-white font-semibold flex gap-1 items-center" href={'/local/activities/' + response.data.new_activity_id} target="_blank" rel="noreferrer">
              Click here to open the new activity <IconExternalLink className="size-3" />
            </a>
            <CloseButton icon={<IconX color="white" className="size-4" />}  variant="transparent" onClick={() => setNotification(null)} />
          </div>
        ),
      })
    }
    updateField('occurrences', response.data.series)
    setRecurringDatesReadable([])
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
      <Card withBorder className="overflow-visible rounded p-4 flex flex-col gap-6">

        <div className="flex flex-col gap-6">
          
          <div>
            <TextInput
              placeholder="Eg. The Great Book Swap"
              label="Activity name"
              value={formData.activityname}
              error={errors.activityname}
              onChange={(e) => updateField('activityname', e.target.value)}
              readOnly={viewStateProps.readOnly}
            />

            { assessmentid &&
              <div>
                <Button
                  color="dark" 
                  variant="light" 
                  aria-label="Filters" 
                  size="compact-sm" 
                  leftSection={<IconExternalLink size={15} />} 
                  className="h-7 mt-3"
                  component={RouterLink}                        
                  to={'/assessment/' + assessmentid}
                  target="_blank"
                  rel="noreferrer"
                >
                  Linked to assessment
                </Button>
              </div>
            }
          </div>

          <div>
            <Text fz="sm" mb="5px" fw={500} c="#212529">Type</Text>
            <div className="flex gap-4">
              <SegmentedControl
                color="blue"
                value={formData.activitytype}
                onChange={(value: string | null) => updateField('activitytype', value ?? '')}
                data={[
                  { value: 'excursion', label: 'Excursion' },
                  { value: 'incursion', label: 'Incursion' },
                  { value: 'calendar', label: 'Calendar entry' },
                  { value: 'commercial', label: 'Commercial' },
                ]}
                className="border"
                readOnly={viewStateProps.readOnly}
              />
              { !assessmentid && 
                <NavLink replace={false} to="/assessment" className="flex"><Text className="text-blue-500 text-sm flex items-center gap-1 flex-nowrap">Assessment <IconExternalLink className="size-4 stroke-1" /></Text></NavLink>
              }
            </div>
            <div className="pt-2 pl-1 text-sm">
              {formData.activitytype == "excursion" &&
                <span>Select this option if you need access to admin/budget approval, staffing list, student list, parent permissions, or risk assessment approval.</span>
              }
              {formData.activitytype == "incursion" &&
                <span>Select this option if you need access to admin/budget approval, staffing list, student list, parent permissions, or risk assessment approval.</span>
              }
              {formData.activitytype == "calendar" &&
                <span>Do not select this option if admin/budget approval, staffing list, student list, parent permissions, or risk assessment approval is required.</span>
              }
              {formData.activitytype == "commercial" &&
                <span>An external party is hiring CGS venues.</span>
              }
              {formData.activitytype == "assessment" &&
                <span>This entry is for assessment planning.</span>
              }
            </div>
          </div>

          <div>
            <Text fz="sm" mb="5px" fw={500} c="#212529">Campus Workflow</Text>
            <SegmentedControl
              color="blue"
              value={formData.campus}
              onChange={(value: string | null) => updateField('campus', value ?? '')}
              data={[
                { value: 'primary', label: 'Primary School' },
                { value: 'senior', label: 'Senior School' },
                { value: 'whole', label: 'Whole School' },
              ]}
              className="border"
              readOnly={viewStateProps.readOnly}
            />
          </div>
          
          {!formData.recurring && (
            <>
              <div className="flex flex-col gap-2">
                <Switch
                  checked={formData.isallday}
                  onChange={(event) => updateField('isallday', event.currentTarget.checked)}
                  label={<Text fz="sm" mb="5px" fw={500} c="#212529">All day</Text>}
                />
                {formData.isallday 
                ? <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div>
                      <DatePickerInput
                        value={dayjs.unix(Number(formData.timestart)).toDate()} // Convert to Date
                        dropdownType="modal"
                        label="Start date"
                        placeholder="Start date"
                        onChange={(newValue) => {
                          // Convert Date back to Unix timestamp string
                          updateField('timestart', newValue ? dayjs(newValue).unix().toString() : "0");
                        }}
                        readOnly={viewStateProps.readOnly}
                      />
                    </div>
                    <div className="hidden sm:block">
                      <span>&nbsp;</span>
                      <IconArrowNarrowRight className="size-4" />
                    </div>
                    <div>
                      <DatePickerInput
                        value={dayjs.unix(Number(formData.timeend)).toDate()} // Convert to Date
                        dropdownType="modal"
                        label="End date"
                        placeholder="End date"
                        onChange={(newValue) => {
                          // Convert Date back to Unix timestamp string
                          updateField('timeend', newValue ? dayjs(newValue).unix().toString() : "0");
                        }}
                        readOnly={viewStateProps.readOnly}
                      />
                    </div>
                  </div>
                : <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div>
                      <Text fz="sm" mb="5px" fw={500} c="#212529">Start time</Text>
                      <DateTimePicker 
                        value={dayjs.unix(Number(formData.timestart))}
                        onChange={(newValue) => updateField('timestart', (newValue?.unix() ?? 0).toString())}
                        views={['day', 'month', 'year', 'hours', 'minutes']}
                        slotProps={{
                          textField: {
                            error: !!errors.timestart,
                          },
                        }}
                        readOnly={viewStateProps.readOnly}
                      />
                    </div>
                    <div className="hidden sm:block">
                      <span>&nbsp;</span>
                      <IconArrowNarrowRight className="size-4" />
                    </div>
                    <div>
                      <Text fz="sm" mb="5px" fw={500} c="#212529">End time</Text>
                      <DateTimePicker 
                        value={dayjs.unix(Number(formData.timeend))}
                        onChange={(newValue) => {
                          manuallyEdited.current = true;
                          updateField('timeend', (newValue?.unix() ?? 0).toString());
                        }}
                        views={['day', 'month', 'year', 'hours', 'minutes']}
                        slotProps={{
                          textField: {
                            error: !!errors.timestart,
                          },
                        }}
                        readOnly={viewStateProps.readOnly}
                      />
                    </div>
                    <div className="hidden sm:block">
                      <span>&nbsp;</span>
                    </div>
                  </div>
                }
                {errors.timestart ? <div className="text-red-600 text-sm mt-1">{errors.timestart}</div> : null}
              </div>
            </>
          )}


          <div>
            {formData.recurring
              ? <>
                  <div className="mb-2">
                    { formData.isallday
                      ?
                        <div className='flex gap-4 items-center'>
                          <Text className="font-semibold">All day</Text>
                        </div>
                      :
                        <div className='flex gap-4 items-center'>
                          <Text className="font-semibold">{dayjs.unix(formData.timestart).format('HH:mm')}</Text>
                          <Text>to</Text>
                          <Text className="font-semibold">{dayjs.unix(formData.timeend).format('HH:mm')}</Text>
                        </div>
                    }
                  </div>
                  <div className="flex gap-4 items-center">
                    <Switch
                      checked={formData.recurring}
                      onChange={(event) => updateField('recurring', event.currentTarget.checked)}
                      label={<Text fz="sm" fw={500} c="#212529">Recurring</Text>}
                    />
                    {!viewStateProps.readOnly && <Button className="rounded-full" variant="light" color="blue" size="compact-sm" leftSection={<IconRefreshDot size={15} />} onClick={() => setRecurringModal(true)}>Edit Recurrence</Button>}
                  </div>

                  { recurringChanged() 
                    ? <div className="mt-2">
                        <span className="text-sm font-semibold">The following dates will be created:</span>
                        <div className="flex flex-col">
                          {recurringDatesReadable.map((date) => (
                            <div key={date.start}>
                              {date.start} - {date.end}
                            </div>
                          ))}
                        </div>
                      </div>
                    : formData.occurrences.datesReadable.length > 0
                      ? <div className="mt-2">
                          <span className="text-sm font-semibold">Dates:</span>
                          <div className="flex flex-col">
                            {formData.occurrences.datesReadable.map((date) => (
                              <div key={date.start} className="flex gap-2 items-center">
                                <div>{date.start} - {date.end}</div>
                                <Tooltip label="Detach" withArrow>
                                  <Anchor onClick={() => {setOccurrence(date); setOccurrenceModal('detach')}} className="text-sm inline-flex gap-1">
                                    <IconUnlink className="size-4 stroke-1" />
                                  </Anchor>
                                </Tooltip>
                                <Tooltip label="Delete" withArrow>
                                  <Anchor onClick={() => {setOccurrence(date); setOccurrenceModal('delete')}} className="text-sm inline-flex gap-1">
                                    <IconX className="size-4 stroke-1" />
                                  </Anchor>
                                </Tooltip>
                              </div>
                            ))}
                          </div>
                        </div>
                      : null
                  }
                </>
              : viewStateProps.editable
                ? <Button className="rounded-full" variant="light" color="blue" size="compact-sm" leftSection={<IconRefreshDot size={15} />} onClick={() => setRecurringModal(true)}>Recurrence</Button>
                : <Switch
                    checked={false}
                    label={<Text fz="sm" fw={500} c="#212529">Recurring</Text>}
                    readOnly={true}
                  />
            }
          </div>

          {recurringChanged() &&
            <Alert color="red" variant="light">
              <div className="flex flex-col gap-2">
                <span>The recurrence settings have changed. Existing dates will be deleted and new dates will be created. Please accept the changes, or undo them.</span>
                <div className="flex justify-between items-center">
                  <Checkbox label="Accept changes" checked={formData.recurringAcceptChanges} onChange={(event) => updateField('recurringAcceptChanges', event.currentTarget.checked)} />
                  <Button className="rounded-full" variant="light" color="blue" size="compact-sm" onClick={undoChanges}>
                    Undo changes
                  </Button>
                </div>
              </div>
            </Alert>
          }
          

          <ConflictsInline />


          <div>
            <Text fz="sm" fw={500} c="#212529">Location</Text>
            <Text className="text-sm mb-1 text-gray-500">Include the contact person at the venue (optional).</Text>
            <TextInput
              placeholder="Snow Concert Hall"
              label=""
              value={formData.location}
              error={errors.Location}
              onChange={(e) => updateField('location', e.target.value)}
              readOnly={viewStateProps.readOnly}
            />
          </div>

          <div>
            <Text fz="sm" fw={500} c="#212529">Event description</Text>
            <Text className="text-sm mb-1 text-gray-500">Information placed here will flow through to the staff and public calendars, please include a brief description, who is attending or is required to attend.</Text>
            <RichTextEditor 
              editor={editor}
              classNames={{content: 'break-all'}}
              >
                {viewStateProps.editable &&
                  <RichTextEditor.Toolbar sticky className="ml-[1px]">
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Bold />
                      <RichTextEditor.Italic />
                      <RichTextEditor.Strikethrough />
                      <RichTextEditor.ClearFormatting />
                      <RichTextEditor.Code />
                    </RichTextEditor.ControlsGroup>
      
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.H1 />
                      <RichTextEditor.H2 />
                      <RichTextEditor.H3 />
                      <RichTextEditor.H4 />
                    </RichTextEditor.ControlsGroup>
      
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Blockquote />
                      <RichTextEditor.Hr />
                      <RichTextEditor.BulletList />
                      <RichTextEditor.OrderedList />
                    </RichTextEditor.ControlsGroup>
      
                    <RichTextEditor.ControlsGroup>
                      <RichTextEditor.Link />
                      <RichTextEditor.Unlink />
                    </RichTextEditor.ControlsGroup>
                  </RichTextEditor.Toolbar>
                }
            

              <RichTextEditor.Content />
            </RichTextEditor>
          </div>

          {(activitytype == 'excursion' || activitytype == 'incursion') &&
            <>
              <div>
                <TextInput
                  placeholder="E.g. walking, bus, taxi, including authorised driver."
                  label="Transport"
                  value={formData.transport}
                  onChange={(e) => updateField('transport', e.target.value)}
                  readOnly={viewStateProps.readOnly}
                />
              </div>

              <div>
                <TextInput
                  label="Cost for student"
                  value={formData.cost}
                  onChange={(e) => updateField('cost', e.target.value)}
                  readOnly={viewStateProps.readOnly}
                />
              </div>
            </>
          }


        </div>
      </Card>
      
      <RecurrenceModal opened={recurringModal} close={() => setRecurringModal(false)} enable={enableRecurring} timestart={formData.isallday ? -1 : formData.timestart} timeend={formData.isallday ? -1 : formData.timeend} />
    
      <OccurrenceModal opened={!!occurrence} close={() => setOccurrence(null)} occurrence={occurrence} type={occurrenceModal} submit={deleteOrDetachOccurrence} />

      {notification && (
        <Notification
          {...notification}
          withCloseButton={false}
          className="fixed bottom-0 right-0 m-4 z-50"
          variant="filled"
          bg="dark"
          styles={{
            body: {
              margin: '0',
            },
          }}
          style={{
            position: 'fixed',
            bottom: rem(16),
            right: rem(16),
            animation: notification ? `${slideIn} 300ms ease-out` : undefined,
          }}
        />
      )}
    </>
  );
};
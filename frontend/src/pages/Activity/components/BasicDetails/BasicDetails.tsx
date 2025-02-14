import { useEffect } from "react";
import { TextInput, Text, SegmentedControl, Card, Anchor, Alert, Button } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { Link as RouterLink } from 'react-router-dom';
import { useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { IconArrowNarrowRight, IconExternalLink } from "@tabler/icons-react";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Form, useFormStore, useFormValidationStore } from "../../../../stores/formStore";
import { useDisclosure } from "@mantine/hooks";
import { Conflicts } from "../Conflicts/Conflicts";
import { isActivity } from "../../../../utils/utils";
import { useStateStore } from "../../../../stores/stateStore";
import { Link as NavLink } from "react-router-dom";
import { ConflictsInline } from "../Conflicts/ConflictsInline";


export function BasicDetails() {

  const formData = useFormStore()
  const description = useFormStore((state) => (state.description))
  const activitytype = useFormStore((state) => (state.activitytype))
  const setState = useFormStore(state => state.setState)
  const viewStateProps = useStateStore((state) => (state.viewStateProps))
  const assessmentid = useFormStore((state) => state.assessmentid)

  const updateField = (name: string, value: any) => {
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


  return (
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
        

        <div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
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
                onChange={(newValue) => updateField('timeend', (newValue?.unix() ?? 0).toString())}
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
            <ConflictsInline />
          </div>
          {errors.timestart ? <div className="text-red-600 text-sm mt-1">{errors.timestart}</div> : null}

          
        </div>

        

        <div>
          <TextInput
            placeholder="Snow Concert Hall"
            label="Location"
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
            >
              {viewStateProps.editable &&
                <RichTextEditor.Toolbar sticky>
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
  );
};
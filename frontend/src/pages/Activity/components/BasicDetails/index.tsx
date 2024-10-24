import { useEffect } from "react";
import { TextInput, Text, SegmentedControl, Card } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { IconArrowNarrowRight } from "@tabler/icons-react";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Form, useFormStore, useFormValidationStore } from "../../../../stores/formStore";
import { useDisclosure } from "@mantine/hooks";
import { CategoriesModal } from "../Modals/CategoriesModal";
import { Conflicts } from "../Conflicts/Conflicts";

export function BasicDetails() {

  const formData = useFormStore()
  const description = useFormStore((state) => (state.description))
  const setState = useFormStore(state => state.setState)
  const [catsModalOpened, {close: closeCatsModal}] = useDisclosure(false);

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
  });

  // Need to programatically set content after fetch changes state.
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(description)
    }
  }, [editor, description])

  const errors = useFormValidationStore((state) => state.formErrors)

  const handleCatsChange = (cats: string[]) => {
    const sorted = cats.sort()
    updateField('categories', sorted)
  }

  

  return (
    <Card withBorder className="overflow-visible rounded p-4 flex flex-col gap-6">

      <div className="flex flex-col gap-6">
          
        <TextInput
          withAsterisk
          placeholder="Eg. The Great Book Swap"
          label="Activity name"
          value={formData.activityname}
          error={errors.activityname}
          onChange={(e) => updateField('activityname', e.target.value)}
        />

        <div>
          <Text fz="sm" mb="5px" fw={500} c="#212529">Type</Text>
          <SegmentedControl
            color="blue"
            value={formData.activitytype}
            onChange={(value: string | null) => updateField('activitytype', value ?? '')}
            data={[
              { value: 'excursion', label: 'Excursion' },
              { value: 'incursion', label: 'Incursion' },
              { value: 'calendar', label: 'Calendar entry' },
              { value: 'assessment', label: 'Assessment' },
            ]}
          />
          <div className="pt-2 pl-1 text-sm">
            {formData.activitytype == "excursion" &&
              <span>This activity is taking place off campus.</span>
            }
            {formData.activitytype == "incursion" &&
              <span>This activity is taking place on campus.</span>
            }
            {formData.activitytype == "calendar" &&
              <span>Do not select this option if admin/budget approval, staffing list, student list, parent permissions, or risk assessment approval is required.</span>
            }
            {formData.activitytype == "assessment" &&
              <span>This entry is for assessment planning.</span>
            }
          </div>
        </div>

        <div>
          <Text fz="sm" mb="5px" fw={500} c="#212529">Campus</Text>
          <SegmentedControl
            color="blue"
            value={formData.campus}
            onChange={(value: string | null) => updateField('campus', value ?? '')}
            data={[
              { value: 'primary', label: 'Primary School' },
              { value: 'senior', label: 'Senior School' },
              { value: 'whole', label: 'Whole School' },
            ]}
          />
        </div>
        

        <div>

          <div className="flex gap-4 items-center">
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
              />
            </div>
            <div>
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
              />
            </div>
          </div>
          {errors.timestart ? <div className="text-red-600 text-sm mt-1">{errors.timestart}</div> : null}

          {false && <Conflicts />}
          
        </div>

        

        <div>
          <TextInput
            withAsterisk
            placeholder="Snow Concert Hall"
            label="Location"
            value={formData.location}
            error={errors.Location}
            onChange={(e) => updateField('location', e.target.value)}
          />
          <div className="mt-1 text-sm text-gray-500">You are responsible for booking arrangements. For internal bookings use SOBS.</div>
        </div>

        <div>
          <Text fz="sm" fw={500} c="#212529">Event description</Text>
          <Text className="text-sm mb-1 text-gray-500">Information placed here will flow through to the staff and public calendars, please include a brief description, who is attending or is required to attend.</Text>
          <RichTextEditor 
            editor={editor}
            >
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

            <RichTextEditor.Content />
          </RichTextEditor>
        </div>

        <CategoriesModal categories={formData.categories} opened={catsModalOpened} close={closeCatsModal} handleChange={handleCatsChange} />

      </div>
    </Card>
  );
};
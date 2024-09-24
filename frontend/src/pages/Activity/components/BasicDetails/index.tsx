import { useEffect } from "react";
import { TextInput, Text, Button, Radio, Checkbox, Select, ComboboxItem } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { IconArrowRight, IconEdit } from "@tabler/icons-react";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Form, useFormStore, useFormValidationStore } from "../../../../stores/formStore";

export function BasicDetails() {

  const formData = useFormStore()
  const description = useFormStore((state) => (state.description))
  const setState = useFormStore(state => state.setState)

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


  return (
    <div className="flex flex-col gap-6">
        
      <TextInput
        withAsterisk
        placeholder="Eg. The Great Book Swap"
        label="Activity name"
        value={formData.activityname}
        error={errors.activityname}
        onChange={(e) => updateField('activityname', e.target.value)}
      />
      <div className="flex gap-4 items-center">
        <Select
          label="Type"
          data={[
            { value: 'excursion', label: 'Excursion' },
            { value: 'incursion', label: 'Incursion' },
            { value: 'assessment', label: 'Assessment' },
          ]}
          value={formData.activitytype ? formData.activitytype : null}
          error={errors.activitytype}
          onChange={(value: string | null) => updateField('activitytype', value ?? '')}
          allowDeselect={false}
          className="flex-1"
        />
        <Select
          label="Campus"
          data={[
            { value: 'primary', label: 'Primary School' },
            { value: 'senior', label: 'Senior School' },
            { value: 'whole', label: 'Whole School' },
          ]}
          value={formData.campus}
          error={errors.campus}
          onChange={(value: string | null) => updateField('campus', value ?? '')}
          allowDeselect={false}
          className="flex-1"
        />
      </div>

      <div className="hidden">
       <Radio.Group
          name="activitytype"
          label="Type"
          withAsterisk
          value={formData.activitytype}
          error={errors.activitytype}
          onChange={(value) => updateField('activitytype', value)}
        >
          <div className="flex gap-4">
            <Radio value="excursion" label="Excursion" />
            <Radio value="incursion" label="Incursion" />
            <Radio value="assessment" label="Assessment" />
          </div>
        </Radio.Group>
        <Radio.Group
          name="campus"
          label="Campus"
          withAsterisk
          value={formData.campus}
          error={errors.campus}
          onChange={(value) => updateField('campus', value)}
        >
          <div className="flex gap-4">
            <Radio value="primary" label="Primary School" />
            <Radio value="senior" label="Senior School" />
            <Radio value="whole" label="Whole School" />
          </div>
        </Radio.Group>
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
      

      <div className="flex gap-4 items-center">
        <div>
          <Text fz="sm" mb="5px" fw={500} c="#212529">Start time</Text>
          <DateTimePicker 
            value={dayjs.unix(Number(formData.timestart))}
            onChange={(newValue) => updateField('timestart', (newValue?.unix() ?? 0).toString())}
            views={['day', 'month', 'year', 'hours', 'minutes']}
          />
        </div>
        <div>
          <span>&nbsp;</span>
          <IconArrowRight />
        </div>
        <div>
        <Text fz="sm" mb="5px" fw={500} c="#212529">End time</Text>
          <DateTimePicker 
            value={dayjs.unix(Number(formData.timeend))}
            onChange={(newValue) => updateField('timeend', (newValue?.unix() ?? 0).toString())}
            views={['day', 'month', 'year', 'hours', 'minutes']}
          />
        </div>
      </div>

      <div>
        <Text fz="sm" mb="5px" fw={500} c="#212529">Outlook categories</Text>
        <Button size="compact-md" className="rounded-full" variant="light" rightSection={<IconEdit className="size-5" />}>Select</Button>
      </div>

      <div>
        <Text fz="sm" mb="5px" fw={500} c="#212529">Display this event on the <a href="https://calendar.cgs.act.edu.au/" target="_blank" className="underline">public calendar</a>?</Text>
        <Checkbox
          checked={formData.displaypublic}
          onChange={(event) => updateField('displaypublic', event.currentTarget.checked)}
        />
      </div>

      <div>
        <Text fz="sm" fw={500} c="#212529">Description</Text>
        <Text className="text-sm mb-1 text-gray-500">Information placed here will flow through to the staff and public calendars, please include a brief description, who is attending or is required to attend</Text>
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

    </div>

  );
};
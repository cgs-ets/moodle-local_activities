import { useEffect } from "react";
import { TextInput, Text, Button, Radio } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { BasicDetails as BasicDetailsType, useBasicDetailsStore, useFormValidationStore } from '../../store/formFieldsStore'
import { IconArrowRight, IconEdit } from "@tabler/icons-react";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { TextField } from "@mui/material";

export function BasicDetails() {

  const basicDetails = useBasicDetailsStore()
  const initDescription = useBasicDetailsStore((state) => (state.initDescription))

  const setState = useBasicDetailsStore(state => state.setState)
  const updateField = (name: string, value: string) => {
    setState({
      [name]: value
    } as  BasicDetailsType)
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
    ],
    content: basicDetails.details,
    onBlur({ editor, event }) {
      updateField('details', editor.getHTML())
    },
  });

  // Need to programatically set content after fetch changes state.
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(initDescription)
    }
  }, [editor, initDescription])

  const errors = useFormValidationStore((state) => state.formErrors)


  return (
    <div className="flex flex-col gap-6">
        
      <TextInput
        withAsterisk
        placeholder="Eg. The Great Book Swap"
        label="Activity name"
        value={basicDetails.activityname}
        error={errors.activityname}
        onChange={(e) => updateField('activityname', e.target.value)}
      />

      <div>
        <Radio.Group
          name="type"
          label="Type"
          withAsterisk
          value={basicDetails.activitytype}
          error={errors.activitytype}
          onChange={(value) => updateField('activitytype', value)}
        >
          <div className="flex gap-4">
            <Radio value="excursion" label="Off campus" />
            <Radio value="incursion" label="On campus" />
          </div>
        </Radio.Group>
      </div>

      <div>
        <Radio.Group
          name="campus"
          label="Campus"
          withAsterisk
          value={basicDetails.activitytype}
          error={errors.activitytype}
          onChange={(value) => updateField('activitytype', value)}
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
          value={basicDetails.activityname}
          error={errors.activityname}
          onChange={(e) => updateField('location', e.target.value)}
        />
        <div className="mt-1 text-sm text-gray-500">You are responsible for booking arrangements. For internal bookings use SOBS.</div>
      </div>
      

      <div>
        <Text fz="sm" mb="5px" fw={500} c="#212529">Category</Text>
        <Button variant="light" rightSection={<IconEdit size={12} />}>
          {basicDetails.categoryName ? basicDetails.categoryName : "Select"}
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div>
          <Text fz="sm" mb="5px" fw={500} c="#212529">Start time</Text>
          <DateTimePicker 
            value={dayjs.unix(Number(basicDetails.timestart))}
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
            value={dayjs.unix(Number(basicDetails.timestart))}
            onChange={(newValue) => updateField('timestart', (newValue?.unix() ?? 0).toString())}
            views={['day', 'month', 'year', 'hours', 'minutes']}
          />
        </div>
      </div>
      
      <div>
        <Text fz="sm" mb="5px" fw={500} c="#212529">Description</Text>
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
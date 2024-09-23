import { useEffect } from "react";
import { TextInput, Text, Card, Grid, Button } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { BasicDetails as BasicDetailsType, useBasicDetailsStore, useFormValidationStore } from '../../store/formFieldsStore'
import { useFormMetaStore } from "../../store/formMetaStore";
import { IconEdit } from "@tabler/icons-react";

export function BasicDetails() {

  const basicDetails = useBasicDetailsStore()
  const initDescription = useBasicDetailsStore((state) => (state.initDescription))
  const id = useFormMetaStore((state) => (state.id))

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
    <>
        <Card.Section inheritPadding pb="sm">
          <Grid gutter="lg">
            <Grid.Col span={12}>
              <TextInput
                withAsterisk
                placeholder="Eg. Basketball 9A"
                label="Activity name"
                value={basicDetails.activityname}
                error={errors.activityname}
                onChange={(e) => updateField('activityname', e.target.value)}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Text fz="sm" mb="5px" fw={500} c="#212529">Category</Text>
              <Button variant="light" rightSection={<IconEdit size={12} />}>
                {basicDetails.categoryName ? basicDetails.categoryName : "Select"}
              </Button>
            </Grid.Col>

            <Grid.Col span={12}>
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
            </Grid.Col>

 
          </Grid>
        </Card.Section>
    </>
  );
};
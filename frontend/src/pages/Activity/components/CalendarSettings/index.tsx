import { Text, Button, Switch, Card } from '@mantine/core';
import { IconEdit, IconExternalLink, IconInfoCircle, IconInfoCircleFilled, IconInfoSmall, IconQuestionMark } from "@tabler/icons-react";
import { Form, useFormStore } from "../../../../stores/formStore";
import { useDisclosure } from "@mantine/hooks";
import { CategoriesModal } from "../Modals/CategoriesModal";

export function CalendarSettings() {

  const formData = useFormStore()
  const setState = useFormStore(state => state.setState)
  const [catsModalOpened, {open: openCatsModal, close: closeCatsModal}] = useDisclosure(false);

  const updateField = (name: string, value: any) => {
    setState({
      [name]: value
    } as Form)
  }

  const handleCatsChange = (cats: string[]) => {
    const sorted = cats.sort()
    updateField('categories', sorted)
  }

  return (
    <Card withBorder radius="sm" className="p-0">
      <div className="px-4 py-3">
        <Text fz="md">Calendar Settings</Text>
      </div>
      <div className="flex flex-col gap-6 border-t border-gray-300">
        <div className="flex flex-col">
          <div className="p-4">
            { formData.categories.length
              ? <div>{formData.categories.map(cat => (<div key={cat}>{cat.replace('/', ' > ')}</div>))}</div>
              : <div>Categories</div>
            }
            <Button onClick={openCatsModal} size="compact-md" className="rounded-md mt-2" variant="light" rightSection={<IconEdit className="size-5" />}>{formData.categories.length ? "Change" : "Select"}</Button>
          </div>
          <div className="flex p-4 border-t">
            <Switch
              checked={formData.displaypublic}
              onChange={(event) => updateField('displaypublic', event.currentTarget.checked)}
              label={<span>Display event on the <a href="https://calendar.cgs.act.edu.au/" target="_blank" className="underline">public calendar<IconExternalLink className="inline size-4 stroke-1" /></a></span>}
            />
          </div>
        </div>
        <CategoriesModal categories={formData.categories} opened={catsModalOpened} close={closeCatsModal} handleChange={handleCatsChange} />
      </div>
    </Card>
  );
};
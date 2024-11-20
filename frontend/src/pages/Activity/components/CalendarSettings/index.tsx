import { Text, Button, Switch, Card, Select } from '@mantine/core';
import { IconEdit, IconExternalLink, IconInfoCircle, IconInfoCircleFilled, IconInfoSmall, IconQuestionMark } from "@tabler/icons-react";
import { Form, useFormStore } from "../../../../stores/formStore";
import { useDisclosure } from "@mantine/hooks";
import { CategoriesModal } from "../Modals/CategoriesModal";

export function CalendarSettings() {

  const setState = useFormStore(state => state.setState)
  const categories = useFormStore(state => state.categories)
  const displaypublic = useFormStore(state => state.displaypublic)
  const colourcategory = useFormStore(state => state.colourcategory)
  const [catsModalOpened, {open: openCatsModal, close: closeCatsModal}] = useDisclosure(false);

  const updateField = (name: string, value: any) => {
    setState({
      [name]: value
    } as Form)
  }

  const handleCatsChange = (cats: string[]) => {
    const sorted = cats.sort()
    updateField('categories', sorted)
    if ((!colourcategory || !sorted.includes(colourcategory)) && sorted.length) {
      updateField('colourcategory', sorted[0])
    }
  }

  return (
    <Card withBorder radius="sm" className="p-0">
      <div className="px-4 py-3">
        <span className="text-base">Calendar Settings</span>
      </div>
      <div className="flex flex-col gap-6 border-t border-gray-300">
        <div className="flex flex-col">
          <div className="p-4 relative">
            { categories.length
              ? <div>{categories.map(cat => (<div key={cat}>{cat.replace('/', ' > ')}</div>))}</div>
              : <div>Categories</div>
            }
            <Button onClick={openCatsModal} size="compact-md" className="rounded-full mt-2" variant="light" rightSection={<IconEdit className="size-5" />}>{categories.length ? "Change" : "Select"}</Button>
          </div>

          {categories.length > 1 
            ? <div className="p-4 border-t">
                <Text className='text-sm font-semibold mb-1'>Select the colouring category</Text>
                <Select 
                  data={categories}
                  value={colourcategory} 
                  onChange={(value) => value && updateField('colourcategory', value)}
                  className='w-full max-w-96'
                />
              </div>
            : null
          }
          
          <div className="flex p-4 border-t">
            <Switch
              checked={displaypublic}
              onChange={(event) => updateField('displaypublic', event.currentTarget.checked)}
              label={<span>Display event on the <a href="https://calendar.cgs.act.edu.au/" target="_blank" className="underline">public calendar<IconExternalLink className="inline size-4 stroke-1" /></a></span>}
            />
          </div>


        </div>
        <CategoriesModal categories={categories} opened={catsModalOpened} close={closeCatsModal} handleChange={handleCatsChange} />
      </div>
    </Card>
  );
};
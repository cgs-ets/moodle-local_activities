
import { Button, Checkbox, Group, Modal, NumberInput, Select, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useFormStore } from '../stores/formStore';
import { IconCheck, IconX } from '@tabler/icons-react';
type Props = {
  opened: boolean;
  close: () => void;
  enable: () => void;
}

export function RecurrenceModal({opened, enable, close}: Props) {
  const recurrence = useFormStore((state) => state.recurrence);
  const setRecurrence = useFormStore((state) => state.setRecurrence);

  return (
    <>
      <Modal.Root 
        opened={opened} 
        onClose={() => {
          close()
        }} 
        size="xl"
        styles={{
          content: {
            marginTop: '40px',
          },
        }}
      >
        <Modal.Overlay />
        <Modal.Content pos="relative" mih={200}>
          <>
            <Modal.Header>
              <Modal.Title>
                <div className='flex items-center gap-4'>
                  <Text fz="xl" fw={600} className="first-letter:uppercase">Recurrence</Text>
                </div>
              </Modal.Title>
              <Modal.CloseButton mt={-15} />
            </Modal.Header>
            <Modal.Body className='flex flex-col gap-4 p-0'>



              <div className='flex flex-col gap-2 border-t p-4'>
                <strong>Pattern</strong>

                <div className='flex gap-6 items-start'>

                  <Select
                    data={["Daily", "Weekly", "Monthly", "Yearly"]}
                    value={recurrence.pattern}
                    onChange={(value) => setRecurrence({...recurrence, pattern: value || ""})}
                  />

                  {recurrence.pattern === "Daily" && (
                    <>
                      <Select
                        name="dailyPattern"
                        data={["Every", "Every weekday"]}
                        value={recurrence.dailyPattern}
                        onChange={(value) => setRecurrence({...recurrence, dailyPattern: value || ""})}
                        className='w-44'
                      />

                      {recurrence.dailyPattern === "Every" && (
                        <div className='flex gap-4 items-center'>
                          <NumberInput
                            value={recurrence.dailyInterval}
                            onChange={(value) => setRecurrence({...recurrence, dailyInterval: Number(value) || 0})}
                            className='w-24'
                          />
                          <Text>day(s)</Text>
                        </div>
                      )}
                    </>
                  )}



                  {recurrence.pattern === "Weekly" && (
                    <div className='flex flex-col gap-2'>
                      <div className='flex gap-4 items-center'>
                        Recur every 
                        <NumberInput
                          value={recurrence.weeklyInterval}
                          onChange={(value) => setRecurrence({...recurrence, weeklyInterval: Number(value) || 0})}
                          className='w-24'
                        />
                        <Text>week(s) on:</Text>
                      </div>

                      <Checkbox.Group
                        defaultValue={recurrence.weeklyDays}
                        onChange={(value) => setRecurrence({...recurrence, weeklyDays: value || []})}
                      >
                        <Group mt="xs">
                          <Checkbox value="Monday" label="Monday" />
                          <Checkbox value="Tuesday" label="Tuesday" />
                          <Checkbox value="Wednesday" label="Wednesday" />
                          <Checkbox value="Thursday" label="Thursday" />
                          <Checkbox value="Friday" label="Friday" />
                          <Checkbox value="Saturday" label="Saturday" />
                          <Checkbox value="Sunday" label="Sunday" />
                        </Group>
                      </Checkbox.Group>
                    </div>
                  )}



                  {recurrence.pattern === "Monthly" && (
                    <div className='flex flex-col gap-2'>
                      
                      <div className='flex gap-4 items-center'>
                        <Select
                          name="monthlyPattern"
                          data={["Day", "The"]}
                          value={recurrence.monthlyPattern}
                          onChange={(value) => setRecurrence({...recurrence, monthlyPattern: value || ""})}
                          className='w-32'
                        />
                      </div>

                      {recurrence.monthlyPattern === "Day" && (
                        <div className='flex gap-4 items-center'>
                          <NumberInput
                            value={recurrence.monthlyDay}
                            onChange={(value) => setRecurrence({...recurrence, monthlyDay: Number(value) || 0})}
                            className='w-24'
                          />
                          <Text>of every</Text>
                          <NumberInput
                            value={recurrence.monthlyInterval}
                            onChange={(value) => setRecurrence({...recurrence, monthlyInterval: Number(value) || 0})}
                            className='w-24'
                          />
                          <Text>month(s)</Text>
                        </div>
                      )}

                      {recurrence.monthlyPattern === "The" && (
                        <>
                          <div className='flex gap-4 items-center'>
                            <Select
                              name="monthlyNth"
                              data={["First", "Second", "Third", "Fourth", "Last"]}
                              value={recurrence.monthlyNth}
                              onChange={(value) => setRecurrence({...recurrence, monthlyNth: value || ""})}
                            />
                            <Select
                              name="monthlyNthDay"
                              data={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]}
                              value={recurrence.monthlyNthDay}
                              onChange={(value) => setRecurrence({...recurrence, monthlyNthDay: value || ""})}
                            />
                          </div>
                          <div className='flex gap-4 items-center'>
                            <Text>of every</Text>
                            <NumberInput
                              value={recurrence.monthlyInterval}
                              onChange={(value) => setRecurrence({...recurrence, monthlyInterval: Number(value) || 0})}
                              className='w-24'
                            />
                            <Text>month(s)</Text>
                          </div>
                        </>
                      )}
                    </div>
                  )}




                  {recurrence.pattern === "Yearly" && (
                    <div className='flex flex-col gap-2'>

                      <div className='flex gap-4 items-center'>
                        <Text>Recur every</Text>
                        <NumberInput
                          value={recurrence.yearlyInterval}
                          onChange={(value) => setRecurrence({...recurrence, yearlyInterval: Number(value) || 0})}
                          className='w-24'
                        />
                        <Text>year(s)</Text>
                      </div>
                      
                      <div className='flex gap-4 items-center'>
                        <Select
                          name="yearlyPattern"
                          data={["On", "On the"]}
                          value={recurrence.yearlyPattern}
                          onChange={(value) => setRecurrence({...recurrence, yearlyPattern: value || ""})}
                          className='w-24'
                        />
                      </div>

                      {recurrence.yearlyPattern === "On" && (
                        <>
                          <div className='flex gap-4 items-center'>
                            <Select
                              name="yearlyMonth"
                              data={["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]}
                              value={recurrence.yearlyMonth}
                              onChange={(value) => setRecurrence({...recurrence, yearlyMonth: value || ""})}
                              className='w-32'
                            />
                            <NumberInput
                              value={recurrence.yearlyMonthDay}
                              onChange={(value) => setRecurrence({...recurrence, yearlyMonthDay: Number(value) || 0})}
                              className='w-24'
                            />
                          </div>
                        </>
                      )}

                      {recurrence.yearlyPattern === "On the" && (
                        <>
                          <div className='flex gap-4 items-center'>
                            <Select
                              name="yearlyNth"
                              data={["First", "Second", "Third", "Fourth", "Last"]}
                              value={recurrence.yearlyNth}
                              onChange={(value) => setRecurrence({...recurrence, yearlyNth: value || ""})}
                              className='w-32'
                            />
                            <Select
                              name="yearlyNthDay"
                              data={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]}
                              value={recurrence.yearlyNthDay}
                              onChange={(value) => setRecurrence({...recurrence, yearlyNthDay: value || ""})}
                              className='w-32'
                            />
                            <Text>of</Text>
                            <Select
                              name="yearlyNthMonth"
                              data={["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]}
                              value={recurrence.yearlyNthMonth}
                              onChange={(value) => setRecurrence({...recurrence, yearlyNthMonth: value || ""})}
                              className='w-32'
                            />
                          </div>
                        </>
                      )}

                     
                    </div>
                  )}

                </div>
              </div>




              <div className='flex flex-col gap-2 border-t p-4'>
                <strong>Range</strong>

                <div className='flex gap-4 items-center'>
                  <Select
                    data={["End by", "End after"]}
                    value={recurrence.range}
                    onChange={(value) => setRecurrence({...recurrence, range: value || ""})}
                  />

                  {recurrence.range === "End by" && (
                    <DatePickerInput
                      value={dayjs.unix(Number(recurrence.endBy)).toDate()} // Convert to Date
                      dropdownType="modal"
                      onChange={(newValue) => {
                        setRecurrence({...recurrence, endBy: newValue ? dayjs(newValue).unix().toString() : "0"});
                      }}
                      className='w-44'
                    />
                  )}

                  {recurrence.range === "End after" && (
                    <>
                      <NumberInput
                        value={recurrence.endAfter}
                        onChange={(value) => setRecurrence({...recurrence, endAfter: Number(value) || 0})}
                        className='w-24'
                      />
                      <Text>occurrences</Text>
                    </>
                  )}
                </div>
              </div>

              <div className='flex gap-2 p-4 border-t'>
                <Button className="rounded-full" variant="filled" color="blue" size="compact-md" onClick={enable}>Update</Button>
                <Button className="rounded-full" variant="light" size="compact-md" onClick={close}>Cancel</Button>
              </div>

            </Modal.Body>
          </>
        </Modal.Content>
      </Modal.Root>
    </>
  );
};
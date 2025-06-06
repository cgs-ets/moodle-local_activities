import { IconArrowRight } from '@tabler/icons-react';
import { Button, Modal, Text } from '@mantine/core';

type Props = {
  opened: boolean;
  submit: () => void;
  close: () => void;
  occurrence: {
    start: string;
    end: string;
  } | null;
  type: 'delete' | 'detach' | null
}

export function OccurrenceModal({opened, submit, close, occurrence, type}: Props) {


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
                  <Text fz="xl" fw={600} className="first-letter:uppercase">Are you sure you want to <strong>{type}</strong> this occurrence?</Text>
                </div>
              </Modal.Title>
              <Modal.CloseButton mt={-15} />
            </Modal.Header>
            <Modal.Body className='flex flex-col gap-4 text-base'>

              {type === 'delete' && (
                <span className="first-letter:uppercase">This action cannot be undone.</span>
              )}

              {type === 'detach' && (
                <span className="first-letter:uppercase text-orange-700">
                  This will create a new activity with the same details as the original activity, allowing you to edit the occurrence independently. 
                  The occurrence from the original activity will be removed.
                  </span>
              )}

              <div className='flex gap-2 items-center font-semibold'>
                <span className="first-letter:uppercase">{occurrence?.start}</span>
                <IconArrowRight size={15} />
                <span className="first-letter:uppercase">{occurrence?.end}</span>
              </div>

              <div className='flex justify-between mt-2 mb-1'>
                <Button className="rounded-full" variant="filled" color="orange.9" size="compact-md" onClick={submit}>Yes, {type}</Button>
                <Button className="rounded-full" variant="filled" size="compact-md" onClick={close}>Cancel</Button>
              </div>

            </Modal.Body>
          </>
        </Modal.Content>
      </Modal.Root>
    </>
  );
};
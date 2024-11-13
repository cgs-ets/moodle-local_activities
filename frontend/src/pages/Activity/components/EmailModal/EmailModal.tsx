
import { Box, Modal, Text } from '@mantine/core';
import { useStateStore } from '../../../../stores/stateStore';

export function EmailModal({opened, close} : {opened: boolean, close: () => void}) {
  const haschanges = useStateStore((state) => (state.haschanges))

  const changesWarning = (
    <Text>You must save changes to student list before you may send messages.</Text>
  )
  const emailForm = (
    <>
      Email form
    </>
  )

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Send message" 
      size="xl" 
      styles={{
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        }
      }}
      >
        <Box pt="md">
          { haschanges
            ? changesWarning
            : emailForm
          }
        </Box>
    </Modal>
  );
};

import { Anchor, Box, Modal, Text } from '@mantine/core';
import { useFormStore } from '../../../../../stores/formStore';
import { useStateStore } from '../../../../../stores/stateStore';
import { IconArrowNarrowRight } from '@tabler/icons-react';

type Props = {
  opened: boolean,
  close: () => void,
}

export function StaffReports({opened, close}: Props) {
  const activityid = useFormStore((state) => (state.id))
  const viewStateProps = useStateStore((state) => (state.viewStateProps))

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Staff Reports"
      size="xl" 
      styles={{
        header: {
          borderBottom: '0.0625rem solid #dee2e6',
        },
        title: {
          fontWeight: 600,
        },
        body: {
          padding: 0,
        }
      }}
      >
        <Box>

    
          <div className='border-b p-4'>
            <Text className="font-semibold inline">First Aid & CPR</Text>
            <div className='text-base'>
              Staff attending excursions are required to hold current First Aid and CPR certifications. Please ensure each attending staff member's First Aid and CPR qualifications are up to date in line with school policy.
              <br /><IconArrowNarrowRight size={16} className="inline-block ml-1" /> <Anchor fw={600} target="_blank" href={`http://cgsrh01vmgt001/Reports/report/HR/First_Aid_CoCurricular`}>Co-curricular First Aid report</Anchor>
              <br /><IconArrowNarrowRight size={16} className="inline-block ml-1" /> <Anchor fw={600} target="_blank" href={`http://cgsrh01vmgt001/Reports/report/HR/First_Aid_Skills`}>Staff First Aid report</Anchor>
            </div>
          </div>
          
        </Box>
    </Modal>
  );
};
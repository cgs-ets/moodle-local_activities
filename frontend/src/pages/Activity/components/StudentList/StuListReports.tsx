
import { Anchor, Box, Modal, Text } from '@mantine/core';
import { useFormStore } from '../../../../stores/formStore';
import { useStateStore } from '../../../../stores/stateStore';

type Props = {
  opened: boolean,
  close: () => void,
}

export function StuListReports({opened, close}: Props) {
  const activityid = useFormStore((state) => (state.id))
  const cost = useFormStore((state) => (state.cost))
  const viewStateProps = useStateStore((state) => (state.viewStateProps))

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title="Reports"
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

          { viewStateProps.editable &&
            <div className='border-b p-4'>
              <Text className="font-semibold inline">Medical report</Text>
              <div className='text-base'>
                The medical report is automatically generated using the student list above. 
                It can be accessed at any time and you do not have to upload it. 
                You may view the report <strong><Anchor target="_blank" href={`https://reports.cgs.act.edu.au/ReportServer/Pages/ReportViewer.aspx?%2fCGS+Connect%2fExcursions_Medical_info&rs:Command%20=Render&activityid=${activityid}`}>here</Anchor></strong> or <strong><Anchor target="_blank" href={`http://cgsrh01vmgt001/ReportServer/Pages/ReportViewer.aspx?%2fCGS+Connect%2fExcursions_Medical_info&rs:Command=Render&activityid=${activityid}`}>here</Anchor></strong>.
                Medical Action Plans for the student list can be accessed <strong><Anchor target="_blank" href={`https://reports.cgs.act.edu.au/ReportServer/Pages/ReportViewer.aspx?%2fCGS+Connect%2fExcursions_Med_Action_Plans&rs:Command%20=Render&activityid=${activityid}`}>here</Anchor></strong>.
              </div>
            </div>
          }

          { cost && viewStateProps.editable &&
            <div className='border-b p-4'>
              <Text className="font-semibold inline">Chargesheet</Text>
              <div className='text-base'>
                
                This is a chargesheet template automatically generated using the student list above. 
                You may download the <strong><Anchor target="_blank" href={`/local/activities/generate.php?doc=chargesheet&activityid=${activityid}`}>here</Anchor></strong>. 
                <br />Once you download the chargesheet please ensure all columns are complete: StudentID, DebtorID (value not required but do not remove column), FeeCode (budget code), TransactionDate (Activity date), TransactionDescription (Activity name). 
                <strong> Completed chargesheets must be sent to <Anchor target="_blank" href="mailto:chargesheets@cgs.act.edu.au">chargesheets@cgs.act.edu.au</Anchor></strong>.

              </div>
            </div>
          }
          
        </Box>
    </Modal>
  );
};
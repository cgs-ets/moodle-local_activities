import { Anchor, Card, Grid, Text } from '@mantine/core';
import { FileUploader } from './components/FileUploader/FileUploader';
import '@mantine/dropzone/styles.css';
import { IconDownload } from '@tabler/icons-react';
import { useFormStore } from '../../../../stores/formStore';
import { useStateStore } from '../../../../stores/stateStore';

export function Paperwork() {
  const activityid = useFormStore((state) => state.id)
  const cost = useFormStore((state) => state.cost)
  const viewStateProps = useStateStore((state) => (state.viewStateProps))

  return (
    <>
      <Card withBorder radius="sm">
        <Card.Section withBorder inheritPadding py="sm">
          <h3 className="text-base m-0">Paperwork</h3>
        </Card.Section>
        <Card.Section>

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

          <div className='border-b p-4'>
            <Text className="font-semibold inline">Risk Assessment</Text>
            <Anchor target='_blank' href="https://kb.cgs.act.edu.au/guides/risk-assessment-template/" className="text-sm inline ml-2 inline-flex items-center gap-1">Template <IconDownload className='size-3' /></Anchor>
            <FileUploader inputName="riskassessment" desc="or Drag file. The file must not exceed 10mb." maxFiles={1} maxSize={10} />
          </div>

          <div className='border-b p-4'>
            <Text className="font-semibold">Attachments</Text>
            <FileUploader inputName="attachments" desc="or Drag files. Maximum 10 files. Each file should not exceed 10mb." maxFiles={10} maxSize={10} />
          </div>

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

          { viewStateProps.editable &&
            <div className='p-4'>
              <Text className="font-semibold inline">Resources</Text>
              <div className='text-base'>
                <Anchor target="_blank" href="https://infiniti.canberragrammar.org.au/Infiniti/Produce/wizard/cd06206f-781e-4e37-8a02-30803481bfc0/">Boarders lunch order form</Anchor>
              </div>
            </div>
          }


        </Card.Section>
      </Card>
    </>
  );
};
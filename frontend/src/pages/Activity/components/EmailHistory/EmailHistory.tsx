import { Card, Text, Avatar, Group, Textarea, ActionIcon, Loader, LoadingOverlay, Modal } from '@mantine/core';
import { IconEye, IconEyeCode, IconFileSearch, IconLiveView, IconMailSearch, IconMessage2Search, IconMessageSearch, IconSearch, IconSend, IconTrash, IconView360 } from '@tabler/icons-react';
import { useFormStore } from '../../../../stores/formStore';
import { statuses } from '../../../../utils';
import { useAjax } from '../../../../hooks/useAjax';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

type Email = {
  rendered: string,
}

export function EmailHistory() {
  const activityid = useFormStore((state) => state.id)
  const status = useFormStore((state) => state.status)
  const [emails, setEmails] = useState<any[]>([])
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchedData] = useAjax(); // destructure state and fetch function
  const [selectedEmail, setSelectedEmail] = useState<Email|null>(null)

  useEffect(() => {
    if (activityid) {
      getEmailHistory()
    }
  }, [activityid]);

  const getEmailHistory = () => {
    console.log("getting email history")
    fetchAjax({
      query: {
        methodname: 'local_activities-get_emails',
        id: activityid,
      }
    })
  }
  useEffect(() => {
    if (fetchResponse && !fetchError) {
      setEmails(fetchResponse.data)
    }
  }, [fetchResponse]);

  if (status < statuses.approved || !emails.length) {
    return null
  }

  return (
    <>
      <Card withBorder  mb="lg">
        <Card.Section className='border-b' inheritPadding py="sm">
          <span className="text-base">Email history</span>
        </Card.Section>
        <Card.Section withBorder pos="relative" className=''>
            <LoadingOverlay visible={fetchLoading} />
            { !!emails.length &&
              <div className='flex gap-1 px-4 py-2'>
                  <div className='flex-1 font-semibold'>Date</div>
                  <div className='flex-1 font-semibold'>Sender</div>
                  <div className='font-semibold w-8'></div>
              </div>
            }
            {
              emails.map((email, i) => {
                return (
                  <div key={email.id} className='flex items-center gap-1 border-t px-4 py-2'>
                    <div className='flex-1'>{dayjs.unix(Number(email.timecreated)).format("DD MMM YY h:mma")}</div>
                    <div className='flex-1'>{email.sender.fn} {email.sender.ln}</div>
                    <div className='w-8 text-center'><ActionIcon onClick={() => setSelectedEmail(email as Email)} variant='subtle'><IconMailSearch className='size-5' /></ActionIcon></div>
                  </div>
                )
              })
            }
          </Card.Section>
      </Card>
      <Modal
        opened={!!selectedEmail} 
        onClose={() => setSelectedEmail(null)} 
        title="Email" 
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
          <div className="rendered-email text-base py-4">
            <div dangerouslySetInnerHTML={ {__html: selectedEmail?.rendered || ''} }></div>
          </div>
      </Modal>
    </>
  );
}
import { Card, Text, Avatar, Group, Paper, Textarea, ActionIcon, Loader, LoadingOverlay } from '@mantine/core';
import { IconSend, IconTrash } from '@tabler/icons-react';
import { useFormStore } from '../../../../stores/formStore';
import { statuses } from '../../../../utils';
import { useAjax } from '../../../../hooks/useAjax';
import { useEffect, useState } from 'react';

export function Comments() {
  const status = useFormStore((state) => state.status)
  const [comment, setComment] = useState<string>('')
  const [comments, setComments] = useState<any[]>([])
  const [fetchResponse, fetchError, fetchLoading, fetchAjax, setFetchedData] = useAjax(); // destructure state and fetch function
  const [submitResponse, submitError, submitLoading, submitAjax, setSubmitData] = useAjax(); // destructure state and fetch function
  const [deleteResponse, deleteError, deleteLoading, deleteAjax, setDeleteData] = useAjax(); // destructure state and fetch function
  const activityid = useFormStore((state) => state.id)

  useEffect(() => {
    if (activityid) {
      getComments()
    }
  }, [activityid]);

  const getComments = () => {
    console.log("getting comments")
    fetchAjax({
      query: {
        methodname: 'local_activities-get_comments',
        id: activityid,
      }
    })
  }
  useEffect(() => {
    if (fetchResponse && !fetchError) {
      setComments(fetchResponse.data)
    }
  }, [fetchResponse]);


  const handleSubmit = () => {
    if (!comment.length) {
      return;
    }
    const data = {
      activityid: activityid,
      comment: comment,
    }
    submitAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-post_comment',
        args: data,
      }
    })
    setComment('')
  }
  useEffect(() => {
    if (submitResponse) {
      getComments()
    }
  }, [submitResponse]);

  const handleDelete = (commentid: number) => {
    const data = {
      commentid: commentid,
    }
    deleteAjax({
      method: "POST", 
      body: {
        methodname: 'local_activities-delete_comment',
        args: data,
      }
    })
  }
  useEffect(() => {
    if (deleteResponse) {
      getComments()
    }
  }, [deleteResponse]);



  return (
    status == statuses.approved
    ? <Card className='mt-4 mb-0' withBorder>
        <Card.Section className='border-b' inheritPadding py="sm">
          <span className="text-base">Comments</span>
        </Card.Section>
        <Card.Section withBorder px="md" pos="relative">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
            placeholder="Add a comment"
            variant="unstyled"
            autosize
            minRows={2}
            className="overflow-hidden py-1"
          />
          {submitLoading
            ? <Loader type="dots" size={23} className="absolute bottom-2 right-2" />
            : <ActionIcon onClick={handleSubmit} radius="xl" size="md" variant="filled" className="absolute bottom-2 right-2">
                <IconSend size="1rem" />
              </ActionIcon>
          }
        </Card.Section>
        <Card.Section className='relative'>
          <LoadingOverlay visible={submitLoading || fetchLoading} />
          {
            comments.map( ({id, username, userfullname, readabletime, comment, isauthor}, i, row) => {
              return (
                <div key={id} className='border-b p-4 relative'>
                  <Group>
                    <Avatar size="sm" radius="xl" src={'/local/activities/avatar.php?username=' + username} alt={userfullname} />
                    <div>
                      <Text size="sm">{userfullname}</Text>
                      <Text size="xs" color="dimmed">
                        {readabletime}
                      </Text>
                    </div>
                  </Group>
                  <Text size="xs" mt="xs" >
                    {comment}
                  </Text>
                  {isauthor && (
                    deleteLoading
                    ? <Loader type="dots" size={23} className="absolute bottom-2 right-2" />
                    : <ActionIcon onClick={() => handleDelete(id)} size="sm" variant="transparent" className="absolute bottom-2 right-2 text-red-400">
                        <IconTrash size="1rem" />
                      </ActionIcon>
                  )}
                </div>
              )
            })
          }
        </Card.Section>
      </Card>
    : null
  );
}
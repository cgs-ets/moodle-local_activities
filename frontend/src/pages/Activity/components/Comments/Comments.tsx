import { Card, Text, Avatar, Group, Paper, Textarea, ActionIcon } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useFormStore } from '../../../../stores/formStore';
import { statuses } from '../../../../utils';

export function Comments() {
  const status = useFormStore((state) => state.status)

  const commentsData = [
    {
      id: 1,
      postedAt: '8 Mar 7:47pm',
      author: {
        name: 'Michael Vangelovski',
        image: '/local/activities/avatar.php?username=admin',
      },
      body: 'This Pokémon likes to lick its palms that are sweetened by being soaked in honey. Teddiursa concocts its own honey by blending fruits and pollen collected by Beedrill. Blastoise has water spouts that protrude from its shell. The water spouts are very accurate.',
    },
    {
      id: 2,
      postedAt: '8 Mar 7:47pm',
      author: {
        name: 'Mary Vangelovski',
        image: '/local/activities/avatar.php?username=admin',
      },
      body: 'This Pokémon likes to lick its palms that are sweetened by being soaked in honey. Teddiursa concocts its own honey by blending fruits and pollen collected by Beedrill. Blastoise has water spouts that protrude from its shell. The water spouts are very accurate.',
    },
  ]

  const comments = commentsData.map( ({id, author, postedAt, body}, i, row) => {
    return (
      <div key={id} className='border-b p-4'>
        <Group>
          <Avatar src={author.image} alt={author.name} radius="xl" />
          <div>
            <Text size="sm">{author.name}</Text>
            <Text size="xs" color="dimmed">
              {postedAt}
            </Text>
          </div>
        </Group>
        <Text size="xs" mt="xs" >
          {body}
        </Text>
      </div>
    )
  })

  return (
    status == statuses.approved
    ? <Card className='mt-4 mb-0' withBorder>
        <Card.Section className='border-b' inheritPadding py="sm">
          <span className="text-base">Comments</span>
        </Card.Section>
        <Card.Section withBorder px="md" pos="relative">
          <Textarea
            placeholder="Add a comment"
            variant="unstyled"
            autosize
            minRows={2}
            className="overflow-hidden py-1"
          />
          <ActionIcon radius="xl" size="md" variant="filled" className="absolute bottom-2 right-2">
            <IconSend size="1rem" />
          </ActionIcon>
        </Card.Section>
        <Card.Section>
          {comments}
        </Card.Section>
      </Card>
    : null
  );
}
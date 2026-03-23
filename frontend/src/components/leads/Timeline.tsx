import React, { useState, useMemo } from 'react';
import { TimelineItem } from './TimelineItem';
import { MentionsInput, Mention } from 'react-mentions';
import { toast } from 'sonner';
import { useGetUsersQuery, useCreateLeadActivityMutation } from '../../store/apiSlice';

export const Timeline = ({ lead_id, activities }) => {
  const [note, setNote] = useState('');

  // --- RTK Query Hooks ---
  const { data: usersData = [], isLoading: usersLoading } = useGetUsersQuery();
  const [createLeadActivity, { isLoading: isCreating }] = useCreateLeadActivityMutation();

  const usersById = useMemo(() => {
    return usersData.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [usersData]);

  const mentionUsers = useMemo(() => {
    return usersData.map(user => ({ id: user.id, display: user.name }));
  }, [usersData]);

  const handleAddNote = async () => {
    if (note.trim()) {
      try {
        await createLeadActivity({
          leadId: lead_id,
          activityData: {
            activity_type: 'note',
            data: { content: note },
          },
        }).unwrap();
        setNote('');
        toast.success('Note added successfully');
      } catch (error) {
        toast.error('Failed to add note.');
        console.error(error);
      }
    }
  };

  return (
    <div>
      <div className="mb-8">
        <MentionsInput
          value={note}
          onChange={(event, newValue) => setNote(newValue)}
          className="mentions"
          placeholder="Add a note... @mention a user"
          disabled={usersLoading}
        >
          <Mention
            trigger="@"
            data={mentionUsers}
            className="mentions__mention"
            markup="@[__display__](__id__)"
          />
        </MentionsInput>
        <button onClick={handleAddNote} disabled={isCreating} className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
          {isCreating ? 'Adding...' : 'Add Note'}
        </button>
      </div>
      <div className="space-y-8">
        {activities.map(activity => (
          <TimelineItem key={activity.id} activity={activity} users={usersById} />
        ))}
      </div>
    </div>
  );
};
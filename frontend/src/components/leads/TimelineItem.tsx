
import React from 'react';
import { useMemo } from 'react';

export const TimelineItem = ({ activity, users }) => {
  const { activity_type, data, timestamp, user_id } = activity;
  const actor = users[user_id] || { name: 'Unknown User' };

  const parsedContent = useMemo(() => {
    if (activity_type !== 'note' || !data.content) {
      return '';
    }
    // Replace mentions like @[User Name](user_id) with just "@User Name"
    return data.content.replace(/@\[(.*?)\]\((.*?)\)/g, '@$1');
  }, [activity_type, data.content]);

  const renderContent = () => {
    switch (activity_type) {
      case 'note':
        return <p><strong>{actor.name}</strong> added a note: {parsedContent}</p>;
      case 'status_change':
        const oldStatus = data.old_status || 'N/A';
        const newStatus = data.new_status || 'N/A';
        return <p><strong>{actor.name}</strong> changed status from <strong>{oldStatus}</strong> to <strong>{newStatus}</strong></p>;
      case 'assignment':
        const assignedToUser = users[data.assigned_to] || { name: 'Unknown Agent' };
        const assignedByUser = users[data.assigned_by] || { name: 'Unknown User' };
        return <p><strong>{assignedByUser.name}</strong> assigned this lead to <strong>{assignedToUser.name}</strong></p>;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-white">
          {actor.name.charAt(0)}
        </div>
      </div>
      <div className="ml-4">
        <div className="flex items-center space-x-2">
          <p className="font-bold">{actor.name}</p>
          <p className="text-sm text-muted-foreground">{new Date(timestamp).toLocaleString()}</p>
        </div>
        <div className="mt-2">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

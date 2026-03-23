import React from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import './mention-styles.css';

export const RichTextEditor = ({ value, onChange, users }) => {
  const mentionUsers = Object.values(users).map((user: any) => ({
    id: user.id,
    display: user.name,
  }));

  return (
    <MentionsInput
      value={value}
      onChange={onChange}
      placeholder="Type @ to mention someone..."
      className="mentions"
      markup="@[__id__]"
    >
      <Mention
        trigger="@"
        data={mentionUsers}
        className="mentions__mention"
      />
    </MentionsInput>
  );
};
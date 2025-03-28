/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiInlineEditTitle } from '@elastic/eui';
import { css } from '@emotion/react';
import { AssistantIcon } from '@kbn/ai-assistant-icon';
import { DataStreamApis } from '../use_data_stream_apis';
import type { Conversation } from '../../..';
import { useConversation } from '../use_conversation';
import { NEW_CHAT } from '../conversations/conversation_sidepanel/translations';

/**
 * Renders a header title, a tooltip button, and a popover with
 * information about the assistant feature and access to documentation.
 */
export const AssistantTitle: React.FC<{
  isDisabled?: boolean;
  title?: string;
  selectedConversation: Conversation | undefined;
  refetchCurrentUserConversations: DataStreamApis['refetchCurrentUserConversations'];
}> = ({
  title = NEW_CHAT,
  selectedConversation,
  refetchCurrentUserConversations,
  isDisabled = false,
}) => {
  const [newTitle, setNewTitle] = useState(title);
  const [newTitleError, setNewTitleError] = useState(false);
  const { updateConversationTitle } = useConversation();

  const handleUpdateTitle = useCallback(
    async (updatedTitle: string) => {
      setNewTitleError(false);

      if (selectedConversation) {
        await updateConversationTitle({
          conversationId: selectedConversation.id,
          updatedTitle,
        });
        await refetchCurrentUserConversations();
      }
    },
    [refetchCurrentUserConversations, selectedConversation, updateConversationTitle]
  );

  useEffect(() => {
    // Reset the title when the prop changes
    setNewTitle(title);
  }, [title]);

  return (
    <EuiFlexGroup gutterSize="m" alignItems="center">
      <EuiFlexItem grow={false}>
        <AssistantIcon data-test-subj="titleIcon" size="l" />
      </EuiFlexItem>
      <EuiFlexItem
        css={css`
          overflow: hidden;
        `}
      >
        <EuiInlineEditTitle
          data-test-subj="conversationTitle"
          heading="h2"
          inputAriaLabel="Edit text inline"
          value={newTitle}
          size="xs"
          isInvalid={!!newTitleError}
          isReadOnly={isDisabled}
          onChange={(e) => setNewTitle(e.currentTarget.nodeValue || '')}
          onCancel={() => setNewTitle(title)}
          onSave={handleUpdateTitle}
          editModeProps={{
            formRowProps: {
              fullWidth: true,
            },
          }}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { BaseMessage, AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import {
  ConversationRound,
  RoundInput,
  ToolCallWithResult,
  isToolCallStep,
} from '@kbn/onechat-common';
import { sanitizeToolId } from '@kbn/onechat-genai-utils/langchain';

/**
 * Converts a conversation to langchain format
 */
export const conversationToLangchainMessages = ({
  previousRounds,
  nextInput,
  ignoreSteps = false,
}: {
  previousRounds: ConversationRound[];
  nextInput: RoundInput;
  ignoreSteps?: boolean;
}): BaseMessage[] => {
  const messages: BaseMessage[] = [];

  for (const round of previousRounds) {
    messages.push(...roundToLangchain(round, { ignoreSteps }));
  }

  messages.push(createUserMessage({ content: nextInput.message }));

  return messages;
};

export const roundToLangchain = (
  round: ConversationRound,
  { ignoreSteps = false }: { ignoreSteps?: boolean } = {}
): BaseMessage[] => {
  const messages: BaseMessage[] = [];

  // user message
  messages.push(createUserMessage({ content: round.input.message }));

  // steps
  if (!ignoreSteps) {
    for (const step of round.steps) {
      if (isToolCallStep(step)) {
        messages.push(...createToolCallMessages(step));
      }
    }
  }

  // assistant response
  messages.push(createAssistantMessage({ content: round.response.message }));

  return messages;
};

const createUserMessage = ({ content }: { content: string }): HumanMessage => {
  return new HumanMessage({ content });
};

const createAssistantMessage = ({ content }: { content: string }): AIMessage => {
  return new AIMessage({ content });
};

export const createToolCallMessages = (toolCall: ToolCallWithResult): [AIMessage, ToolMessage] => {
  const toolName = sanitizeToolId(toolCall.tool_id);

  const toolCallMessage = new AIMessage({
    content: '',
    tool_calls: [
      {
        id: toolCall.tool_call_id,
        name: toolName,
        args: toolCall.params,
        type: 'tool_call',
      },
    ],
  });

  const toolResultMessage = new ToolMessage({
    tool_call_id: toolCall.tool_call_id,
    content: toolCall.results,
  });

  return [toolCallMessage, toolResultMessage];
};

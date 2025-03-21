/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { Message } from '@kbn/observability-ai-assistant-plugin/public';
import React, { useMemo, useState } from 'react';
import type { AT_TIMESTAMP } from '@kbn/apm-types';
import { useApmPluginContext } from '../../../../context/apm_plugin/use_apm_plugin_context';
import type { APMError } from '../../../../../typings/es_schemas/ui/apm_error';
import { ErrorSampleDetailTabContent } from './error_sample_detail';
import { exceptionStacktraceTab, logStacktraceTab } from './error_tabs';

export function ErrorSampleContextualInsight({
  error,
  transaction,
}: {
  error: {
    [AT_TIMESTAMP]: string;
    error: Pick<APMError['error'], 'log' | 'exception' | 'id'>;
    service: {
      name: string;
      environment?: string;
      language?: {
        name?: string;
      };
      runtime?: {
        name?: string;
        version?: string;
      };
    };
  };
  transaction?: {
    transaction: {
      name: string;
    };
  };
}) {
  const { observabilityAIAssistant } = useApmPluginContext();

  const [logStacktrace, setLogStacktrace] = useState('');
  const [exceptionStacktrace, setExceptionStacktrace] = useState('');

  const messages = useMemo<Message[] | undefined>(() => {
    const serviceName = error.service.name;
    const languageName = error.service.language?.name ?? '';
    const runtimeName = error.service.runtime?.name ?? '';
    const runtimeVersion = error.service.runtime?.version ?? '';
    const transactionName = transaction?.transaction.name ?? '';

    return observabilityAIAssistant?.getContextualInsightMessages({
      message: `I'm looking at an exception and trying to understand what it means`,
      instructions: `I'm an SRE. I am looking at an exception and trying to understand what it means.

      Your task is to describe what the error means and what it could be caused by.

      The error occurred on a service called ${serviceName}, which is a ${runtimeName} service written in ${languageName}. The
      runtime version is ${runtimeVersion}.

      The request it occurred for is called ${transactionName}.

      ${
        logStacktrace
          ? `The log stacktrace:
      ${logStacktrace}`
          : ''
      }

      ${
        exceptionStacktrace
          ? `The exception stacktrace:
      ${exceptionStacktrace}`
          : ''
      }`,
    });
  }, [error, transaction, logStacktrace, exceptionStacktrace, observabilityAIAssistant]);

  return observabilityAIAssistant?.ObservabilityAIAssistantContextualInsight && messages ? (
    <>
      <EuiFlexItem>
        <observabilityAIAssistant.ObservabilityAIAssistantContextualInsight
          messages={messages}
          title={i18n.translate('xpack.apm.errorGroupContextualInsight.explainErrorTitle', {
            defaultMessage: "What's this error?",
          })}
        />
      </EuiFlexItem>
      <EuiSpacer size="s" />
      <div
        ref={(next) => {
          setLogStacktrace(next?.innerText ?? '');
        }}
        style={{ display: 'none' }}
      >
        {error.error.log?.message && (
          <ErrorSampleDetailTabContent error={error} currentTab={logStacktraceTab} />
        )}
      </div>
      <div
        ref={(next) => {
          setExceptionStacktrace(next?.innerText ?? '');
        }}
        style={{ display: 'none' }}
      >
        {error.error.exception?.length && (
          <ErrorSampleDetailTabContent error={error} currentTab={exceptionStacktraceTab} />
        )}
      </div>
    </>
  ) : (
    <></>
  );
}

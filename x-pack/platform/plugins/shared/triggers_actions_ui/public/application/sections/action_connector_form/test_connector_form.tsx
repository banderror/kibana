/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { Suspense, useEffect, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiButton,
  EuiSteps,
  EuiLoadingSpinner,
  EuiDescriptionList,
  EuiCallOut,
  EuiSpacer,
  EuiErrorBoundary,
  EuiCodeBlock,
  EuiTitle,
} from '@elastic/eui';
import { Option, map, getOrElse } from 'fp-ts/Option';
import { pipe } from 'fp-ts/pipeable';
import { FormattedMessage } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';
import { ActionTypeExecutorResult } from '@kbn/actions-plugin/common';
import {
  ActionConnector,
  ActionConnectorMode,
  ActionTypeRegistryContract,
  IErrorObject,
} from '../../../types';

export interface TestConnectorFormProps {
  connector: ActionConnector;
  executeEnabled: boolean;
  isExecutingAction: boolean;
  setActionParams: (params: Record<string, unknown>) => void;
  actionParams: Record<string, unknown>;
  onExecutionAction: () => Promise<void>;
  executionResult: Option<ActionTypeExecutorResult<unknown> | undefined>;
  actionTypeRegistry: ActionTypeRegistryContract;
}

export const TestConnectorForm = ({
  connector,
  executeEnabled,
  executionResult,
  actionParams,
  setActionParams,
  onExecutionAction,
  isExecutingAction,
  actionTypeRegistry,
}: TestConnectorFormProps) => {
  const [actionErrors, setActionErrors] = useState<IErrorObject>({});
  const [hasErrors, setHasErrors] = useState<boolean>(false);
  const actionTypeModel = actionTypeRegistry.get(connector.actionTypeId);
  const ParamsFieldsComponent = actionTypeModel.actionParamsFields;

  useEffect(() => {
    (async () => {
      const res = (await actionTypeModel?.validateParams(actionParams)).errors as IErrorObject;
      setActionErrors({ ...res });
      setHasErrors(!!Object.values(res).find((errors) => (errors.length as number) > 0));
    })();
  }, [actionTypeModel, actionParams]);

  const steps = [
    {
      title: i18n.translate(
        'xpack.triggersActionsUI.sections.testConnectorForm.createActionHeader',
        {
          defaultMessage: 'Create an action',
        }
      ),
      children: ParamsFieldsComponent ? (
        <EuiErrorBoundary>
          <Suspense
            fallback={
              <EuiFlexGroup justifyContent="center">
                <EuiFlexItem grow={false}>
                  <EuiLoadingSpinner size="m" />
                </EuiFlexItem>
              </EuiFlexGroup>
            }
          >
            <ParamsFieldsComponent
              actionParams={actionParams}
              index={0}
              errors={actionErrors}
              editAction={(field, value) =>
                setActionParams({
                  ...actionParams,
                  [field]: value,
                })
              }
              messageVariables={[]}
              actionConnector={connector}
              executionMode={ActionConnectorMode.Test}
            />
          </Suspense>
        </EuiErrorBoundary>
      ) : (
        <EuiText>
          <p>
            <FormattedMessage
              id="xpack.triggersActionsUI.sections.testConnectorForm.noActionParametersRequiredText"
              defaultMessage="This Connector does not require any Action Parameter."
            />
          </p>
        </EuiText>
      ),
    },
    {
      title: i18n.translate('xpack.triggersActionsUI.sections.testConnectorForm.runTestHeader', {
        defaultMessage: 'Run the test',
      }),
      children: (
        <>
          {executeEnabled ? null : (
            <>
              <EuiCallOut iconType="warning" color="warning">
                <p>
                  <FormattedMessage
                    defaultMessage="Save your changes before testing the connector."
                    id="xpack.triggersActionsUI.sections.testConnectorForm.executeTestDisabled"
                  />
                </p>
              </EuiCallOut>
              <EuiSpacer size="s" />
            </>
          )}
          <EuiText>
            <EuiButton
              iconType={'play'}
              isLoading={isExecutingAction}
              isDisabled={!executeEnabled || hasErrors || isExecutingAction}
              data-test-subj="executeActionButton"
              onClick={onExecutionAction}
            >
              <FormattedMessage
                defaultMessage="Run"
                id="xpack.triggersActionsUI.sections.testConnectorForm.executeTestButton"
              />
            </EuiButton>
          </EuiText>
        </>
      ),
    },
    {
      title: i18n.translate(
        'xpack.triggersActionsUI.sections.testConnectorForm.testResultsHeader',
        {
          defaultMessage: 'Results',
        }
      ),
      children: pipe(
        executionResult,
        map((result) =>
          result?.status === 'ok' ? (
            <SuccessfulExecution executionResult={result} />
          ) : (
            <FailedExecussion executionResult={result} />
          )
        ),
        getOrElse(() => <AwaitingExecution />)
      ),
    },
  ];

  return <EuiSteps steps={steps} data-test-subj="test-connector-form" />;
};

const AwaitingExecution = () => (
  <EuiCallOut data-test-subj="executionAwaiting">
    <p>
      <FormattedMessage
        defaultMessage="When you run the test, the results will show up here."
        id="xpack.triggersActionsUI.sections.testConnectorForm.awaitingExecutionDescription"
      />
    </p>
  </EuiCallOut>
);

const SuccessfulExecution = ({
  executionResult,
}: {
  executionResult: ActionTypeExecutorResult<unknown> | undefined;
}) => (
  <>
    <EuiCallOut
      title={i18n.translate(
        'xpack.triggersActionsUI.sections.testConnectorForm.executionSuccessfulTitle',
        {
          defaultMessage: 'Test was successful',
        }
      )}
      color="success"
      data-test-subj="executionSuccessfulResult"
      iconType="check"
    >
      <p>
        <FormattedMessage
          defaultMessage="Ensure the results are what you expect."
          id="xpack.triggersActionsUI.sections.testConnectorForm.executionSuccessfulDescription"
        />
      </p>
    </EuiCallOut>
    {executionResult && (
      <>
        <EuiSpacer size="s" />
        <EuiTitle size="xs">
          <h4>
            {i18n.translate(
              'xpack.triggersActionsUI.sections.testConnectorForm.executionResultDetails',
              {
                defaultMessage: 'Response',
              }
            )}
          </h4>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiCodeBlock
          language="json"
          paddingSize="m"
          overflowHeight={300}
          isCopyable
          data-test-subj="executionResultCodeBlock"
        >
          {JSON.stringify(executionResult, null, 2)}
        </EuiCodeBlock>
      </>
    )}
  </>
);

const FailedExecussion = ({
  executionResult,
}: {
  executionResult: ActionTypeExecutorResult<unknown> | undefined;
}) => {
  const items = [
    {
      title: i18n.translate(
        'xpack.triggersActionsUI.sections.testConnectorForm.executionFailureDescription',
        {
          defaultMessage: 'The following error was found:',
        }
      ),
      description:
        executionResult?.message ??
        i18n.translate(
          'xpack.triggersActionsUI.sections.testConnectorForm.executionFailureUnknownReason',
          {
            defaultMessage: 'Unknown reason',
          }
        ),
    },
  ];
  if (executionResult?.serviceMessage) {
    items.push({
      title: i18n.translate(
        'xpack.triggersActionsUI.sections.testConnectorForm.executionFailureAdditionalDetails',
        {
          defaultMessage: 'Details:',
        }
      ),
      description: executionResult.serviceMessage,
    });
  }
  return (
    <EuiCallOut
      title={i18n.translate(
        'xpack.triggersActionsUI.sections.testConnectorForm.executionFailureTitle',
        {
          defaultMessage: 'Test failed to run',
        }
      )}
      data-test-subj="executionFailureResult"
      color="danger"
      iconType="warning"
    >
      <EuiDescriptionList textStyle="reverse" listItems={items} />
    </EuiCallOut>
  );
};

// eslint-disable-next-line import/no-default-export
export { TestConnectorForm as default };

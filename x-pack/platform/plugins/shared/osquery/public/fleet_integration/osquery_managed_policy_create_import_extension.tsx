/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { set } from '@kbn/safer-lodash-set';
import { pickBy, get, isEmpty, isString, unset, intersection } from 'lodash';
import satisfies from 'semver/functions/satisfies';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiCallOut,
  EuiLink,
  EuiAccordion,
  useEuiTheme,
} from '@elastic/eui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { produce } from 'immer';
import { i18n } from '@kbn/i18n';
import useDebounce from 'react-use/lib/useDebounce';

import type { AgentPolicy } from '@kbn/fleet-plugin/common';
import { agentRouteService, agentPolicyRouteService, PLUGIN_ID } from '@kbn/fleet-plugin/common';
import type {
  PackagePolicyCreateExtensionComponentProps,
  PackagePolicyEditExtensionComponentProps,
} from '@kbn/fleet-plugin/public';
import { pagePathGetters } from '@kbn/fleet-plugin/public';
import { OSQUERY_INTEGRATION_NAME } from '../../common';
import { useKibana } from '../common/lib/kibana';
import { NavigationButtons } from './navigation_buttons';
import { DisabledCallout } from './disabled_callout';
import { ConfigUploader } from './config_uploader';
import type { ValidationFunc } from '../shared_imports';
import {
  Form,
  useForm,
  useFormData,
  Field,
  getUseField,
  FIELD_TYPES,
  fieldValidators,
} from '../shared_imports';
import { useFetchStatus } from './use_fetch_status';

// https://github.com/elastic/beats/blob/master/x-pack/osquerybeat/internal/osqd/args.go#L57
const RESTRICTED_CONFIG_OPTIONS = [
  'force',
  'disable_watchdog',
  'utc',
  'events_expiry',
  'extensions_socket',
  'extensions_interval',
  'extensions_timeout',
  'pidfile',
  'database_path',
  'extensions_autoload',
  'flagfile',
  'config_plugin',
  'logger_plugin',
  'pack_delimiter',
  'config_refresh',
];

export const configProtectedKeysValidator = (
  ...args: Parameters<ValidationFunc>
): ReturnType<ValidationFunc> => {
  const [{ value }] = args;

  let configJSON;
  try {
    configJSON = JSON.parse(value as string);
  } catch (e) {
    return;
  }

  const restrictedFlags = intersection(
    Object.keys(configJSON?.options ?? {}),
    RESTRICTED_CONFIG_OPTIONS
  );

  if (restrictedFlags.length) {
    return {
      code: 'ERR_RESTRICTED_OPTIONS',
      message: i18n.translate(
        'xpack.osquery.fleetIntegration.osqueryConfig.restrictedOptionsErrorMessage',
        {
          defaultMessage:
            'The following osquery options are not supported and must be removed: {restrictedFlags}.',
          values: {
            restrictedFlags: restrictedFlags.join(', '),
          },
        }
      ),
    };
  }

  return;
};

export const packConfigFilesValidator = (
  ...args: Parameters<ValidationFunc>
): ReturnType<ValidationFunc> => {
  const [{ value }] = args;

  let configJSON;
  try {
    configJSON = JSON.parse(value as string);
  } catch (e) {
    return;
  }

  const packsWithConfigPaths = Object.keys(pickBy(configJSON?.packs ?? {}, isString));

  if (packsWithConfigPaths.length) {
    return {
      code: 'ERR_RESTRICTED_OPTIONS',
      message: i18n.translate(
        'xpack.osquery.fleetIntegration.osqueryConfig.packConfigFilesErrorMessage',
        {
          defaultMessage:
            'Pack configuration files are not supported. These packs must be removed: {packNames}.',
          values: {
            packNames: packsWithConfigPaths.join(', '),
          },
        }
      ),
    };
  }

  return;
};

const CommonUseField = getUseField({ component: Field });

/**
 * Exports Osquery-specific package policy instructions
 * for use in the Fleet app create / edit package policy
 */

export const OsqueryManagedPolicyCreateImportExtension = React.memo<
  PackagePolicyCreateExtensionComponentProps & {
    policy?: PackagePolicyEditExtensionComponentProps['policy'];
  }
>(({ onChange, policy, newPolicy }) => {
  const [agentlessPolicyIds, setAgentlessPolicyIds] = useState<string[]>([]);
  const [agentPolicies, setAgentPolicies] = useState<AgentPolicy[]>([]);
  const [editMode] = useState(!!policy);
  const {
    application: { getUrlForApp },
    http,
  } = useKibana().services;

  const policyIdsWithAgents = useMemo(
    () =>
      agentlessPolicyIds?.length
        ? policy?.policy_ids.filter((id) => !agentlessPolicyIds.includes(id))
        : policy?.policy_ids,
    [agentlessPolicyIds, policy?.policy_ids]
  );
  const { form: configForm } = useForm({
    defaultValue: {
      config: JSON.stringify(get(newPolicy, 'inputs[0].config.osquery.value', {}), null, 2),
    },
    schema: {
      config: {
        label: i18n.translate('xpack.osquery.fleetIntegration.osqueryConfig.configFieldLabel', {
          defaultMessage: 'Osquery config',
        }),
        type: FIELD_TYPES.JSON,
        validations: [
          {
            validator: fieldValidators.isJsonField(
              i18n.translate('xpack.osquery.fleetIntegration.osqueryConfig.configFieldError', {
                defaultMessage: 'Invalid JSON',
              }),
              { allowEmptyString: true }
            ),
          },
          { validator: packConfigFilesValidator },
          {
            validator: configProtectedKeysValidator,
          },
        ],
      },
    },
  });

  const [{ config }] = useFormData({ form: configForm, watch: 'config' });
  const { isValid, setFieldValue } = configForm;

  const agentsLinkHref = useCallback(
    (policyId: string) => {
      if (!policy?.policy_ids?.length) return '#';

      return getUrlForApp(PLUGIN_ID, {
        path: pagePathGetters.policy_details({ policyId })[1],
      });
    },
    [getUrlForApp, policy?.policy_ids?.length]
  );

  const handleConfigUpload = useCallback(
    (newConfig: any) => {
      let currentPacks = {};
      try {
        currentPacks = JSON.parse(config)?.packs;
        // eslint-disable-next-line no-empty
      } catch (e) {}

      if (newConfig) {
        setFieldValue(
          'config',
          JSON.stringify(
            {
              ...newConfig,
              ...(currentPacks || newConfig.packs
                ? { packs: { ...newConfig.packs, ...currentPacks } }
                : {}),
            },
            null,
            2
          )
        );
      }
    },
    [config, setFieldValue]
  );

  useDebounce(
    () => {
      // if undefined it means that config was not modified
      if (isValid === undefined) return;

      const updatedPolicy = produce(newPolicy, (draft) => {
        let parsedConfig;
        try {
          parsedConfig = JSON.parse(config);
          // eslint-disable-next-line no-empty
        } catch (e) {}

        if (isEmpty(parsedConfig)) {
          unset(draft, 'inputs[0].config');
        } else {
          set(draft, 'inputs[0].config.osquery.value', parsedConfig);
        }

        return draft;
      });

      onChange({ isValid: !!isValid, updatedPolicy: isValid ? updatedPolicy : newPolicy });
    },
    500,
    [isValid, config]
  );

  useEffect(() => {
    const policyIdsWithNoAgent: string[] = [];
    if (editMode && !agentlessPolicyIds?.length) {
      const fetchAgentsCount = async () => {
        try {
          if (policy?.policy_ids?.length) {
            await Promise.all(
              policy.policy_ids.map(async (id: string) => {
                const response = await http.fetch<{ results: { total: number } }>(
                  agentRouteService.getStatusPath(),
                  {
                    query: {
                      policyId: id,
                    },
                  }
                );
                if (response.results.total === 0) {
                  policyIdsWithNoAgent.push(id);
                }
              })
            );
            setAgentlessPolicyIds(policyIdsWithNoAgent);
          }
          // eslint-disable-next-line no-empty
        } catch (e) {}
      };

      const fetchAgentPolicyDetails = async () => {
        if (policyIdsWithNoAgent?.length) {
          const policiesWithoutAgent: AgentPolicy[] = [];
          try {
            await Promise.all(
              policyIdsWithNoAgent.map(async (id) => {
                const response = await http.fetch<{ item: AgentPolicy }>(
                  agentPolicyRouteService.getInfoPath(id)
                );
                if (response.item) {
                  policiesWithoutAgent.push(response.item);
                }
              })
            );
            if (policiesWithoutAgent.length) {
              setAgentPolicies(policiesWithoutAgent);
            }
            // eslint-disable-next-line no-empty
          } catch (e) {}
        }
      };

      fetchAgentsCount().then(() => fetchAgentPolicyDetails());
    }
  }, [editMode, http, agentlessPolicyIds?.length, agentlessPolicyIds, policy?.policy_ids]);

  useEffect(() => {
    /*
      by default Fleet set up streams with an empty scheduled query,
      this code removes that, so the user can schedule queries
      in the next step
    */

    const policyVersion = newPolicy?.package?.version;
    if (policyVersion) {
      /* From 0.6.0 we don't provide an input template, so we have to set it here */
      const versionWithoutTemplate = satisfies(policyVersion, '>=0.6.0');

      if (!editMode && !versionWithoutTemplate) {
        const updatedPolicy = produce(newPolicy, (draft) => {
          set(draft, 'inputs[0].streams', []);
        });
        onChange({
          isValid: true,
          updatedPolicy,
        });
      }

      if (versionWithoutTemplate) {
        const updatedPolicy = produce(newPolicy, (draft) => {
          const hasNewInputs = newPolicy.inputs[0]?.streams?.length;
          // 1.12.0 introduces multiple streams
          const versionWithStreams = satisfies(policyVersion, '>=1.12.0');

          if (versionWithStreams && hasNewInputs) {
            return draft;
          }

          if (editMode && policy?.inputs.length) {
            set(draft, 'inputs', policy.inputs);
          } else {
            set(draft, 'inputs[0]', {
              type: 'osquery',
              enabled: true,
              streams: [],
              policy_template: OSQUERY_INTEGRATION_NAME,
            });
          }

          return draft;
        });

        if (updatedPolicy?.inputs[0].config) {
          setFieldValue(
            'config',
            JSON.stringify(updatedPolicy?.inputs[0].config.osquery.value, null, 2)
          );
        }

        onChange({
          isValid: true,
          updatedPolicy,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { permissionDenied } = useFetchStatus();

  const { euiTheme } = useEuiTheme();

  const euiAccordionCss = useMemo(
    () => ({
      '.euiAccordion__button': {
        color: euiTheme.colors.primary,
      },
    }),
    [euiTheme]
  );

  return (
    <>
      {!editMode ? <DisabledCallout /> : null}
      {agentlessPolicyIds?.length ? (
        <>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiCallOut title="No agents in the policy" color="warning" iconType="question">
                <p>
                  {i18n.translate(
                    'xpack.osquery.fleetIntegration.osqueryConfig.noAgentsWarningMessage',
                    {
                      defaultMessage:
                        'Fleet has detected that you have not assigned yet any agent to the ',
                    }
                  )}
                  {agentPolicies?.map((agentPolicy, index) => (
                    <React.Fragment key={agentPolicy.id}>
                      <EuiLink href={agentsLinkHref(agentPolicy.id)}>
                        {agentPolicy.name || agentPolicy?.id}
                      </EuiLink>
                      {index < agentPolicies.length - 1 && `, `}
                    </React.Fragment>
                  ))}
                  {`. `}
                  <br />
                  <strong>{`Only agents within the policies with active Osquery Manager integration support the functionality presented below.`}</strong>
                </p>
              </EuiCallOut>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer />
        </>
      ) : null}
      {!permissionDenied && (
        <>
          <NavigationButtons isDisabled={!editMode} agentPolicyIds={policyIdsWithAgents} />
          <EuiSpacer size="xxl" />
          <EuiAccordion
            css={euiAccordionCss}
            id="advanced"
            buttonContent={i18n.translate(
              'xpack.osquery.fleetIntegration.osqueryConfig.accordionFieldLabel',
              {
                defaultMessage: 'Advanced',
              }
            )}
          >
            <EuiSpacer size="xs" />
            <Form form={configForm}>
              <CommonUseField path="config" />
              <ConfigUploader onChange={handleConfigUpload} />
            </Form>
          </EuiAccordion>
        </>
      )}
    </>
  );
});

OsqueryManagedPolicyCreateImportExtension.displayName = 'OsqueryManagedPolicyCreateImportExtension';

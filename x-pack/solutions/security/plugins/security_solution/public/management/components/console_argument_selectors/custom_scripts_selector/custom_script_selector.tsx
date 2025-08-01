/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  EuiPopover,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSelectable,
  EuiToolTip,
  EuiLoadingSpinner,
  EuiText,
} from '@elastic/eui';
import { css } from '@emotion/react';

import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import type { EuiSelectableOption } from '@elastic/eui/src/components/selectable/selectable_option';
import type { CustomScript } from '../../../../../server/endpoint/services';
import type { ResponseActionAgentType } from '../../../../../common/endpoint/service/response_actions/constants';
import type { CommandArgumentValueSelectorProps } from '../../console/types';
import { useGetCustomScripts } from '../../../hooks/custom_scripts/use_get_custom_scripts';
import { useKibana } from '../../../../common/lib/kibana';
import { useCustomScriptsErrorToast } from './use_custom_scripts_error_toast';

// Css to have a tooltip in place with a one line truncated description
const truncationStyle = css({
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 1,
  lineClamp: 1, // standardized fallback for modern Firefox
  textOverflow: 'ellipsis',
  whiteSpace: 'normal',
});

const INITIAL_DISPLAY_LABEL = i18n.translate(
  'xpack.securitySolution.consoleArgumentSelectors.customScriptSelector.initialDisplayLabel',
  { defaultMessage: 'Click to select script' }
);

const TOOLTIP_TEXT = i18n.translate(
  'xpack.securitySolution.consoleArgumentSelectors.customScriptSelector.tooltipText',
  { defaultMessage: 'Click to choose script' }
);

/**
 * State for the custom script selector component
 */
interface CustomScriptSelectorState {
  isPopoverOpen: boolean;
}

type SelectableOption = EuiSelectableOption<Partial<{ description: CustomScript['description'] }>>;
export const CustomScriptSelector = memo<
  CommandArgumentValueSelectorProps<string, CustomScriptSelectorState>
>(({ value, valueText, onChange, store: _store, command, requestFocus }) => {
  // Extract agentType from command.meta instead of direct parameter
  const agentType = command.commandDefinition.meta?.agentType as ResponseActionAgentType;

  const {
    services: { notifications },
  } = useKibana();

  const state = useMemo<CustomScriptSelectorState>(() => {
    return _store ?? { isPopoverOpen: !value };
  }, [_store, value]);
  const setIsPopoverOpen = useCallback(
    (newValue: boolean) => {
      onChange({
        value,
        valueText,
        store: {
          ...state,
          isPopoverOpen: newValue,
        },
      });
    },
    [onChange, state, value, valueText]
  );

  const {
    data = [],
    isLoading: isLoadingScripts,
    error: scriptsError,
  } = useGetCustomScripts(agentType);

  const scriptsOptions: SelectableOption[] = useMemo(() => {
    return data.map((script: CustomScript) => {
      const isChecked = script.name === value;
      return {
        label: script.name,
        description: script.description,
        checked: isChecked ? 'on' : undefined,
      };
    });
  }, [data, value]);

  // There is a race condition between the parent input and search input which results in search having the last char of the argument eg. 'e' from '--CloudFile'
  // This is a workaround to ensure the popover is not shown until the input is focused
  const [isAwaitingRenderDelay, setIsAwaitingRenderDelay] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAwaitingRenderDelay(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const renderOption = (option: SelectableOption) => {
    return (
      <>
        <EuiText size="s" css={truncationStyle}>
          <strong data-test-subj={`${option.label}-label`}>{option.label}</strong>
        </EuiText>
        {option?.description && (
          <EuiToolTip position="right" content={option.description}>
            <EuiText data-test-subj={`${option.label}-description`} color="subdued" size="s">
              <small css={truncationStyle}>{option.description}</small>
            </EuiText>
          </EuiToolTip>
        )}
      </>
    );
  };

  const handleOpenPopover = useCallback(() => {
    setIsPopoverOpen(true);
  }, [setIsPopoverOpen]);

  const handleClosePopover = useCallback(() => {
    setIsPopoverOpen(false);
  }, [setIsPopoverOpen]);

  // Focus on the console's input element when the popover closes
  useEffect(() => {
    if (!state.isPopoverOpen && requestFocus) {
      // Use setTimeout to ensure focus happens after the popover closes
      setTimeout(() => {
        requestFocus();
      }, 0);
    }
  }, [state.isPopoverOpen, requestFocus]);

  const handleScriptSelection = useCallback(
    (newOptions: EuiSelectableOption[], _event: unknown, changedOption: EuiSelectableOption) => {
      if (changedOption.checked === 'on') {
        onChange({
          value: changedOption.label,
          valueText: changedOption.label,
          store: {
            ...state,
            isPopoverOpen: false,
          },
        });
      } else {
        onChange({
          value: '',
          valueText: '',
          store: {
            ...state,
            isPopoverOpen: false,
          },
        });
      }
    },
    [onChange, state]
  );

  // notifications comes from useKibana() and is of type NotificationsStart
  // which is compatible with our updated useCustomScriptsErrorToast function
  useCustomScriptsErrorToast(scriptsError, notifications);

  if (isAwaitingRenderDelay || (isLoadingScripts && !scriptsError)) {
    return <EuiLoadingSpinner />;
  }

  return (
    <EuiPopover
      isOpen={state.isPopoverOpen}
      offset={10}
      panelStyle={{
        padding: 0,
        minWidth: 400,
      }}
      closePopover={handleClosePopover}
      button={
        <EuiToolTip content={TOOLTIP_TEXT} position="top" display="block">
          <EuiFlexGroup responsive={false} alignItems="center" gutterSize="none">
            <EuiFlexItem grow={false} onClick={handleOpenPopover}>
              <div title={valueText}>{valueText || INITIAL_DISPLAY_LABEL}</div>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiToolTip>
      }
    >
      {state.isPopoverOpen && (
        <EuiSelectable
          id="options-combobox"
          searchable={true}
          options={scriptsOptions}
          onChange={handleScriptSelection}
          renderOption={renderOption}
          singleSelection
          searchProps={{
            placeholder: valueText || INITIAL_DISPLAY_LABEL,
            autoFocus: true,
            onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
              // Only stop propagation for typing keys, not for navigation keys - otherwise input lose focus
              if (!['Enter', 'ArrowUp', 'ArrowDown', 'Escape'].includes(event.key)) {
                event.stopPropagation();
              }
            },
          }}
          listProps={{
            rowHeight: 60,
            showIcons: true,
            textWrap: 'truncate',
          }}
          errorMessage={
            scriptsError ? (
              <FormattedMessage
                id="xpack.securitySolution.endpoint.customScriptSelector.errorLoading"
                defaultMessage="Error loading scripts"
              />
            ) : undefined
          }
        >
          {(list, search) => (
            <>
              <div css={{ margin: 5 }}>{search}</div>
              {list}
            </>
          )}
        </EuiSelectable>
      )}
    </EuiPopover>
  );
});

CustomScriptSelector.displayName = 'CustomScriptSelector';

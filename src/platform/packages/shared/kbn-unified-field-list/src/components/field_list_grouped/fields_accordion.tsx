/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useMemo, Fragment } from 'react';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import {
  EuiText,
  EuiNotificationBadge,
  EuiSpacer,
  EuiAccordion,
  EuiLoadingSpinner,
  EuiIconTip,
  type UseEuiTheme,
} from '@elastic/eui';
import { useMemoCss } from '@kbn/css-utils/public/use_memo_css';
import { type DataViewField } from '@kbn/data-views-plugin/common';
import { type FieldListItem, FieldsGroupNames, type RenderFieldItemParams } from '../../types';

export interface FieldsAccordionProps<T extends FieldListItem> {
  initialIsOpen: boolean;
  onToggle: (open: boolean) => void;
  id: string;
  buttonId: string;
  label: string;
  helpTooltip?: string;
  hasLoaded: boolean;
  fieldsCount: number;
  hideDetails?: boolean;
  isFiltered: boolean;
  groupIndex: number;
  groupName: FieldsGroupNames;
  fieldSearchHighlight?: string;
  paginatedFields: T[];
  renderFieldItem: (params: RenderFieldItemParams<T>) => JSX.Element;
  renderCallout: () => JSX.Element;
  extraAction: React.ReactNode;
  showExistenceFetchError?: boolean;
  showExistenceFetchTimeout?: boolean;
}

function InnerFieldsAccordion<T extends FieldListItem = DataViewField>({
  initialIsOpen,
  onToggle,
  id,
  buttonId,
  label,
  helpTooltip,
  hasLoaded,
  fieldsCount,
  hideDetails,
  isFiltered,
  groupIndex,
  groupName,
  fieldSearchHighlight,
  paginatedFields,
  renderFieldItem,
  renderCallout,
  showExistenceFetchError,
  showExistenceFetchTimeout,
  extraAction,
}: FieldsAccordionProps<T>) {
  const styles = useMemoCss(componentStyles);

  const renderButton = useMemo(() => {
    return (
      <EuiText size="xs">
        <strong
          css={!!helpTooltip ? styles.titleTooltip : undefined}
          aria-label={i18n.translate('unifiedFieldList.fieldsAccordion.accordionButtonAriaLabel', {
            defaultMessage:
              '{label}: {fieldsCount} {fieldsCount, plural, one {item} other {items}}',
            values: { label, fieldsCount },
          })}
        >
          {label}
        </strong>
        {!!helpTooltip && (
          <EuiIconTip
            aria-label={helpTooltip}
            type="question"
            color="subdued"
            size="s"
            position="right"
            content={helpTooltip}
            iconProps={{
              className: 'eui-alignTop',
            }}
          />
        )}
      </EuiText>
    );
  }, [label, helpTooltip, fieldsCount, styles.titleTooltip]);

  const accordionExtraAction = useMemo(() => {
    if (showExistenceFetchError) {
      return (
        <EuiIconTip
          aria-label={i18n.translate('unifiedFieldList.fieldsAccordion.existenceErrorAriaLabel', {
            defaultMessage: 'Existence fetch failed',
          })}
          type="warning"
          color="warning"
          content={i18n.translate('unifiedFieldList.fieldsAccordion.existenceErrorLabel', {
            defaultMessage: "Field information can't be loaded",
          })}
          iconProps={{
            'data-test-subj': `${id}-fetchWarning`,
          }}
        />
      );
    }
    if (showExistenceFetchTimeout) {
      return (
        <EuiIconTip
          aria-label={i18n.translate('unifiedFieldList.fieldsAccordion.existenceTimeoutAriaLabel', {
            defaultMessage: 'Existence fetch timed out',
          })}
          type="clock"
          color="warning"
          content={i18n.translate('unifiedFieldList.fieldsAccordion.existenceTimeoutLabel', {
            defaultMessage: 'Field information took too long',
          })}
        />
      );
    }
    if (hasLoaded) {
      return (
        <EuiNotificationBadge
          size="m"
          color={isFiltered ? 'accent' : 'subdued'}
          data-test-subj={`${id}-count`}
        >
          {fieldsCount}
        </EuiNotificationBadge>
      );
    }

    return <EuiLoadingSpinner size="m" data-test-subj={`${id}-countLoading`} />;
  }, [showExistenceFetchError, showExistenceFetchTimeout, hasLoaded, isFiltered, id, fieldsCount]);

  return (
    <EuiAccordion
      initialIsOpen={initialIsOpen}
      onToggle={onToggle}
      data-test-subj={id}
      id={id}
      buttonProps={{
        id: buttonId,
      }}
      buttonContent={renderButton}
      extraAction={accordionExtraAction}
    >
      <EuiSpacer size="s" />
      {hasLoaded &&
        (!!fieldsCount ? (
          <>
            {extraAction}
            <ul>
              {paginatedFields &&
                paginatedFields.map((field, index) => (
                  <Fragment key={getFieldKey(field)}>
                    {renderFieldItem({
                      field,
                      itemIndex: index,
                      groupIndex,
                      groupName,
                      hideDetails,
                      fieldSearchHighlight,
                    })}
                  </Fragment>
                ))}
            </ul>
          </>
        ) : (
          renderCallout()
        ))}
    </EuiAccordion>
  );
}

export const FieldsAccordion = React.memo(InnerFieldsAccordion) as typeof InnerFieldsAccordion;

export const getFieldKey = (field: FieldListItem): string =>
  `${field.name}-${field.displayName}-${field.type}`;

const componentStyles = {
  titleTooltip: ({ euiTheme }: UseEuiTheme) =>
    css({
      marginRight: euiTheme.size.xs,
    }),
};

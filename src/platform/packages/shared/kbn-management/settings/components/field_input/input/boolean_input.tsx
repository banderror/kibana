/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';

import { EuiSwitch, EuiSwitchProps } from '@elastic/eui';

import { getFieldInputValue, useUpdate } from '@kbn/management-settings-utilities';

import type { InputProps } from '../types';
import { TEST_SUBJ_PREFIX_FIELD } from '.';

/**
 * Props for a {@link BooleanInput} component.
 */
export type BooleanInputProps = InputProps<'boolean'>;

/**
 * Component for manipulating a `boolean` field.
 */
export const BooleanInput = ({
  field,
  unsavedChange,
  isSavingEnabled,
  onInputChange,
}: BooleanInputProps) => {
  const onUpdate = useUpdate({ onInputChange, field });

  const onChange: EuiSwitchProps['onChange'] = (event) => {
    const inputValue = event.target.checked;
    onUpdate({ type: field.type, unsavedValue: inputValue });
  };

  const { id, name, ariaAttributes } = field;
  const { ariaLabel, ariaDescribedBy } = ariaAttributes;
  const [value] = getFieldInputValue(field, unsavedChange);

  return (
    <EuiSwitch
      label={name}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      checked={!!value}
      data-test-subj={`${TEST_SUBJ_PREFIX_FIELD}-${id}`}
      disabled={!isSavingEnabled}
      {...{ name, onChange }}
    />
  );
};

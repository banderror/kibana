/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { act, fireEvent, waitFor, within } from '@testing-library/react';

export async function showEuiComboBoxOptions(comboBoxToggleButton: HTMLElement): Promise<void> {
  // Skip actions if the combobox has been opened already
  if (
    document.querySelector('[role="listbox"]') ||
    document.querySelector('.euiComboBoxOptionsList__empty')
  ) {
    return;
  }

  await act(() => {
    fireEvent.click(comboBoxToggleButton);
  });

  return waitFor(() => {
    const listWithOptionsElement = document.querySelector('[role="listbox"]');
    const emptyListElement = document.querySelector('.euiComboBoxOptionsList__empty');

    expect(listWithOptionsElement || emptyListElement).toBeInTheDocument();
  });
}

type SelectEuiComboBoxOptionParameters =
  | {
      comboBoxToggleButton: HTMLElement;
      optionIndex: number;
      optionText?: undefined;
    }
  | {
      comboBoxToggleButton: HTMLElement;
      optionText: string;
      optionIndex?: undefined;
    };

export async function selectEuiComboBoxOption({
  comboBoxToggleButton,
  optionIndex,
  optionText,
}: SelectEuiComboBoxOptionParameters): Promise<void> {
  await showEuiComboBoxOptions(comboBoxToggleButton);

  await act(async () => {
    const options = Array.from(
      document.querySelectorAll('[data-test-subj*="comboBoxOptionsList"] [role="option"]')
    );

    if (typeof optionText === 'string') {
      const optionToSelect = options.find((option) => option.textContent === optionText);

      if (optionToSelect) {
        fireEvent.click(optionToSelect);
      } else {
        throw new Error(
          `Could not find option with text "${optionText}". Available options: ${options
            .map((option) => option.textContent)
            .join(', ')}`
        );
      }
    } else {
      fireEvent.click(options[optionIndex]);
    }
  });

  if (document.querySelector('[role="listbox"]')) {
    await act(() => {
      fireEvent.click(comboBoxToggleButton);
    });
  }

  // wait for the combobox options popover to disappear
  return waitFor(() => {
    expect(document.querySelector('[role="listbox"]')).not.toBeInTheDocument();
  });
}

interface AddEuiComboBoxOptionParameters {
  wrapper: HTMLElement;
  optionText: string;
}

export async function addEuiComboBoxOption({
  wrapper,
  optionText,
}: AddEuiComboBoxOptionParameters): Promise<void> {
  const input = within(wrapper).getByRole('combobox');

  await act(async () => {
    fireEvent.change(input, {
      target: { value: optionText },
    });
  });

  await act(async () => {
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
  });
}

export function selectFirstEuiComboBoxOption({
  comboBoxToggleButton,
}: {
  comboBoxToggleButton: HTMLElement;
}): Promise<void> {
  return selectEuiComboBoxOption({ comboBoxToggleButton, optionIndex: 0 });
}

export async function clearEuiComboBoxSelection({
  clearButton,
}: {
  clearButton: HTMLElement;
}): Promise<void> {
  const toggleButton = clearButton.nextElementSibling;

  await act(async () => {
    fireEvent.click(clearButton);
  });

  if (toggleButton) {
    // Make sure options list gets closed
    await act(async () => {
      fireEvent.click(toggleButton);
    });
  }
}

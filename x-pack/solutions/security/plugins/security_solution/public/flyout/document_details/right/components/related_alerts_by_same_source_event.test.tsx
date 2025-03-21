/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { __IntlProvider as IntlProvider } from '@kbn/i18n-react';
import { render } from '@testing-library/react';
import {
  SUMMARY_ROW_TEXT_TEST_ID,
  SUMMARY_ROW_LOADING_TEST_ID,
  CORRELATIONS_RELATED_ALERTS_BY_SAME_SOURCE_EVENT_TEST_ID,
  SUMMARY_ROW_BUTTON_TEST_ID,
} from './test_ids';
import { useFetchRelatedAlertsBySameSourceEvent } from '../../shared/hooks/use_fetch_related_alerts_by_same_source_event';
import { RelatedAlertsBySameSourceEvent } from './related_alerts_by_same_source_event';
import { useNavigateToLeftPanel } from '../../shared/hooks/use_navigate_to_left_panel';

jest.mock('../../shared/hooks/use_fetch_related_alerts_by_same_source_event');

const mockNavigateToLeftPanel = jest.fn();
jest.mock('../../shared/hooks/use_navigate_to_left_panel');

const originalEventId = 'originalEventId';
const scopeId = 'scopeId';

const TEXT_TEST_ID = SUMMARY_ROW_TEXT_TEST_ID(
  CORRELATIONS_RELATED_ALERTS_BY_SAME_SOURCE_EVENT_TEST_ID
);
const BUTTON_TEST_ID = SUMMARY_ROW_BUTTON_TEST_ID(
  CORRELATIONS_RELATED_ALERTS_BY_SAME_SOURCE_EVENT_TEST_ID
);
const LOADING_TEST_ID = SUMMARY_ROW_LOADING_TEST_ID(
  CORRELATIONS_RELATED_ALERTS_BY_SAME_SOURCE_EVENT_TEST_ID
);

const renderRelatedAlertsBySameSourceEvent = () =>
  render(
    <IntlProvider locale="en">
      <RelatedAlertsBySameSourceEvent originalEventId={originalEventId} scopeId={scopeId} />
    </IntlProvider>
  );

describe('<RelatedAlertsBySameSourceEvent />', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useNavigateToLeftPanel as jest.Mock).mockReturnValue({
      navigateToLeftPanel: mockNavigateToLeftPanel,
      isEnabled: true,
    });
  });

  it('should render single related alert correctly', () => {
    (useFetchRelatedAlertsBySameSourceEvent as jest.Mock).mockReturnValue({
      loading: false,
      error: false,
      dataCount: 1,
    });

    const { getByTestId } = renderRelatedAlertsBySameSourceEvent();
    expect(getByTestId(TEXT_TEST_ID)).toHaveTextContent('Alert related by source event');
    expect(getByTestId(BUTTON_TEST_ID)).toHaveTextContent('1');
  });

  it('should render multiple related alerts correctly', () => {
    (useFetchRelatedAlertsBySameSourceEvent as jest.Mock).mockReturnValue({
      loading: false,
      error: false,
      dataCount: 2,
    });

    const { getByTestId } = renderRelatedAlertsBySameSourceEvent();
    expect(getByTestId(TEXT_TEST_ID)).toHaveTextContent('Alerts related by source event');
    expect(getByTestId(BUTTON_TEST_ID)).toHaveTextContent('2');
  });

  it('should render loading skeleton', () => {
    (useFetchRelatedAlertsBySameSourceEvent as jest.Mock).mockReturnValue({
      loading: true,
    });

    const { getByTestId } = renderRelatedAlertsBySameSourceEvent();
    expect(getByTestId(LOADING_TEST_ID)).toBeInTheDocument();
  });

  it('should render 0 same source alert if error', () => {
    (useFetchRelatedAlertsBySameSourceEvent as jest.Mock).mockReturnValue({
      loading: false,
      error: true,
      dataCount: 0,
    });

    const { getByTestId } = renderRelatedAlertsBySameSourceEvent();
    expect(getByTestId(TEXT_TEST_ID)).toHaveTextContent('Alerts related by source event');
    expect(getByTestId(BUTTON_TEST_ID)).toHaveTextContent('0');
  });

  it('should open the expanded section to the correct tab when the number is clicked', () => {
    (useFetchRelatedAlertsBySameSourceEvent as jest.Mock).mockReturnValue({
      loading: false,
      error: true,
      dataCount: 1,
    });

    const { getByTestId } = renderRelatedAlertsBySameSourceEvent();
    getByTestId(BUTTON_TEST_ID).click();

    expect(mockNavigateToLeftPanel).toHaveBeenCalled();
  });
});

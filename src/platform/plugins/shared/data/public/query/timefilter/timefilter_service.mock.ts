/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { PublicMethodsOf } from '@kbn/utility-types';
import type { TimeRange } from '@kbn/es-query';
import { TimefilterService, TimeHistoryContract, TimefilterContract } from '.';
import { Observable } from 'rxjs';

export type TimefilterServiceClientContract = PublicMethodsOf<TimefilterService>;

const createSetupContractMock = () => {
  const timefilterMock: jest.Mocked<TimefilterContract> = {
    isAutoRefreshSelectorEnabled: jest.fn(),
    isTimeRangeSelectorEnabled: jest.fn(),
    isTimeTouched: jest.fn(),
    isRefreshIntervalTouched: jest.fn(),
    getEnabledUpdated$: jest.fn().mockImplementation(() => new Observable<() => void>()),
    getTimeUpdate$: jest.fn().mockImplementation(() => new Observable<() => void>()),
    getRefreshIntervalUpdate$: jest.fn().mockImplementation(() => new Observable<() => void>()),
    getAutoRefreshFetch$: jest.fn().mockImplementation(() => new Observable<() => void>()),
    getFetch$: jest.fn().mockImplementation(() => new Observable<() => void>()),
    getTime: jest.fn().mockReturnValue({ from: 'now-15m', to: 'now' }),
    setTime: jest.fn(),
    setRefreshInterval: jest.fn(),
    getRefreshInterval: jest.fn(),
    getMinRefreshInterval: jest.fn().mockReturnValue(1000),
    getActiveBounds: jest.fn(),
    disableAutoRefreshSelector: jest.fn(),
    disableTimeRangeSelector: jest.fn(),
    enableAutoRefreshSelector: jest.fn(),
    enableTimeRangeSelector: jest.fn(),
    getBounds: jest.fn(),
    calculateBounds: jest.fn(),
    triggerFetch: jest.fn(),
    createFilter: jest.fn(),
    createRelativeFilter: jest.fn(),
    getRefreshIntervalDefaults: jest.fn(),
    getTimeDefaults: jest.fn(),
    getAbsoluteTime: jest
      .fn()
      .mockReturnValue({ from: '1970-01-01T00:00:00.000Z', to: '1970-01-01T00:00:00.001Z' }),
    useTimefilter: jest.fn(),
  };

  const historyMock: jest.Mocked<TimeHistoryContract> = {
    add: jest.fn(),
    get: jest.fn(),
    get$: jest.fn(() => new Observable<TimeRange[]>()),
  };

  const setupContract = {
    timefilter: timefilterMock,
    history: historyMock,
  };

  return setupContract;
};

const createMock = () => {
  const mocked: jest.Mocked<TimefilterServiceClientContract> = {
    setup: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };

  mocked.setup.mockReturnValue(createSetupContractMock());
  return mocked;
};

export const timefilterServiceMock = {
  create: createMock,
  createSetupContract: createSetupContractMock,
  createStartContract: createSetupContractMock,
};

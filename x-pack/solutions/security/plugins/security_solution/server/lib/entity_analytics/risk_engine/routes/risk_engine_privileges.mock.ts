/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { securityMock } from '@kbn/security-plugin/server/mocks';

const createMockSecurityStartWithFullRiskEngineAccess = () => {
  const mockSecurityStart = securityMock.createStart();

  const mockCheckPrivileges = jest.fn().mockResolvedValue({
    hasAllRequested: true,
    privileges: {
      elasticsearch: {
        cluster: ['manage', 'monitor'],
        index: {
          'index-name': ['read'],
        },
      },
      kibana: [],
    },
  });

  mockSecurityStart.authz.checkPrivilegesDynamicallyWithRequest = jest
    .fn()
    .mockReturnValue(mockCheckPrivileges);

  return mockSecurityStart;
};

const createMockSecurityStartWithNoRiskEngineAccess = () => {
  const mockSecurityStart = securityMock.createStart();

  const mockCheckPrivileges = jest.fn().mockResolvedValue({
    hasAllRequested: false,
    privileges: {
      elasticsearch: {
        cluster: [],
        index: [],
      },
      kibana: [],
    },
  });

  mockSecurityStart.authz.checkPrivilegesDynamicallyWithRequest = jest
    .fn()
    .mockReturnValue(mockCheckPrivileges);

  return mockSecurityStart;
};

export const riskEnginePrivilegesMock = {
  createMockSecurityStartWithFullRiskEngineAccess,
  createMockSecurityStartWithNoRiskEngineAccess,
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PERFORM_RULE_UPGRADE_URL,
  ThreeWayDiffConflict,
  ThreeWayDiffOutcome,
} from '../../../../../../../common/api/detection_engine';
import { KibanaServices } from '../../../../../../common/lib/kibana';
import { useInstalledSecurityJobs } from '../../../../../../common/components/ml/hooks/use_installed_security_jobs';
import { savedRuleMock } from '../../../../../rule_management/logic/mock';
import { RuleUpdateCallout } from '../../../../../rule_management/components/rule_details/rule_update_callout';
import { HAS_RULE_UPDATE_CALLOUT_BUTTON } from '../../../../../rule_management/components/rule_details/translations';
import {
  ML_JOB_UPGRADE_MODAL_TITLE,
  ML_JOB_UPGRADE_MODAL_CONFIRM,
  ML_JOB_UPGRADE_MODAL_CANCEL,
} from '../../../../components/rules_table/upgrade_prebuilt_rules_table/use_ml_jobs_upgrade_modal/translations';
import {
  mockKibanaFetchResponse,
  mockRuleUpgradeReviewData,
  renderRuleUpgradeContainer,
} from './test_utils/rule_upgrade_flyout';

jest.mock('../../../../../../common/components/ml/hooks/use_installed_security_jobs');
// `renderRuleUpgradeContainer` sets edit privileges on this mock so the "Update rule" button is enabled.
jest.mock('../../../../../../common/components/user_privileges');

// A job whose id is in `common/machine_learning/affected_job_ids.ts` triggers the modal gate.
const AFFECTED_ML_JOB = { id: 'v2_windows_rare_metadata_user', groups: ['security'] };
// A job that is NOT in the allowlist does not trigger the modal.
const UNAFFECTED_ML_JOB = { id: 'high_count_network_denies', groups: ['security'] };

const PERFORM_UPGRADE_RESPONSE = {
  summary: { total: 1, succeeded: 1, skipped: 0, failed: 0 },
  results: { updated: [], skipped: [], created: [] },
  errors: [],
};

const mockInstalledSecurityJobs = (jobs: Array<{ id: string; groups: string[] }>): void => {
  (useInstalledSecurityJobs as jest.Mock).mockReturnValue({
    loading: false,
    jobs,
    isMlUser: true,
    isLicensed: true,
  });
};

const performUpgradeRequests = () =>
  (KibanaServices.get().http.fetch as jest.Mock).mock.calls.filter(
    ([path, options]) => path === PERFORM_RULE_UPGRADE_URL && options?.method === 'POST'
  );

const renderCallout = () =>
  renderRuleUpgradeContainer(
    <RuleUpdateCallout
      rule={{ ...savedRuleMock, rule_id: 'test-rule' }}
      message="A newer version of this rule is available"
    />
  );

const openUpgradeFlyout = async (): Promise<void> => {
  await userEvent.click(await screen.findByText(HAS_RULE_UPDATE_CALLOUT_BUTTON));
};

const clickUpdateRuleButton = async (): Promise<void> => {
  const button = await screen.findByTestId('updatePrebuiltRuleFromFlyoutButton');

  await waitFor(() => expect(button).toBeEnabled(), { timeout: 1000 });

  await act(async () => {
    fireEvent.click(button);
  });
};

describe('Rule upgrade from the Rule Details page callout with legacy ML jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRuleUpgradeReviewData({
      ruleType: 'query',
      fieldName: 'name',
      fieldVersions: {
        base: 'Initial name',
        current: 'Initial name',
        target: 'Updated name',
        merged: 'Updated name',
      },
      diffOutcome: ThreeWayDiffOutcome.StockValueCanUpdate,
      conflict: ThreeWayDiffConflict.NONE,
    });
    mockKibanaFetchResponse(PERFORM_RULE_UPGRADE_URL, PERFORM_UPGRADE_RESPONSE);
  });

  it('shows the legacy ML jobs modal and upgrades the rule once confirmed', async () => {
    // Regression test for https://github.com/elastic/kibana/issues/279791. Before the fix
    // the callout did not render `confirmLegacyMlJobsUpgradeModal`, so the confirmation
    // Promise never resolved: the flyout closed and nothing else happened.
    mockInstalledSecurityJobs([AFFECTED_ML_JOB]);

    renderCallout();
    await openUpgradeFlyout();
    await clickUpdateRuleButton();

    // The modal is mounted by the callout and gates the upgrade.
    expect(await screen.findByText(ML_JOB_UPGRADE_MODAL_TITLE)).toBeInTheDocument();
    // Nothing is sent until the user confirms.
    expect(performUpgradeRequests()).toHaveLength(0);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: ML_JOB_UPGRADE_MODAL_CONFIRM }));
    });

    await waitFor(() => expect(performUpgradeRequests().length).toBeGreaterThan(0));
  });

  it('aborts the upgrade when the legacy ML jobs modal is cancelled', async () => {
    mockInstalledSecurityJobs([AFFECTED_ML_JOB]);

    renderCallout();
    await openUpgradeFlyout();
    await clickUpdateRuleButton();

    expect(await screen.findByText(ML_JOB_UPGRADE_MODAL_TITLE)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: ML_JOB_UPGRADE_MODAL_CANCEL }));
    });

    expect(performUpgradeRequests()).toHaveLength(0);
  });

  it('upgrades the rule directly without a modal when no affected ML jobs are installed', async () => {
    mockInstalledSecurityJobs([UNAFFECTED_ML_JOB]);

    renderCallout();
    await openUpgradeFlyout();
    await clickUpdateRuleButton();

    await waitFor(() => expect(performUpgradeRequests().length).toBeGreaterThan(0));
    expect(screen.queryByText(ML_JOB_UPGRADE_MODAL_TITLE)).not.toBeInTheDocument();
  });
});

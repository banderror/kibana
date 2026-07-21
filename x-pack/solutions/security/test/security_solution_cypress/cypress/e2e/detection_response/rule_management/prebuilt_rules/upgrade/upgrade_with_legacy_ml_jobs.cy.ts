/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createRuleAssetSavedObject } from '../../../../../helpers/rules';
import {
  MODAL_CONFIRMATION_BTN,
  UPDATE_PREBUILT_RULE_BUTTON,
} from '../../../../../screens/alerts_detection_rules';
import { SINGLE_PREBUILT_RULE_UPGRADE_REMINDER_CALLOUT } from '../../../../../screens/prebuilt_rules_upgrade';
import { createMlJob, deleteMlJob } from '../../../../../support/machine_learning';
import {
  deleteAlertsAndRules,
  deletePrebuiltRulesAssets,
} from '../../../../../tasks/api_calls/common';
import {
  installMockPrebuiltRulesPackage,
  installPrebuiltRuleAssets,
  installSpecificPrebuiltRulesRequest,
} from '../../../../../tasks/api_calls/prebuilt_rules';
import { assertRuleUpgradeSuccessToastShown } from '../../../../../tasks/prebuilt_rules';
import { resetRulesTableState } from '../../../../../tasks/common';
import { login } from '../../../../../tasks/login';
import { visitRuleDetailsPage } from '../../../../../tasks/rule_details';

// A job whose id is in `affected_job_ids.ts`; its presence triggers the legacy ML jobs
// upgrade modal. The stock ML modules only install the newer `_ea` jobs, which are NOT in
// the allowlist, so we create this job explicitly (see `createMlJob`).
const AFFECTED_ML_JOB_ID = 'v2_windows_rare_metadata_user';

const RULE_ID = 'test-legacy-ml-modal-upgrade-rule';
const CURRENT_RULE_ASSET = createRuleAssetSavedObject({
  rule_id: RULE_ID,
  version: 1,
  name: 'Legacy ML modal upgrade rule',
  index: ['test-*'],
});
const NEW_RULE_ASSET = createRuleAssetSavedObject({
  rule_id: RULE_ID,
  version: 2,
  name: 'Legacy ML modal upgrade rule v2',
  index: ['test-*'],
});

const ML_JOBS_UPGRADE_MODAL_TITLE = 'ML rule updates may override your existing rules';
const REVIEW_UPDATE_CALLOUT_BUTTON = 'Review update';

describe(
  'Detection rules, Prebuilt Rules Upgrade from Rule Details page with legacy ML jobs',
  { tags: ['@ess', '@serverless', '@skipInServerlessMKI'] },
  () => {
    before(() => {
      // Prevent the real package installation
      installMockPrebuiltRulesPackage();
    });

    beforeEach(() => {
      resetRulesTableState();
      deletePrebuiltRulesAssets();
      deleteAlertsAndRules();
      login();
      createMlJob({ jobId: AFFECTED_ML_JOB_ID });
    });

    afterEach(() => {
      deleteMlJob({ jobId: AFFECTED_ML_JOB_ID });
    });

    it('shows the legacy ML jobs modal and upgrades the rule once confirmed', () => {
      installPrebuiltRuleAssets([CURRENT_RULE_ASSET]);
      installSpecificPrebuiltRulesRequest([CURRENT_RULE_ASSET]).then((response) => {
        const installedRuleId = response.body.results.created[0].id;

        // Publish a newer version so the "rule update available" callout is shown.
        installPrebuiltRuleAssets([NEW_RULE_ASSET]);
        visitRuleDetailsPage(installedRuleId);

        cy.get(SINGLE_PREBUILT_RULE_UPGRADE_REMINDER_CALLOUT).should('be.visible');
        cy.get(SINGLE_PREBUILT_RULE_UPGRADE_REMINDER_CALLOUT)
          .contains(REVIEW_UPDATE_CALLOUT_BUTTON)
          .click();

        // Start the upgrade from the flyout.
        cy.get(UPDATE_PREBUILT_RULE_BUTTON).click();

        // Regression check for https://github.com/elastic/kibana/issues/279791: before the fix
        // this modal was never mounted on the Rule Details page, so clicking "Update rule"
        // silently hung and the rule was never upgraded.
        cy.contains(ML_JOBS_UPGRADE_MODAL_TITLE).should('be.visible');
        cy.get(MODAL_CONFIRMATION_BTN).click();

        assertRuleUpgradeSuccessToastShown([NEW_RULE_ASSET]);
        cy.get(SINGLE_PREBUILT_RULE_UPGRADE_REMINDER_CALLOUT).should('not.exist');
      });
    });
  }
);

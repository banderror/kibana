/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { omit } from 'lodash';
import { createRuleAssetSavedObject } from '../../../../../helpers/rules';
import {
  FIELD_UPGRADE_WRAPPER,
  UPDATE_PREBUILT_RULE_BUTTON,
  getReviewSingleRuleButtonByRuleId,
} from '../../../../../screens/alerts_detection_rules';
import { SINGLE_PREBUILT_RULE_UPGRADE_REMINDER_CALLOUT } from '../../../../../screens/prebuilt_rules_upgrade';
import {
  deleteAlertsAndRules,
  deletePrebuiltRulesAssets,
} from '../../../../../tasks/api_calls/common';
import {
  installMockPrebuiltRulesPackage,
  installPrebuiltRuleAssets,
  installSpecificPrebuiltRulesRequest,
} from '../../../../../tasks/api_calls/prebuilt_rules';
import { setUpRuleUpgrades } from '../../../../../tasks/prebuilt_rules/setup_rule_upgrades';
import { acceptFieldValue } from '../../../../../tasks/prebuilt_rules/prebuilt_rules_upgrade_flyout';
import { openPrebuiltRuleUpgradeFlyoutFor } from '../../../../../tasks/prebuilt_rules_preview';
import { assertRuleUpgradeSuccessToastShown } from '../../../../../tasks/prebuilt_rules';
import { visitRulesUpgradeTable } from '../../../../../tasks/rules_management';
import { resetRulesTableState } from '../../../../../tasks/common';
import { login } from '../../../../../tasks/login';
import { visitRuleDetailsPage } from '../../../../../tasks/rule_details';

const RULE_ID = 'test-ml-coverage-loss-upgrade-rule';
const RULE_NAME = 'ML coverage-loss upgrade rule';
// `v2_windows_rare_metadata_user` is in `common/machine_learning/affected_job_ids.ts`; the `_ea`
// variant is not. Upgrading from the former to the latter drops a legacy job → coverage-loss
// conflict on `machine_learning_job_id`.
const AFFECTED_JOB_ID = 'v2_windows_rare_metadata_user';
const REPLACEMENT_JOB_ID = 'v3_windows_rare_metadata_user_ea';

const buildMlRuleAsset = (version: number, jobIds: string[]) =>
  omit(
    createRuleAssetSavedObject({
      rule_id: RULE_ID,
      version,
      name: `${RULE_NAME} v${version}`,
      type: 'machine_learning',
      anomaly_threshold: 50,
      machine_learning_job_id: jobIds,
    }),
    ['security-rule.query', 'security-rule.language']
  ) as ReturnType<typeof createRuleAssetSavedObject>;

const CURRENT_RULE_ASSET = buildMlRuleAsset(1, [AFFECTED_JOB_ID]);
const NEW_RULE_ASSET = buildMlRuleAsset(2, [REPLACEMENT_JOB_ID]);

const REVIEW_UPDATE_CALLOUT_BUTTON = 'Review update';

describe(
  'Detection rules, Prebuilt Rules Upgrade with legacy ML jobs',
  { tags: ['@ess', '@serverless', '@skipInServerlessMKI'] },
  () => {
    before(() => {
      // Prevent the real package installation
      installMockPrebuiltRulesPackage();
    });

    describe('ML job coverage-loss conflict', () => {
      beforeEach(() => {
        resetRulesTableState();
        deletePrebuiltRulesAssets();
        deleteAlertsAndRules();
        login();
      });

      it('surfaces the coverage-loss conflict on the Rule Management upgrades table and upgrades after resolving it', () => {
        setUpRuleUpgrades({
          currentRuleAssets: [CURRENT_RULE_ASSET],
          rulePatches: [],
          newRuleAssets: [NEW_RULE_ASSET],
        });
        visitRulesUpgradeTable();

        // The rule moves off a legacy ML job, so its row offers "Review" (opens the flyout)
        // instead of a direct one-click "Update".
        cy.get(getReviewSingleRuleButtonByRuleId(RULE_ID)).should('be.visible');

        openPrebuiltRuleUpgradeFlyoutFor(`${RULE_NAME} v1`);

        // The conflict is surfaced on the machine_learning_job_id field; resolving it enables the upgrade.
        cy.get(FIELD_UPGRADE_WRAPPER('machine_learning_job_id')).should('be.visible');
        acceptFieldValue('machine_learning_job_id');

        cy.get(UPDATE_PREBUILT_RULE_BUTTON).click();

        assertRuleUpgradeSuccessToastShown([NEW_RULE_ASSET]);
      });

      it('surfaces the coverage-loss conflict on the Rule Details page and upgrades after resolving it', () => {
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

          // The coverage-loss conflict is surfaced on the machine_learning_job_id field.
          cy.get(FIELD_UPGRADE_WRAPPER('machine_learning_job_id')).should('be.visible');
          acceptFieldValue('machine_learning_job_id');

          cy.get(UPDATE_PREBUILT_RULE_BUTTON).click();

          assertRuleUpgradeSuccessToastShown([NEW_RULE_ASSET]);
          cy.get(SINGLE_PREBUILT_RULE_UPGRADE_REMINDER_CALLOUT).should('not.exist');
        });
      });
    });
  }
);

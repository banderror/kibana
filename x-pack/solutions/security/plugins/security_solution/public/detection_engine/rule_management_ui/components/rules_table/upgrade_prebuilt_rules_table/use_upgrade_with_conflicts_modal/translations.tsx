/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiCallOut, EuiLink } from '@elastic/eui';
import { useKibana } from '../../../../../../common/lib/kibana';

export const UPGRADE_CONFLICTS_MODAL_TITLE = i18n.translate(
  'xpack.securitySolution.detectionEngine.upgradeConflictsModal.messageTitle',
  {
    defaultMessage: 'Conflicts found',
  }
);

export const UPGRADE_CONFLICTS_MODAL_CANCEL = i18n.translate(
  'xpack.securitySolution.detectionEngine.upgradeConflictsModal.cancelTitle',
  {
    defaultMessage: 'Cancel',
  }
);

export const UPGRADE_RULES_WITHOUT_CONFLICTS = (rulesCount: number) =>
  i18n.translate(
    'xpack.securitySolution.detectionEngine.upgradeConflictsModal.upgradeRulesWithoutConflicts',
    {
      defaultMessage: 'Update {rulesCount, plural, =1 {rule} other {rules}} without conflicts',
      values: { rulesCount },
    }
  );

export const UPGRADE_RULES_WITH_CONFLICTS = (numOfRules: number) =>
  i18n.translate(
    'xpack.securitySolution.detectionEngine.upgradeConflictsModal.upgradeRulesWithConflicts',
    {
      defaultMessage: 'Update {numOfRules, plural, =1 {rule} other {rules}}',
      values: { numOfRules },
    }
  );

export const UPGRADE_ALL_RULES_TO_TARGET = (numOfRules: number) =>
  i18n.translate(
    'xpack.securitySolution.detectionEngine.upgradeConflictsModal.upgradeAllRulesToTarget',
    {
      defaultMessage: "Update {numOfRules, plural, =1 {rule} other {rules}} to Elastic's version",
      values: { numOfRules },
    }
  );

export const RULES_WITH_COVERAGE_LOSS_TOTAL = (numOfRulesWithCoverageLoss: number) => (
  <FormattedMessage
    id="xpack.securitySolution.detectionEngine.upgradeConflictsModal.rulesWithCoverageLossTotal"
    defaultMessage="Rules that will stop using an existing machine learning job: {numOfRulesWithCoverageLossStrong}"
    values={{
      numOfRulesWithCoverageLossStrong: <strong>{numOfRulesWithCoverageLoss}</strong>,
    }}
  />
);

export const RULES_WITH_COVERAGE_LOSS_GUIDANCE = (numOfRulesWithCoverageLoss: number) => (
  <FormattedMessage
    id="xpack.securitySolution.detectionEngine.upgradeConflictsModal.rulesWithCoverageLossGuidance"
    defaultMessage="Updating {numOfRulesWithCoverageLossStrong} {numOfRulesWithCoverageLoss, plural, =1 {rule} other {rules}} will repoint {numOfRulesWithCoverageLoss, plural, =1 {it} other {them}} to a newer machine learning job, so {numOfRulesWithCoverageLoss, plural, =1 {it} other {they}} will stop using your existing {numOfRulesWithCoverageLoss, plural, =1 {job} other {jobs}} and anomaly detection coverage may be lost. Update to Elastic's version to accept this, or update only the rules without conflicts and address {numOfRulesWithCoverageLoss, plural, =1 {this rule} other {these rules}} separately."
    values={{
      numOfRulesWithCoverageLoss,
      numOfRulesWithCoverageLossStrong: <strong>{numOfRulesWithCoverageLoss}</strong>,
    }}
  />
);

export const RULES_WITH_NON_SOLVABLE_CONFLICTS_TOTAL = (
  numOfRulesWithNonSolvableConflicts: number
) => (
  <FormattedMessage
    id="xpack.securitySolution.detectionEngine.upgradeConflictsModal.rulesWithNonSolvableConflictsTotal"
    defaultMessage="Rules with unresolved conflicts: {numOfRulesWithNonSolvableConflictsStrong}"
    values={{
      numOfRulesWithNonSolvableConflictsStrong: (
        <strong>{numOfRulesWithNonSolvableConflicts}</strong>
      ),
    }}
  />
);

export const RULES_WITH_SOLVABLE_CONFLICTS_TOTAL = (numOfRulesWithSolvableConflicts: number) => (
  <FormattedMessage
    id="xpack.securitySolution.detectionEngine.upgradeConflictsModal.rulesWithSolvableConflictsTotal"
    defaultMessage="Rules with auto-resolved conflicts: {numOfRulesWithSolvableConflictsStrong}"
    values={{
      numOfRulesWithSolvableConflictsStrong: <strong>{numOfRulesWithSolvableConflicts}</strong>,
    }}
  />
);

export const RULES_WITHOUT_CONFLICTS_TOTAL = (numOfRulesWithoutConflicts: number) => (
  <FormattedMessage
    id="xpack.securitySolution.detectionEngine.upgradeConflictsModal.rulesWithoutConflictsTotal"
    defaultMessage="Rules without conflicts: {numOfRulesWithoutConflictsStrong}"
    values={{
      numOfRulesWithoutConflictsStrong: <strong>{numOfRulesWithoutConflicts}</strong>,
    }}
  />
);

export const RULES_WITH_NON_SOLVABLE_CONFLICTS_GUIDANCE = (
  numOfRulesWithNonSolvableConflicts: number
) => (
  <FormattedMessage
    id="xpack.securitySolution.detectionEngine.upgradeConflictsModal.rulesWithNonSolvableConflictsGuidance"
    defaultMessage="{numOfRulesWithNonSolvableConflictsStrong} {numOfRulesWithNonSolvableConflicts, plural, =1 {rule} other {rules}} with unresolved {numOfRulesWithNonSolvableConflicts, plural, =1 {conflict} other {conflicts}} can’t be updated until you fix the {numOfRulesWithNonSolvableConflicts, plural, =1 {conflict} other {conflicts}}."
    values={{
      numOfRulesWithNonSolvableConflicts,
      numOfRulesWithNonSolvableConflictsStrong: (
        <strong>{numOfRulesWithNonSolvableConflicts}</strong>
      ),
    }}
  />
);

const ACCEPT_SOLVABLE_CONFLICTS_WARNING = i18n.translate(
  'xpack.securitySolution.detectionEngine.upgradeConflictsModal.acceptSolvableConflictsWarning',
  {
    defaultMessage:
      'Only choose this option if you’re comfortable accepting the fixes Elastic suggested.',
  }
);

export const RULES_WITH_AUTO_RESOLVED_CONFLICTS_GUIDANCE = ({
  numOfRulesWithSolvableConflicts,
  numOfRulesWithoutConflicts,
}: {
  numOfRulesWithSolvableConflicts: number;
  numOfRulesWithoutConflicts: number;
}) => {
  const docsUrl = useKibana().services.docLinks.links.securitySolution.resolvePrebuiltRuleConflicts;

  return (
    <>
      <div>
        <FormattedMessage
          id="xpack.securitySolution.detectionEngine.upgradeConflictsModal.rulesWithAutoResolvedConflictsGuidance"
          defaultMessage="{numOfRulesWithSolvableConflictsStrong} {numOfRulesWithSolvableConflicts, plural, =1 {rule} other {rules}} with auto-resolved {numOfRulesWithSolvableConflicts, plural, =1 {conflict} other {conflicts}} can still be updated. Choose one of the following options:"
          values={{
            numOfRulesWithSolvableConflicts,
            numOfRulesWithSolvableConflictsStrong: (
              <strong>{numOfRulesWithSolvableConflicts}</strong>
            ),
          }}
        />
        <ul>
          <li>
            <FormattedMessage
              id="xpack.securitySolution.detectionEngine.upgradeConflictsModal.useRuleUpdateFlyout"
              defaultMessage="Use the rule update flyout to address auto-resolved conflicts. This is the safest option and gives you more control over the final update. {learnMoreLink}"
              values={{
                learnMoreLink: (
                  <EuiLink href={docsUrl} target="_blank">
                    <FormattedMessage
                      id="xpack.securitySolution.detectionEngine.upgradeConflictsModal.learnMore"
                      defaultMessage="Learn more"
                    />
                  </EuiLink>
                ),
              }}
            />
          </li>
          <li>
            <FormattedMessage
              id="xpack.securitySolution.detectionEngine.upgradeConflictsModal.bulkUpdateRules"
              defaultMessage="Click {updateRules} to bulk-update rules with auto-resolved conflicts and rules without conflicts."
              values={{
                updateRules: (
                  <strong>
                    {UPGRADE_RULES_WITH_CONFLICTS(
                      numOfRulesWithSolvableConflicts + numOfRulesWithoutConflicts
                    )}
                  </strong>
                ),
              }}
            />
          </li>
          <EuiCallOut
            title={ACCEPT_SOLVABLE_CONFLICTS_WARNING}
            color="warning"
            iconType="warning"
          />
        </ul>
      </div>
      <br />
    </>
  );
};

export const RULES_WITHOUT_CONFLICTS_GUIDANCE = (numOfRulesWithoutConflicts: number) => (
  <FormattedMessage
    id="xpack.securitySolution.detectionEngine.upgradeConflictsModal.rulesWithoutConflictsGuidance"
    defaultMessage="{numOfRulesWithoutConflictsStrong} {numOfRulesWithoutConflicts, plural, =1 {rule} other {rules}} without conflicts can still be updated by clicking {updateRulesWithoutConflicts}. Choose this option if you only want to update {numOfRulesWithoutConflicts, plural, =1 {the rule} other {rules}} without conflicts."
    values={{
      numOfRulesWithoutConflicts,
      numOfRulesWithoutConflictsStrong: <strong>{numOfRulesWithoutConflicts}</strong>,
      updateRulesWithoutConflicts: (
        <strong>{UPGRADE_RULES_WITHOUT_CONFLICTS(numOfRulesWithoutConflicts)}</strong>
      ),
    }}
  />
);

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
  useGeneratedHtmlId,
} from '@elastic/eui';
import React, { memo, useCallback } from 'react';
import { ConfirmRulesUpgrade } from './use_upgrade_modal';
import * as i18n from './translations';
import { ConflictsDescription, type RulesConflictStats } from './conflicts_description';

export interface UpgradeWithConflictsModalProps extends RulesConflictStats {
  /**
   * When `true`, offers an "Update all to Elastic's version" action for the non-solvable
   * (ML coverage-loss) conflicts. Used on the below-Enterprise path.
   */
  canUpgradeToTarget?: boolean;
  onCancel: () => void;
  onConfirm: (result: ConfirmRulesUpgrade) => void;
}

export const UpgradeWithConflictsModal = memo(function ConfirmUpgradeWithConflictsModal({
  numOfRulesWithoutConflicts,
  numOfRulesWithSolvableConflicts,
  numOfRulesWithNonSolvableConflicts,
  canUpgradeToTarget = false,
  onCancel,
  onConfirm,
}: UpgradeWithConflictsModalProps): JSX.Element {
  const confirmUpgradingRulesWithoutConflicts = useCallback(
    () => onConfirm(ConfirmRulesUpgrade.WithoutConflicts),
    [onConfirm]
  );
  const confirmUpgradingRulesWithSolvableConflicts = useCallback(
    () => onConfirm(ConfirmRulesUpgrade.WithSolvableConflicts),
    [onConfirm]
  );
  const confirmUpgradingAllRulesToTarget = useCallback(
    () => onConfirm(ConfirmRulesUpgrade.AllToTarget),
    [onConfirm]
  );

  const modalTitleId = useGeneratedHtmlId();

  return (
    <EuiModal
      data-test-subj="upgradeConflictsModal"
      onClose={onCancel}
      aria-labelledby={modalTitleId}
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle id={modalTitleId}>
          {i18n.UPGRADE_CONFLICTS_MODAL_TITLE}
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <ConflictsDescription
          numOfRulesWithoutConflicts={numOfRulesWithoutConflicts}
          numOfRulesWithSolvableConflicts={numOfRulesWithSolvableConflicts}
          numOfRulesWithNonSolvableConflicts={numOfRulesWithNonSolvableConflicts}
          canUpgradeToTarget={canUpgradeToTarget}
        />
      </EuiModalBody>

      <EuiModalFooter>
        {numOfRulesWithoutConflicts > 0 && (
          <EuiButton
            onClick={confirmUpgradingRulesWithoutConflicts}
            data-test-subj="conflicts-modal-upgrade-conflict-free-rules"
          >
            {i18n.UPGRADE_RULES_WITHOUT_CONFLICTS(numOfRulesWithoutConflicts)}
          </EuiButton>
        )}
        {numOfRulesWithSolvableConflicts > 0 && (
          <EuiButton
            onClick={confirmUpgradingRulesWithSolvableConflicts}
            color="warning"
            data-test-subj="conflicts-modal-upgrade-rules-with-solvable-conflicts"
          >
            {i18n.UPGRADE_RULES_WITH_CONFLICTS(
              numOfRulesWithoutConflicts + numOfRulesWithSolvableConflicts
            )}
          </EuiButton>
        )}
        {canUpgradeToTarget && numOfRulesWithNonSolvableConflicts > 0 && (
          <EuiButton
            onClick={confirmUpgradingAllRulesToTarget}
            color="warning"
            data-test-subj="conflicts-modal-upgrade-all-rules-to-target"
          >
            {i18n.UPGRADE_ALL_RULES_TO_TARGET(
              numOfRulesWithoutConflicts + numOfRulesWithNonSolvableConflicts
            )}
          </EuiButton>
        )}
        <EuiButtonEmpty onClick={onCancel} data-test-subj="conflicts-modal-cancel">
          {i18n.UPGRADE_CONFLICTS_MODAL_CANCEL}
        </EuiButtonEmpty>
      </EuiModalFooter>
    </EuiModal>
  );
});

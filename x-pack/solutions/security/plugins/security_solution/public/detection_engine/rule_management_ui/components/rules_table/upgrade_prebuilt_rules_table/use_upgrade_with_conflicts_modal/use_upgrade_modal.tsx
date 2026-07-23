/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ReactNode } from 'react';
import React, { useCallback, useState } from 'react';
import { useBoolean } from '@kbn/react-hooks';
import { useAsyncConfirmation } from '../../rules_table/use_async_confirmation';
import type { RulesConflictStats } from './conflicts_description';
import { UpgradeWithConflictsModal } from './upgrade_modal';

export enum ConfirmRulesUpgrade {
  WithoutConflicts = 'WithoutConflicts',
  WithSolvableConflicts = 'WithSolvableConflicts',
  AllToTarget = 'AllToTarget',
}

interface ConfirmConflictsUpgradeOptions {
  /**
   * When `true`, the modal offers an "Update all to Elastic's version" action for rules with
   * non-solvable conflicts. Used on the below-Enterprise path, where those conflicts are ML
   * coverage-loss warnings the user can acknowledge (they can only take the target version).
   */
  canUpgradeToTarget?: boolean;
}

interface UseUpgradeWithConflictsModalResult {
  modal: ReactNode;
  confirmConflictsUpgrade: (
    conflictsStats: RulesConflictStats,
    options?: ConfirmConflictsUpgradeOptions
  ) => Promise<ConfirmRulesUpgrade | boolean>;
}

export function useUpgradeWithConflictsModal(): UseUpgradeWithConflictsModalResult {
  const [isVisible, { on: showModal, off: hideModal }] = useBoolean(false);
  const [initConfirmation, confirm, cancel] = useAsyncConfirmation<ConfirmRulesUpgrade>({
    onInit: showModal,
    onFinish: hideModal,
  });
  const [rulesUpgradeConflictsStats, setRulesUpgradeConflictsStats] = useState<RulesConflictStats>({
    numOfRulesWithoutConflicts: 0,
    numOfRulesWithSolvableConflicts: 0,
    numOfRulesWithNonSolvableConflicts: 0,
  });
  const [canUpgradeToTarget, setCanUpgradeToTarget] = useState(false);

  const confirmConflictsUpgrade = useCallback(
    (conflictsStats: RulesConflictStats, options?: ConfirmConflictsUpgradeOptions) => {
      setRulesUpgradeConflictsStats(conflictsStats);
      setCanUpgradeToTarget(options?.canUpgradeToTarget ?? false);

      return initConfirmation();
    },
    [initConfirmation]
  );

  return {
    modal: isVisible && (
      <UpgradeWithConflictsModal
        {...rulesUpgradeConflictsStats}
        canUpgradeToTarget={canUpgradeToTarget}
        onConfirm={confirm}
        onCancel={cancel}
      />
    ),
    confirmConflictsUpgrade,
  };
}

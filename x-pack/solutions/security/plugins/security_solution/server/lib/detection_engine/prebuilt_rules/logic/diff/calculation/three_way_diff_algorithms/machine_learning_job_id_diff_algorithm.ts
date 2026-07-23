/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  ThreeVersionsOf,
  ThreeWayDiff,
} from '../../../../../../../../common/api/detection_engine/prebuilt_rules';
import {
  ThreeWayDiffConflict,
  ThreeWayMergeOutcome,
} from '../../../../../../../../common/api/detection_engine/prebuilt_rules';
import type { MachineLearningJobId } from '../../../../../../../../common/api/detection_engine/model/rule_schema';
import { isMlJobCoverageLossUpgrade } from '../../../../../../../../common/machine_learning/is_ml_job_coverage_loss_upgrade';
import { simpleDiffAlgorithm } from './simple_diff_algorithm';

/**
 * Diff algorithm for a prebuilt ML rule's `machine_learning_job_id` field.
 *
 * When upgrading a rule would remove a legacy ("affected") ML job that the current version
 * references but the target version no longer does, the diff algorithm will return
 * a `NON_SOLVABLE` conflict and set the merged version to the current one.
 *
 * - We detect such conflicts based on the rule version triad + the hardcoded list of
 * legacy ML jobs. We do not check if the jobs are actually installed.
 * - We do this to prevent a potential loss of detection coverage for ML rule users.
 */
export const machineLearningJobIdDiffAlgorithm = (
  versions: ThreeVersionsOf<MachineLearningJobId>,
  isRuleCustomized: boolean
): ThreeWayDiff<MachineLearningJobId> => {
  const diff = simpleDiffAlgorithm<MachineLearningJobId>(versions, isRuleCustomized);

  const { current_version: currentVersion, target_version: targetVersion } = versions;

  if (isMlJobCoverageLossUpgrade(currentVersion, targetVersion)) {
    return {
      ...diff,
      merged_version: currentVersion,
      merge_outcome: ThreeWayMergeOutcome.Current,
      conflict: ThreeWayDiffConflict.NON_SOLVABLE,
    };
  }

  return diff;
};

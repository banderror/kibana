/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  MachineLearningJobId,
  ThreeVersionsOf,
} from '../../../../../../../../common/api/detection_engine';
import {
  ThreeWayDiffConflict,
  ThreeWayDiffOutcome,
  ThreeWayMergeOutcome,
} from '../../../../../../../../common/api/detection_engine';
import { machineLearningJobIdDiffAlgorithm } from './machine_learning_job_id_diff_algorithm';

// `v2_windows_rare_metadata_user` is in the `affectedJobIds` allowlist; the `_ea` variant and
// `high_count_network_denies` are not.
const AFFECTED_JOB_ID = 'v2_windows_rare_metadata_user';
const REPLACEMENT_JOB_ID = 'v3_windows_rare_metadata_user_ea';
const UNAFFECTED_JOB_ID = 'high_count_network_denies';

describe('machineLearningJobIdDiffAlgorithm', () => {
  describe('when the upgrade drops a legacy (affected) ML job', () => {
    it('forces a NON_SOLVABLE conflict and defaults the merged value to the current one (stock rule)', () => {
      const mockVersions: ThreeVersionsOf<MachineLearningJobId> = {
        base_version: AFFECTED_JOB_ID,
        current_version: AFFECTED_JOB_ID,
        target_version: REPLACEMENT_JOB_ID,
      };

      const result = machineLearningJobIdDiffAlgorithm(mockVersions, false);

      expect(result).toEqual(
        expect.objectContaining({
          has_update: true,
          merged_version: AFFECTED_JOB_ID,
          merge_outcome: ThreeWayMergeOutcome.Current,
          conflict: ThreeWayDiffConflict.NON_SOLVABLE,
          diff_outcome: ThreeWayDiffOutcome.StockValueCanUpdate,
        })
      );
    });

    it('detects a dropped affected job within an array of job ids', () => {
      const mockVersions: ThreeVersionsOf<MachineLearningJobId> = {
        base_version: [AFFECTED_JOB_ID, UNAFFECTED_JOB_ID],
        current_version: [AFFECTED_JOB_ID, UNAFFECTED_JOB_ID],
        target_version: [UNAFFECTED_JOB_ID, REPLACEMENT_JOB_ID],
      };

      const result = machineLearningJobIdDiffAlgorithm(mockVersions, false);

      expect(result).toEqual(
        expect.objectContaining({
          merged_version: [AFFECTED_JOB_ID, UNAFFECTED_JOB_ID],
          merge_outcome: ThreeWayMergeOutcome.Current,
          conflict: ThreeWayDiffConflict.NON_SOLVABLE,
        })
      );
    });

    it('forces NON_SOLVABLE for a customized rule whose affected job is dropped', () => {
      const mockVersions: ThreeVersionsOf<MachineLearningJobId> = {
        base_version: AFFECTED_JOB_ID,
        current_version: [AFFECTED_JOB_ID, 'custom_job'],
        target_version: REPLACEMENT_JOB_ID,
      };

      const result = machineLearningJobIdDiffAlgorithm(mockVersions, true);

      expect(result).toEqual(
        expect.objectContaining({
          merged_version: [AFFECTED_JOB_ID, 'custom_job'],
          merge_outcome: ThreeWayMergeOutcome.Current,
          conflict: ThreeWayDiffConflict.NON_SOLVABLE,
        })
      );
    });
  });

  describe('when the upgrade does not drop a legacy ML job (behaves like simpleDiffAlgorithm)', () => {
    it('returns NONE for a stock update that retains the affected job', () => {
      const mockVersions: ThreeVersionsOf<MachineLearningJobId> = {
        base_version: AFFECTED_JOB_ID,
        current_version: AFFECTED_JOB_ID,
        target_version: [AFFECTED_JOB_ID, REPLACEMENT_JOB_ID],
      };

      const result = machineLearningJobIdDiffAlgorithm(mockVersions, false);

      expect(result).toEqual(
        expect.objectContaining({
          merged_version: [AFFECTED_JOB_ID, REPLACEMENT_JOB_ID],
          merge_outcome: ThreeWayMergeOutcome.Target,
          conflict: ThreeWayDiffConflict.NONE,
          diff_outcome: ThreeWayDiffOutcome.StockValueCanUpdate,
        })
      );
    });

    it('returns NONE for a stock update of a non-affected job', () => {
      const mockVersions: ThreeVersionsOf<MachineLearningJobId> = {
        base_version: UNAFFECTED_JOB_ID,
        current_version: UNAFFECTED_JOB_ID,
        target_version: REPLACEMENT_JOB_ID,
      };

      const result = machineLearningJobIdDiffAlgorithm(mockVersions, false);

      expect(result).toEqual(
        expect.objectContaining({
          merged_version: REPLACEMENT_JOB_ID,
          merge_outcome: ThreeWayMergeOutcome.Target,
          conflict: ThreeWayDiffConflict.NONE,
        })
      );
    });

    it('returns NONE when there is no update, even if an affected job is referenced', () => {
      const mockVersions: ThreeVersionsOf<MachineLearningJobId> = {
        base_version: AFFECTED_JOB_ID,
        current_version: AFFECTED_JOB_ID,
        target_version: AFFECTED_JOB_ID,
      };

      const result = machineLearningJobIdDiffAlgorithm(mockVersions, false);

      expect(result).toEqual(
        expect.objectContaining({
          has_update: false,
          merged_version: AFFECTED_JOB_ID,
          conflict: ThreeWayDiffConflict.NONE,
          diff_outcome: ThreeWayDiffOutcome.StockValueNoUpdate,
        })
      );
    });
  });
});

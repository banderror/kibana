/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ThreeWayDiffConflict } from '../../../../common/api/detection_engine';

/**
 * Job ids used by the fixtures. `AFFECTED_JOB_ID` is in the hardcoded
 * `common/machine_learning/affected_job_ids.ts` allowlist (a legacy job); the `_ea` ids are not.
 * Upgrading a rule from an affected job to a non-affected one is what surfaces the coverage-loss
 * conflict.
 */
export const AFFECTED_JOB_ID = 'v2_windows_rare_metadata_user';
export const REPLACEMENT_JOB_ID = 'v3_windows_rare_metadata_user_ea';
export const NON_AFFECTED_JOB_ID = 'v3_windows_rare_metadata_user_ea';
export const NON_AFFECTED_JOB_ID_2 = 'v3_linux_rare_metadata_user_ea';
/** A user-added custom job id used to make fixture B a customized rule. Not in the allowlist. */
export const CUSTOM_ML_JOB_ID = 'custom_ml_job';

export const INSTALLED_VERSION = 1;
export const TARGET_VERSION = 2;

/**
 * Expected conflict on the `machine_learning_job_id` field once the seeded rule is reviewed for
 * upgrade. `ABSENT` means the field is not part of the diff at all (used for the non-ML control).
 */
export const FIELD_ABSENT = 'ABSENT' as const;
export type ExpectedMlJobConflict =
  | ThreeWayDiffConflict.NON_SOLVABLE
  | ThreeWayDiffConflict.NONE
  | typeof FIELD_ABSENT;

export interface SeederFixture {
  /** Unique custom rule id (won't collide with real prebuilt rules). */
  ruleId: string;
  /** Human-readable base name; the version suffix is appended per asset. */
  name: string;
  /** Type-specific fields for the installed (v1) asset — becomes base + current. */
  installed: Record<string, unknown>;
  /** Type-specific fields for the target (v2) asset. */
  target: Record<string, unknown>;
  /** Optional patch applied to the installed rule to make it a customized rule. */
  patch?: Record<string, unknown>;
  /** What we expect the upgrade review to report for `machine_learning_job_id`. */
  expectedMlJobConflict: ExpectedMlJobConflict;
}

const mlFields = (jobIds: string[]): Record<string, unknown> => ({
  type: 'machine_learning',
  anomaly_threshold: 50,
  machine_learning_job_id: jobIds,
});

/**
 * The four fixtures the seeder installs. Each is published as a v1 ("installed") asset and a v2
 * ("target") asset so it shows up as upgradeable. Together they demonstrate that the coverage-loss
 * conflict fires only when a legacy ML job would actually be dropped.
 */
export const FIXTURES: readonly SeederFixture[] = [
  // A — dropping a legacy job on upgrade => NON_SOLVABLE coverage-loss conflict.
  {
    ruleId: 'test-ml-coverage-loss-upgrade-rule',
    name: 'ML coverage-loss upgrade rule',
    installed: mlFields([AFFECTED_JOB_ID]),
    target: mlFields([REPLACEMENT_JOB_ID]),
    expectedMlJobConflict: ThreeWayDiffConflict.NON_SOLVABLE,
  },
  // B — same drop, but the installed rule is customized (adds a custom job) => still NON_SOLVABLE.
  {
    ruleId: 'test-ml-coverage-loss-customized-rule',
    name: 'ML coverage-loss customized rule',
    installed: mlFields([AFFECTED_JOB_ID]),
    target: mlFields([REPLACEMENT_JOB_ID]),
    patch: { machine_learning_job_id: [AFFECTED_JOB_ID, CUSTOM_ML_JOB_ID] },
    expectedMlJobConflict: ThreeWayDiffConflict.NON_SOLVABLE,
  },
  // C — ML rule repointed between two modern (non-affected) jobs => clean upgrade, no conflict.
  {
    ruleId: 'test-ml-no-conflict-upgrade-rule',
    name: 'ML no-conflict upgrade rule',
    installed: mlFields([NON_AFFECTED_JOB_ID]),
    target: mlFields([NON_AFFECTED_JOB_ID_2]),
    expectedMlJobConflict: ThreeWayDiffConflict.NONE,
  },
  // D — non-ML rule => no machine_learning_job_id field, upgrades normally (original Bug 1 control).
  {
    ruleId: 'test-query-upgrade-rule',
    name: 'Query upgrade rule',
    installed: { type: 'query', query: '*', language: 'kuery', index: ['*'] },
    target: { type: 'query', query: 'event.category: "process"', language: 'kuery', index: ['*'] },
    expectedMlJobConflict: FIELD_ABSENT,
  },
] as const;

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { MachineLearningJobId } from '../api/detection_engine/model/rule_schema/specific_attributes/ml_attributes.gen';
import { affectedJobIds } from './affected_job_ids';

const toArray = (jobIds: MachineLearningJobId): string[] =>
  Array.isArray(jobIds) ? jobIds : [jobIds];

/**
 * Determines whether upgrading a prebuilt ML rule would drop a legacy ("affected")
 * ML job that the current rule version references but the target version no longer does.
 *
 * When this returns `true`, upgrading silently repoints the rule off the installed legacy
 * job onto a new-generation job, orphaning the legacy job and creating a potential
 * detection-coverage gap. This condition is surfaced as a `NON_SOLVABLE` rule-upgrade
 * conflict on the `machine_learning_job_id` field (see the ML job id diff algorithm) rather
 * than through a bespoke blocking modal.
 *
 * The check is purely content-based: it compares the two rule versions against the hardcoded
 * `affectedJobIds` allowlist and does NOT consider which jobs are actually installed. It may
 * therefore flag a rule whose affected job isn't installed — that is harmless (no installed
 * job means no coverage to lose) and keeps this a pure function of the version triad, usable
 * by both the server diff algorithm and the client.
 */
export const isMlJobCoverageLossUpgrade = (
  currentVersion: MachineLearningJobId,
  targetVersion: MachineLearningJobId
): boolean => {
  const currentJobIds = toArray(currentVersion);
  const targetJobIds = new Set(toArray(targetVersion));

  return currentJobIds.some((jobId) => affectedJobIds.includes(jobId) && !targetJobIds.has(jobId));
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Seeds the state needed to reproduce the ML coverage-loss upgrade behavior (#239884 / #279791):
 * a legacy ML job plus prebuilt ML rules whose upgrade would drop that job, surfacing a
 * `machine_learning_job_id` NON_SOLVABLE conflict. Also seeds control fixtures (a clean ML
 * upgrade and a non-ML rule) so you can confirm the conflict fires only when it should.
 *
 * Reusable from `scratchpad.ts`; see the "Seed ML coverage-loss upgrade conflict" example in the
 * quickstart README.
 */

import type { Client as EsClient } from '@elastic/elasticsearch';
import type { KbnClient } from '@kbn/test';
import type { ToolingLog } from '@kbn/tooling-log';
import type { RuleUpgradeInfoForReview } from '../../../../common/api/detection_engine/prebuilt_rules/review_rule_upgrade/review_rule_upgrade_route.gen';
import type { Client as DetectionsClient } from '../../../../common/api/quickstart_client.gen';
import {
  bulkWriteRuleAssets,
  deleteMlJob,
  deleteRuleAssets,
  deleteRuleByRuleId,
  installLegacyMlJob,
  patchRule,
  performInstallSpecificRules,
} from './api';
import { buildRuleAssetDoc, ruleAssetSavedObjectId } from './rule_assets';
import {
  AFFECTED_JOB_ID,
  FIELD_ABSENT,
  FIXTURES,
  INSTALLED_VERSION,
  TARGET_VERSION,
} from './constants';

export interface MlCoverageLossParams {
  esClient: EsClient;
  kbnClient: KbnClient;
  detectionsClient: DetectionsClient;
  log: ToolingLog;
  /**
   * Whether to create the legacy ML job. Defaults to `true`. Set to `false` on a basic-license
   * stack (ML job creation requires a trial/platinum license); the upgrade conflict still
   * reproduces without the job installed, since the diff is content-based.
   */
  createMlJob?: boolean;
}

/**
 * Runs the full seed sequence (order is load-bearing) and verifies the result. Idempotent: it
 * first tears down anything left over from a previous run.
 */
export const seedMlCoverageLossState = async ({
  esClient,
  kbnClient,
  detectionsClient,
  log,
  createMlJob = true,
}: MlCoverageLossParams): Promise<void> => {
  log.info('Seeding ML coverage-loss upgrade state...');

  // 1. Clean slate so re-runs are idempotent (perform-install skips already-installed rules).
  await teardownMlCoverageLossState({ esClient, kbnClient, log, removeMlJob: createMlJob });

  // 2. Legacy ML job (optional — needs a trial/platinum license).
  if (createMlJob) {
    await installLegacyMlJob({ kbnClient, log, jobId: AFFECTED_JOB_ID });
  }

  // 3. Write the v1 assets BEFORE installing, so the real Fleet package is not fetched.
  await bulkWriteRuleAssets({
    esClient,
    log,
    docs: FIXTURES.map((fixture) =>
      buildRuleAssetDoc({
        ruleId: fixture.ruleId,
        version: INSTALLED_VERSION,
        name: `${fixture.name} v${INSTALLED_VERSION}`,
        typeSpecificFields: fixture.installed,
      })
    ),
  });

  // 4. Install v1 as real rules (current version).
  await performInstallSpecificRules({
    kbnClient,
    log,
    rules: FIXTURES.map((fixture) => ({ rule_id: fixture.ruleId, version: INSTALLED_VERSION })),
  });

  // 5. Patch the fixtures that should be customized.
  for (const fixture of FIXTURES) {
    if (fixture.patch) {
      await patchRule({ kbnClient, log, ruleId: fixture.ruleId, patch: fixture.patch });
    }
  }

  // 6. Publish the v2 assets — now version 2 > installed 1, so each rule is upgradeable.
  await bulkWriteRuleAssets({
    esClient,
    log,
    docs: FIXTURES.map((fixture) =>
      buildRuleAssetDoc({
        ruleId: fixture.ruleId,
        version: TARGET_VERSION,
        name: `${fixture.name} v${TARGET_VERSION}`,
        typeSpecificFields: fixture.target,
      })
    ),
  });

  // 7. Verify and log the outcome.
  await verifySeededUpgrades({ detectionsClient, log });

  log.info('Done seeding ML coverage-loss upgrade state.');
};

/**
 * Removes everything the seeder creates: the installed rules, both asset versions of each, and
 * (optionally) the legacy ML job. Safe to run repeatedly — missing resources are ignored.
 */
export const teardownMlCoverageLossState = async ({
  esClient,
  kbnClient,
  log,
  removeMlJob = true,
}: {
  esClient: EsClient;
  kbnClient: KbnClient;
  log: ToolingLog;
  removeMlJob?: boolean;
}): Promise<void> => {
  log.info('Tearing down ML coverage-loss upgrade state...');

  for (const fixture of FIXTURES) {
    await deleteRuleByRuleId({ kbnClient, log, ruleId: fixture.ruleId });
  }

  await deleteRuleAssets({
    esClient,
    log,
    soIds: FIXTURES.flatMap((fixture) =>
      [INSTALLED_VERSION, TARGET_VERSION].map((version) =>
        ruleAssetSavedObjectId(fixture.ruleId, version)
      )
    ),
  });

  if (removeMlJob) {
    await deleteMlJob({ kbnClient, log, jobId: AFFECTED_JOB_ID });
  }
};

/**
 * Reviews the seeded rules for upgrade and logs a per-fixture PASS/FAIL table comparing the
 * expected vs actual `machine_learning_job_id` conflict. Returns `true` if every fixture matches.
 */
export const verifySeededUpgrades = async ({
  detectionsClient,
  log,
}: {
  detectionsClient: DetectionsClient;
  log: ToolingLog;
}): Promise<boolean> => {
  const rulesById = new Map(
    (await fetchUpgradeReviewRules(detectionsClient)).map((rule) => [rule.rule_id, rule])
  );

  const rows: string[] = [];
  let allPass = true;
  for (const fixture of FIXTURES) {
    const info = rulesById.get(fixture.ruleId);
    const actual = getMlJobConflict(info);
    const nonSolvable = info?.diff.num_fields_with_non_solvable_conflicts ?? 0;
    const pass = actual === fixture.expectedMlJobConflict;
    allPass = allPass && pass;
    rows.push(
      `${pass ? 'PASS' : 'FAIL'}  ${fixture.ruleId.padEnd(42)} ml_job_conflict=${actual} ` +
        `(expected ${fixture.expectedMlJobConflict}), non_solvable_fields=${nonSolvable}`
    );
  }

  log.info(`ML coverage-loss seed verification:\n${rows.join('\n')}`);
  if (allPass) {
    log.info('All fixtures match expectations.');
  } else {
    log.error('Some fixtures did not match expectations (see table above).');
  }
  return allPass;
};

const getMlJobConflict = (info: RuleUpgradeInfoForReview | undefined): string => {
  if (!info) {
    return 'NOT_UPGRADEABLE';
  }
  const field = info.diff.fields.machine_learning_job_id as { conflict?: string } | undefined;
  if (!field) {
    return FIELD_ABSENT;
  }
  return field.conflict ?? 'UNKNOWN';
};

const fetchUpgradeReviewRules = async (
  detectionsClient: DetectionsClient
): Promise<RuleUpgradeInfoForReview[]> => {
  const perPage = 500;
  const collected: RuleUpgradeInfoForReview[] = [];
  let page = 1;
  let total = Infinity;
  while (collected.length < total) {
    const { data } = await detectionsClient.reviewRuleUpgrade({
      body: { page, per_page: perPage },
    });
    total = data.total;
    collected.push(...data.rules);
    if (data.rules.length === 0) {
      break;
    }
    page += 1;
  }
  return collected;
};

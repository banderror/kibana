/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AddPrepackagedRulesSchema } from '../../../../../common/detection_engine/prebuilt_rules';
import type { RuleAlertType } from '../../rule_schema';

export const getRulesToInstall = (
  latestPrebuiltRules: Map<string, AddPrepackagedRulesSchema>,
  installedRules: Map<string, RuleAlertType>
) => {
  return Array.from(latestPrebuiltRules.values()).filter(
    (rule) => !installedRules.has(rule.rule_id)
  );
};

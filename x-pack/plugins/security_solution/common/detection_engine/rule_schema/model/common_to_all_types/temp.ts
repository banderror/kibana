/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';

// TODO: https://github.com/elastic/kibana/pull/142950 Split into multiple files

// -------------------------------------------------------------------------------------------------
// Attributes common to all rules (despite of the rule type)

/**
 * TODO: https://github.com/elastic/kibana/pull/142950 Add description
 */
export type IsRuleEnabled = t.TypeOf<typeof IsRuleEnabled>;
export const IsRuleEnabled = t.boolean;

/**
 * TODO: https://github.com/elastic/kibana/pull/142950 Add description
 */
export type IsRuleImmutable = t.TypeOf<typeof IsRuleImmutable>;
export const IsRuleImmutable = t.boolean;

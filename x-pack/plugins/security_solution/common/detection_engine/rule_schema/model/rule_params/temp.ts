/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';
import { NonEmptyString, UUID } from '@kbn/securitysolution-io-ts-types';

// TODO: https://github.com/elastic/kibana/pull/142950 Split into multiple files

// -------------------------------------------------------------------------------------------------
// Attributes common to all rules (despite of the rule type)

/**
 * TODO: https://github.com/elastic/kibana/pull/142950 Add description
 */
export type RuleObjectId = t.TypeOf<typeof RuleObjectId>;
export const RuleObjectId = UUID;

/**
 * TODO: https://github.com/elastic/kibana/pull/142950 Add description
 *
 * NOTE: Never make this a strict uuid, we allow the rule_id to be any string at the moment
 * in case we encounter 3rd party rule systems which might be using auto incrementing numbers
 * or other different things.
 */
export type RuleSignatureId = t.TypeOf<typeof RuleSignatureId>;
export const RuleSignatureId = t.string; // should be non-empty string?

/**
 * TODO: https://github.com/elastic/kibana/pull/142950 Add description
 */
export type RuleName = t.TypeOf<typeof RuleName>;
export const RuleName = NonEmptyString;

/**
 * TODO: https://github.com/elastic/kibana/pull/142950 Add description
 */
export type RuleDescription = t.TypeOf<typeof RuleDescription>;
export const RuleDescription = NonEmptyString;

// Rule authors

type RuleAuthor = t.TypeOf<typeof RuleAuthor>;
const RuleAuthor = t.string;

/**
 * TODO: https://github.com/elastic/kibana/pull/142950 Add description
 */
export type RuleAuthorArray = t.TypeOf<typeof RuleAuthorArray>;
export const RuleAuthorArray = t.array(RuleAuthor);

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

// -------------------------------------------------------------------------------------------------
// Attributes specific to Custom Query and Saved Query rules

// -------------------------------------------------------------------------------------------------
// Attributes specific to EQL rules

/**
 * TODO: https://github.com/elastic/kibana/pull/142950 Add description
 */
export type TimestampField = t.TypeOf<typeof TimestampField>;
export const TimestampField = t.string;

// -------------------------------------------------------------------------------------------------
// Attributes specific to Indicator Match rules

// -------------------------------------------------------------------------------------------------
// Attributes specific to Threshold rules

// -------------------------------------------------------------------------------------------------
// Attributes specific to New Terms rules

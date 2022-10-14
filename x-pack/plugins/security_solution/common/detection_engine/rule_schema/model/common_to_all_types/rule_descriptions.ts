/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';
import { NonEmptyString } from '@kbn/securitysolution-io-ts-types';

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

/**
 * TODO: https://github.com/elastic/kibana/pull/142950 Add description
 */
export type RuleAuthorArray = t.TypeOf<typeof RuleAuthorArray>;
export const RuleAuthorArray = t.array(t.string); // should be non-empty strings?

/**
 * TODO: https://github.com/elastic/kibana/pull/142950 Add description
 */
export type RuleLicense = t.TypeOf<typeof RuleLicense>;
export const RuleLicense = t.string; // should be non-empty string?

/**
 * TODO: https://github.com/elastic/kibana/pull/142950 Add description
 */
export type InvestigationGuide = t.TypeOf<typeof InvestigationGuide>;
export const InvestigationGuide = t.string;

/**
 * Any instructions for the user for setting up their environment in order to start receiving
 * source events for a given rule.
 *
 * It's a multiline text. Markdown is supported.
 */
export type SetupGuide = t.TypeOf<typeof SetupGuide>;
export const SetupGuide = t.string;

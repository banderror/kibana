/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';
import { UUID } from '@kbn/securitysolution-io-ts-types';

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

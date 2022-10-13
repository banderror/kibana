/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';

/**
 * Any instructions for the user for setting up their environment in order to start receiving
 * source events for a given rule.
 *
 * It's a multiline text. Markdown is supported.
 */
export type SetupGuide = t.TypeOf<typeof SetupGuide>;
export const SetupGuide = t.string;

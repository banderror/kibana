/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IEvent as IEventLogEvent } from '../../../../../../event_log/server';

// https://www.elastic.co/guide/en/ecs/1.9/ecs-guidelines.html
// https://www.elastic.co/guide/en/ecs/1.9/ecs-category-field-values-reference.html
// https://www.elastic.co/guide/en/ecs/1.9/ecs-field-reference.html

// NOTE: This weird type intersection is a workaround to make (keyof IEventLogEvent) expression work properly.
// For some reason, (keyof IEventLogEvent) returns never without using this workaround.
export type IEcsEvent = IEventLogEvent & {};

export type EcsEventKey = keyof IEcsEvent;
export type EcsEventBaseKey = '@timestamp' | 'message' | 'tags';
export type EcsEventObjectKey = Exclude<EcsEventKey, EcsEventBaseKey>;

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Find Attack discoveries API endpoint
 *   version: 1
 */

import { z } from '@kbn/zod';
import { ArrayFromString, BooleanFromString } from '@kbn/zod-helpers';

import { SortOrder } from '../common_attributes.gen';
import { AttackDiscoveryAlert } from './attack_discovery_alert.gen';

export type AttackDiscoveryFindSortField = z.infer<typeof AttackDiscoveryFindSortField>;
export const AttackDiscoveryFindSortField = z.literal('@timestamp');

export type AttackDiscoveryFindRequestQuery = z.infer<typeof AttackDiscoveryFindRequestQuery>;
export const AttackDiscoveryFindRequestQuery = z.object({
  /**
   * filter by alert ids within attack discovery
   */
  alert_ids: ArrayFromString(z.string()).optional(),
  /**
   * filter by connector names
   */
  connector_names: ArrayFromString(z.string()).optional(),
  /**
   * filter by end date (relative or absolute)
   */
  end: z.string().optional(),
  /**
   * filter by Attack discovery IDs
   */
  ids: ArrayFromString(z.string()).optional(),
  /**
   * Page number
   */
  page: z.coerce.number().int().min(1).optional().default(1),
  /**
   * Attack discoveries per page
   */
  per_page: z.coerce.number().int().min(0).optional().default(10),
  /**
   * filter by search query
   */
  search: z.string().optional(),
  /**
   * `undefined`: show both shared, and only visible to me Attack discoveries. `true`: show only shared Attack discoveries. `false`: show only visible to me Attack discoveries.
   */
  shared: BooleanFromString.optional(),
  /**
   * Field to sort by
   */
  sort_field: AttackDiscoveryFindSortField.optional().default('@timestamp'),
  /**
   * Sort order
   */
  sort_order: SortOrder.optional().default('desc'),
  /**
   * filter by start date (relative or absolute)
   */
  start: z.string().optional(),
  /**
   * filter by kibana.alert.workflow.status
   */
  status: ArrayFromString(z.enum(['acknowledged', 'closed', 'open'])).optional(),
  /**
   * whether to include attack alert IDs in the response
   */
  include_unique_alert_ids: BooleanFromString.optional(),
});
export type AttackDiscoveryFindRequestQueryInput = z.input<typeof AttackDiscoveryFindRequestQuery>;

export type AttackDiscoveryFindResponse = z.infer<typeof AttackDiscoveryFindResponse>;
export const AttackDiscoveryFindResponse = z.object({
  connector_names: z.array(z.string()),
  data: z.array(AttackDiscoveryAlert),
  page: z.number().int(),
  per_page: z.number().int().optional(),
  total: z.number().int(),
  unique_alert_ids_count: z.number().int(),
  unique_alert_ids: z.array(z.string()).optional(),
});

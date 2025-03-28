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
 *   title: Find list items API endpoint
 *   version: 2023-10-31
 */

import { z } from '@kbn/zod';
import { isNonEmptyString } from '@kbn/zod-helpers';

import { ListId } from '../model/list_common.gen';
import { ListItem } from '../model/list_schemas.gen';

/**
 * Returns the items that come after the last item returned in the previous call (use the `cursor` value returned in the previous call). This parameter uses the `tie_breaker_id` field to ensure all items are sorted and returned correctly.
 */
export type FindListItemsCursor = z.infer<typeof FindListItemsCursor>;
export const FindListItemsCursor = z.string().min(1).superRefine(isNonEmptyString);

export type FindListItemsFilter = z.infer<typeof FindListItemsFilter>;
export const FindListItemsFilter = z.string();

export type FindListItemsRequestQuery = z.infer<typeof FindListItemsRequestQuery>;
export const FindListItemsRequestQuery = z.object({
  list_id: ListId,
  /**
   * The page number to return.
   */
  page: z.coerce.number().int().optional(),
  /**
   * The number of list items to return per page.
   */
  per_page: z.coerce.number().int().optional(),
  /**
   * Determines which field is used to sort the results.
   */
  sort_field: z.string().min(1).superRefine(isNonEmptyString).optional(),
  /**
   * Determines the sort order, which can be `desc` or `asc`
   */
  sort_order: z.enum(['desc', 'asc']).optional(),
  cursor: FindListItemsCursor.optional(),
  /** 
      * Filters the returned results according to the value of the specified field,
using the <field name>:<field value> syntax.
 
      */
  filter: FindListItemsFilter.optional(),
});
export type FindListItemsRequestQueryInput = z.input<typeof FindListItemsRequestQuery>;

export type FindListItemsResponse = z.infer<typeof FindListItemsResponse>;
export const FindListItemsResponse = z.object({
  data: z.array(ListItem),
  page: z.number().int().min(0),
  per_page: z.number().int().min(0),
  total: z.number().int().min(0),
  cursor: FindListItemsCursor,
});

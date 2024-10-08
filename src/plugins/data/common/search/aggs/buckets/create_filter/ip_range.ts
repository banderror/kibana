/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { buildRangeFilter, RangeFilterParams } from '@kbn/es-query';
import { CidrMask } from '../lib/cidr_mask';
import { IBucketAggConfig } from '../bucket_agg_type';
import { IpRangeKey } from '../lib/ip_range';

export const createFilterIpRange = (aggConfig: IBucketAggConfig, key: IpRangeKey) => {
  let range: RangeFilterParams;

  if (key.type === 'mask') {
    range = new CidrMask(key.mask).getRange();
  } else {
    range = {
      from: key.from ? key.from : -Infinity,
      to: key.to ? key.to : Infinity,
    };
  }

  return buildRangeFilter(
    aggConfig.params.field,
    { gte: range.from, lte: range.to },
    aggConfig.getIndexPattern()
  );
};

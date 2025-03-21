/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { estypes } from '@elastic/elasticsearch';
import type { ESQLSearchResponse } from '@kbn/es-types';
import type { Start as InspectorStartContract, RequestAdapter } from '@kbn/inspector-plugin/public';
import type { SearchResponseWarning } from './types';

/**
 * @internal
 */
export function extractWarnings(
  rawResponse: estypes.SearchResponse | ESQLSearchResponse,
  inspectorService: InspectorStartContract,
  requestAdapter: RequestAdapter,
  requestName: string,
  requestId?: string
): SearchResponseWarning[] {
  const warnings: SearchResponseWarning[] = [];

  // ES|QL supports _clusters in case of CCS but doesnt support _shards and timed_out (yet)
  const isPartial = rawResponse._clusters
    ? rawResponse._clusters.partial > 0 ||
      rawResponse._clusters.skipped > 0 ||
      rawResponse._clusters.running > 0
    : ('timed_out' in rawResponse && rawResponse.timed_out) ||
      ('_shards' in rawResponse && rawResponse._shards.failed > 0);
  if (isPartial) {
    warnings.push({
      type: 'incomplete',
      requestName,
      clusters: rawResponse._clusters
        ? rawResponse._clusters.details ?? {}
        : {
            '(local)': {
              status: 'partial',
              indices: '',
              took: rawResponse.took,
              timed_out: 'timed_out' in rawResponse && rawResponse.timed_out,
              ...('_shards' in rawResponse
                ? { _shards: rawResponse._shards, failures: rawResponse._shards.failures }
                : {}),
            },
          },
      openInInspector: () => {
        inspectorService.open(
          {
            requests: requestAdapter,
          },
          {
            options: {
              initialRequestId: requestId,
              initialTabs: ['clusters', 'response'],
            },
          }
        );
      },
    });
  }

  return warnings;
}

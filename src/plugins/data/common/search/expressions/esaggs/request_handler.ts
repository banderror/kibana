/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { KibanaExecutionContext } from '@kbn/core/public';
import { i18n } from '@kbn/i18n';
import { defer } from 'rxjs';
import { map, switchMap } from 'rxjs';
import { Adapters } from '@kbn/inspector-plugin/common';
import type { DataView } from '@kbn/data-views-plugin/common';
import type { Filter, TimeRange } from '@kbn/es-query';

import { calculateBounds, Query } from '../../..';

import { IAggConfigs } from '../../aggs';
import { ISearchStartSearchSource } from '../../search_source';
import { tabifyAggResponse } from '../../tabify';

export interface RequestHandlerParams {
  abortSignal?: AbortSignal;
  aggs: IAggConfigs;
  filters?: Filter[];
  indexPattern?: DataView;
  inspectorAdapters: Adapters;
  query?: Query;
  searchSessionId?: string;
  searchSourceService: ISearchStartSearchSource;
  timeFields?: string[];
  timeRange?: TimeRange;
  disableWarningToasts?: boolean;
  getNow?: () => Date;
  executionContext?: KibanaExecutionContext;
  title?: string;
  description?: string;
}

export const handleRequest = ({
  abortSignal,
  aggs,
  filters,
  indexPattern,
  inspectorAdapters,
  query,
  searchSessionId,
  searchSourceService,
  timeFields,
  timeRange,
  disableWarningToasts,
  getNow,
  executionContext,
  title,
  description,
}: RequestHandlerParams) => {
  return defer(async () => {
    const forceNow = getNow?.();
    const searchSource = await searchSourceService.create();

    searchSource.setField('index', indexPattern);
    searchSource.setField('size', 0);

    const timeFilterSearchSource = searchSource.createChild({ callParentStartHandlers: true });
    const requestSearchSource = timeFilterSearchSource.createChild({
      callParentStartHandlers: true,
    });

    // If timeFields have been specified, use the specified ones, otherwise use primary time field of index
    // pattern if it's available.
    const defaultTimeField = indexPattern?.getTimeField?.();
    const defaultTimeFields = defaultTimeField ? [defaultTimeField.name] : [];
    const allTimeFields = timeFields?.length ? timeFields : defaultTimeFields;

    aggs.setTimeRange(timeRange as TimeRange);
    aggs.setForceNow(forceNow);
    aggs.setTimeFields(allTimeFields);

    // For now we need to mirror the history of the passed search source, since
    // the request inspector wouldn't work otherwise.
    Object.defineProperty(requestSearchSource, 'history', {
      get() {
        return searchSource.history;
      },
      set(history) {
        return (searchSource.history = history);
      },
    });

    requestSearchSource.setField('aggs', aggs);

    requestSearchSource.onRequestStart((paramSearchSource, options) => {
      return aggs.onSearchRequestStart(paramSearchSource, options);
    });

    // If a timeRange has been specified and we had at least one timeField available, create range
    // filters for that those time fields
    if (timeRange && allTimeFields.length > 0) {
      timeFilterSearchSource.setField('filter', () => {
        return aggs.getSearchSourceTimeFilter(forceNow);
      });
    }

    requestSearchSource.setField('filter', filters);
    requestSearchSource.setField('query', query);

    return { allTimeFields, forceNow, requestSearchSource };
  }).pipe(
    switchMap(({ allTimeFields, forceNow, requestSearchSource }) =>
      requestSearchSource
        .fetch$({
          abortSignal,
          disableWarningToasts,
          sessionId: searchSessionId,
          inspector: {
            adapter: inspectorAdapters.requests,
            title:
              title ??
              i18n.translate('data.functions.esaggs.inspector.dataRequest.title', {
                defaultMessage: 'Data',
              }),
            description:
              description ??
              i18n.translate('data.functions.esaggs.inspector.dataRequest.description', {
                defaultMessage:
                  'This request queries Elasticsearch to fetch the data for the visualization.',
              }),
          },
          executionContext,
        })
        .pipe(
          map(({ rawResponse: response }) => {
            const parsedTimeRange = timeRange ? calculateBounds(timeRange, { forceNow }) : null;
            const tabifyParams = {
              metricsAtAllLevels: aggs.hierarchical,
              partialRows: aggs.partialRows,
              timeRange: parsedTimeRange
                ? { from: parsedTimeRange.min, to: parsedTimeRange.max, timeFields: allTimeFields }
                : undefined,
            };

            return tabifyAggResponse(aggs, response, tabifyParams);
          })
        )
    )
  );
};

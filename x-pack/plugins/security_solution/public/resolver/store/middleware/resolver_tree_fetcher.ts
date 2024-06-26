/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Dispatch, MiddlewareAPI } from 'redux';
import type {
  ResolverEntityIndex,
  ResolverNode,
  NewResolverTree,
  ResolverSchema,
} from '../../../../common/endpoint/types';
import type { DataAccessLayer } from '../../types';
import * as selectors from '../selectors';
import { firstNonNullValue } from '../../../../common/endpoint/models/ecs_safety_helpers';
import { ancestorsRequestAmount, descendantsRequestAmount } from '../../models/resolver_tree';

import {
  appRequestedResolverData,
  serverFailedToReturnResolverData,
  appAbortedResolverDataRequest,
  serverReturnedResolverData,
} from '../data/action';
import type { State } from '../../../common/store/types';

/**
 * A function that handles syncing ResolverTree data w/ the current entity ID.
 * This will make a request anytime the entityID changes (to something other than undefined.)
 * If the entity ID changes while a request is in progress, the in-progress request will be cancelled.
 * Call the returned function after each state transition.
 * This is a factory because it is stateful and keeps that state in closure.
 */
export function ResolverTreeFetcher(
  dataAccessLayer: DataAccessLayer,
  api: MiddlewareAPI<Dispatch, State>
): (id: string) => void {
  let lastRequestAbortController: AbortController | undefined;
  // Call this after each state change.
  // This fetches the ResolverTree for the current entityID
  // if the entityID changes while
  return async (id: string) => {
    // const id = 'alerts-page';
    const state = api.getState();
    let databaseParameters = selectors.treeParametersToFetch(state.analyzer[id]);
    if (selectors.treeRequestParametersToAbort(state.analyzer[id]) && lastRequestAbortController) {
      lastRequestAbortController.abort();
      // calling abort will cause an action to be fired
    } else if (databaseParameters !== null) {
      lastRequestAbortController = new AbortController();
      let entityIDToFetch: string | undefined;
      let dataSource: string | undefined;
      let dataSourceSchema: ResolverSchema | undefined;
      let dataSourceAgentId: string | undefined;
      let result: ResolverNode[] | undefined;
      const timeRangeFilters = selectors.timeRangeFilters(state.analyzer[id]);
      // Inform the state that we've made the request. Without this, the middleware will try to make the request again
      // immediately.
      api.dispatch(appRequestedResolverData({ id, parameters: databaseParameters }));
      try {
        const matchingEntities: ResolverEntityIndex = await dataAccessLayer.entities({
          _id: databaseParameters.databaseDocumentID,
          indices: databaseParameters.indices,
          signal: lastRequestAbortController.signal,
        });

        if (matchingEntities.length < 1) {
          // If no entity_id could be found for the _id, bail out with a failure.
          api.dispatch(
            serverFailedToReturnResolverData({
              id,
              parameters: databaseParameters,
            })
          );
          return;
        }
        ({
          id: entityIDToFetch,
          schema: dataSourceSchema,
          name: dataSource,
          agentId: dataSourceAgentId,
        } = matchingEntities[0]);

        databaseParameters = {
          ...databaseParameters,
          agentId: dataSourceAgentId ?? '',
        };
        result = await dataAccessLayer.resolverTree({
          dataId: entityIDToFetch,
          schema: dataSourceSchema,
          timeRange: timeRangeFilters,
          indices: databaseParameters.indices,
          ancestors: ancestorsRequestAmount(dataSourceSchema),
          descendants: descendantsRequestAmount(),
          agentId: databaseParameters.agentId,
        });

        const resolverTree: NewResolverTree = {
          originID: entityIDToFetch,
          nodes: result,
        };

        if (resolverTree.nodes.length === 0) {
          const unboundedTree = await dataAccessLayer.resolverTree({
            dataId: entityIDToFetch,
            schema: dataSourceSchema,
            indices: databaseParameters.indices,
            ancestors: ancestorsRequestAmount(dataSourceSchema),
            descendants: descendantsRequestAmount(),
            agentId: databaseParameters.agentId,
          });
          if (unboundedTree.length > 0) {
            const timestamps = unboundedTree
              .map((event) => firstNonNullValue(event.data['@timestamp']))
              .sort();
            const oldestTimestamp = timestamps[0];
            const newestTimestamp = timestamps.slice(-1);
            api.dispatch(
              serverReturnedResolverData({
                id,
                result: { ...resolverTree, nodes: unboundedTree },
                dataSource,
                schema: dataSourceSchema,
                parameters: databaseParameters,
                detectedBounds: {
                  from: String(oldestTimestamp),
                  to: String(newestTimestamp),
                },
              })
            );

            // 0 results with unbounded query, fail as before
          } else {
            api.dispatch(
              serverReturnedResolverData({
                id,
                result: resolverTree,
                dataSource,
                schema: dataSourceSchema,
                parameters: databaseParameters,
              })
            );
          }
        } else {
          api.dispatch(
            serverReturnedResolverData({
              id,
              result: resolverTree,
              dataSource,
              schema: dataSourceSchema,
              parameters: databaseParameters,
            })
          );
        }
      } catch (error) {
        // https://developer.mozilla.org/en-US/docs/Web/API/DOMException#exception-AbortError
        if (error instanceof DOMException && error.name === 'AbortError') {
          api.dispatch(
            appAbortedResolverDataRequest({
              id,
              parameters: databaseParameters,
            })
          );
        } else {
          api.dispatch(
            serverFailedToReturnResolverData({
              id,
              parameters: databaseParameters,
            })
          );
        }
      }
    }
  };
}

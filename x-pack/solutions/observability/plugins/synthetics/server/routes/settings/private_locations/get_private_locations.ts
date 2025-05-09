/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { SavedObjectsErrorHelpers } from '@kbn/core/server';
import { SavedObjectsClientContract } from '@kbn/core-saved-objects-api-server';
import { schema } from '@kbn/config-schema';
import { migrateLegacyPrivateLocations } from './migrate_legacy_private_locations';
import { AgentPolicyInfo } from '../../../../common/types';
import { SyntheticsRestApiRouteFactory } from '../../types';
import { PrivateLocation, SyntheticsPrivateLocations } from '../../../../common/runtime_types';
import { SYNTHETICS_API_URLS } from '../../../../common/constants';
import { getPrivateLocations } from '../../../synthetics_service/get_private_locations';
import type { SyntheticsPrivateLocationsAttributes } from '../../../runtime_types/private_locations';
import { SyntheticsMonitorClient } from '../../../synthetics_service/synthetics_monitor/synthetics_monitor_client';
import { allLocationsToClientContract } from './helpers';

export const getPrivateLocationsRoute: SyntheticsRestApiRouteFactory<
  SyntheticsPrivateLocations | PrivateLocation
> = () => ({
  method: 'GET',
  path: SYNTHETICS_API_URLS.PRIVATE_LOCATIONS + '/{id?}',
  validate: {},
  validation: {
    request: {
      params: schema.object({
        id: schema.maybe(schema.string()),
      }),
    },
  },
  handler: async (routeContext) => {
    const { savedObjectsClient, syntheticsMonitorClient, request, response, server } = routeContext;

    const internalSOClient = server.coreStart.savedObjects.createInternalRepository();
    await migrateLegacyPrivateLocations(internalSOClient, server.logger);

    const { id } = request.params as { id?: string };

    const { locations, agentPolicies } = await getPrivateLocationsAndAgentPolicies(
      savedObjectsClient,
      syntheticsMonitorClient
    );
    const list = allLocationsToClientContract({ locations }, agentPolicies);
    if (!id) return list;
    const location = list.find((loc) => loc.id === id || loc.label === id);
    if (!location) {
      return response.notFound({
        body: {
          message: `Private location with id or label "${id}" not found`,
        },
      });
    }
    return location;
  },
});

export const getPrivateLocationsAndAgentPolicies = async (
  savedObjectsClient: SavedObjectsClientContract,
  syntheticsMonitorClient: SyntheticsMonitorClient,
  excludeAgentPolicies = false
): Promise<SyntheticsPrivateLocationsAttributes & { agentPolicies: AgentPolicyInfo[] }> => {
  try {
    const [privateLocations, agentPolicies] = await Promise.all([
      getPrivateLocations(savedObjectsClient),
      excludeAgentPolicies
        ? new Promise<void>((resolve) => resolve())
        : syntheticsMonitorClient.privateLocationAPI.getAgentPolicies(),
    ]);
    return {
      locations: privateLocations || [],
      agentPolicies: agentPolicies || [],
    };
  } catch (error) {
    if (SavedObjectsErrorHelpers.isNotFoundError(error)) {
      return { locations: [], agentPolicies: [] };
    }
    throw error;
  }
};

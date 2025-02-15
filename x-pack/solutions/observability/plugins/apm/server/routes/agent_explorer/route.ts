/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';
import { getApmEventClient } from '../../lib/helpers/get_apm_event_client';
import { getRandomSampler } from '../../lib/helpers/get_random_sampler';
import { createApmServerRoute } from '../apm_routes/create_apm_server_route';
import { environmentRt, kueryRt, probabilityRt, rangeRt } from '../default_api_types';
import type { AgentExplorerAgentsResponse } from './get_agents';
import { getAgents } from './get_agents';
import type { AgentExplorerAgentInstancesResponse } from './get_agent_instances';
import { getAgentInstances } from './get_agent_instances';
import type { AgentLatestVersionsResponse } from './fetch_agents_latest_version';
import { fetchAgentsLatestVersion } from './fetch_agents_latest_version';

const agentExplorerRoute = createApmServerRoute({
  endpoint: 'GET /internal/apm/get_agents_per_service',
  security: { authz: { requiredPrivileges: ['apm'] } },
  params: t.type({
    query: t.intersection([
      environmentRt,
      kueryRt,
      rangeRt,
      probabilityRt,
      t.partial({
        serviceName: t.string,
        agentLanguage: t.string,
      }),
    ]),
  }),
  async handler(resources): Promise<AgentExplorerAgentsResponse> {
    const { params, request, core } = resources;

    const { environment, kuery, start, end, probability, serviceName, agentLanguage } =
      params.query;

    const coreStart = await core.start();

    const [apmEventClient, randomSampler] = await Promise.all([
      getApmEventClient(resources),
      getRandomSampler({ coreStart, request, probability }),
    ]);

    return getAgents({
      environment,
      serviceName,
      agentLanguage,
      kuery,
      apmEventClient,
      start,
      end,
      randomSampler,
    });
  },
});

const latestAgentVersionsRoute = createApmServerRoute({
  endpoint: 'GET /internal/apm/get_latest_agent_versions',
  security: { authz: { requiredPrivileges: ['apm'] } },
  async handler(resources): Promise<AgentLatestVersionsResponse> {
    const { logger, config } = resources;

    return fetchAgentsLatestVersion(logger, config.latestAgentVersionsUrl);
  },
});

const agentExplorerInstanceRoute = createApmServerRoute({
  endpoint: 'GET /internal/apm/services/{serviceName}/agent_instances',
  security: { authz: { requiredPrivileges: ['apm'] } },
  params: t.type({
    path: t.type({ serviceName: t.string }),
    query: t.intersection([environmentRt, kueryRt, rangeRt, probabilityRt]),
  }),
  async handler(resources): Promise<{
    items: AgentExplorerAgentInstancesResponse;
  }> {
    const { params } = resources;

    const { environment, kuery, start, end } = params.query;

    const { serviceName } = params.path;

    const apmEventClient = await getApmEventClient(resources);

    return {
      items: await getAgentInstances({
        environment,
        serviceName,
        kuery,
        apmEventClient,
        start,
        end,
      }),
    };
  },
});

export const agentExplorerRouteRepository = {
  ...agentExplorerRoute,
  ...latestAgentVersionsRoute,
  ...agentExplorerInstanceRoute,
};

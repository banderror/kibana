/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import Path from 'path';

import {
  type TestElasticsearchUtils,
  type TestKibanaUtils,
  createRootWithCorePlugins,
  createTestServers,
} from '@kbn/core-test-helpers-kbn-server';

import type { AgentPolicySOAttributes } from '../types';
import { PRECONFIGURATION_DELETION_RECORD_SAVED_OBJECT_TYPE } from '../../common';
import { getAgentPolicySavedObjectType } from '../services/agent_policy';
import { API_VERSIONS } from '../../common/constants';

import { useDockerRegistry, waitForFleetSetup, getSupertestWithAdminUser } from './helpers';

const logFilePath = Path.join(__dirname, 'logs.log');

// Failing 9.0 version update: https://github.com/elastic/kibana/issues/192624
describe('Fleet preconfiguration reset', () => {
  let esServer: TestElasticsearchUtils;
  let kbnServer: TestKibanaUtils;
  let agentPolicyType: string;

  const registryUrl = useDockerRegistry();

  const startServers = async () => {
    const { startES } = createTestServers({
      adjustTimeout: (t) => jest.setTimeout(t),
      settings: {
        es: {
          license: 'trial',
        },
        kbn: {},
      },
    });

    esServer = await startES();
    const startKibana = async () => {
      const root = createRootWithCorePlugins(
        {
          xpack: {
            fleet: {
              registryUrl,
              internal: {
                registry: {
                  kibanaVersionCheckEnabled: false,
                },
              },
              packages: [
                {
                  name: 'fleet_server',
                  version: 'latest',
                },
              ],
              // Preconfigure two policies test-12345 and test-456789
              agentPolicies: [
                {
                  name: 'Elastic Cloud agent policy 0001',
                  description: 'Default agent policy for agents hosted on Elastic Cloud',
                  is_default: false,
                  is_managed: true,
                  id: 'test-12345',
                  namespace: 'default',
                  monitoring_enabled: [],
                  package_policies: [
                    {
                      name: 'fleet_server123456789',
                      package: {
                        name: 'fleet_server',
                      },
                      inputs: [
                        {
                          type: 'fleet-server',
                          keep_enabled: true,
                          vars: [
                            {
                              name: 'host',
                              value: '127.0.0.1',
                              frozen: true,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'Second preconfigured policy',
                  description: 'second policy',
                  is_default: false,
                  is_managed: true,
                  id: 'test-456789',
                  namespace: 'default',
                  monitoring_enabled: [],
                  package_policies: [
                    {
                      name: 'fleet_server987654321',
                      package: {
                        name: 'fleet_server',
                      },
                      inputs: [
                        {
                          type: 'fleet-server',
                          keep_enabled: true,
                          vars: [
                            {
                              name: 'host',
                              value: '127.0.0.1',
                              frozen: true,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          logging: {
            appenders: {
              file: {
                type: 'file',
                fileName: logFilePath,
                layout: {
                  type: 'json',
                },
              },
            },
            loggers: [
              {
                name: 'root',
                appenders: ['file'],
              },
              {
                name: 'plugins.fleet',
                level: 'all',
              },
            ],
          },
        },
        { oss: false }
      );

      await root.preboot();
      const coreSetup = await root.setup();
      const coreStart = await root.start();

      return {
        root,
        coreSetup,
        coreStart,
        stop: async () => await root.shutdown(),
      };
    };
    kbnServer = await startKibana();
    await waitForFleetSetup(kbnServer.root);
  };

  const stopServers = async () => {
    if (kbnServer) {
      await kbnServer.stop();
    }

    if (esServer) {
      await esServer.stop();
    }

    await new Promise((res) => setTimeout(res, 10000));
  };

  // Share the same servers for all the test to make test a lot faster (but test are not isolated anymore)
  beforeAll(async () => {
    await startServers();
    agentPolicyType = await getAgentPolicySavedObjectType();
  });

  afterAll(async () => {
    await stopServers();
  });

  const POLICY_ID = 'test-12345';

  async function addAgents() {
    const esClient = kbnServer.coreStart.elasticsearch.client.asInternalUser;
    await esClient.bulk({
      index: '.fleet-agents',
      body: [
        {
          update: {
            _id: 'agent1',
          },
        },
        {
          doc_as_upsert: true,
          doc: {
            agent: {
              version: '8.5.1',
            },
            last_checkin_status: 'online',
            last_checkin: new Date().toISOString(),
            active: true,
            policy_id: POLICY_ID,
          },
        },
        {
          update: {
            _id: 'agent2',
          },
        },
        {
          doc_as_upsert: true,
          doc: {
            agent: {
              version: '8.5.1',
            },
            last_checkin_status: 'online',
            last_checkin: new Date(Date.now() - 24 * 1000).toISOString(),
            active: true,
            policy_id: POLICY_ID,
          },
        },
      ],
    });
  }

  async function expectAllAgentUnenrolled() {
    const esClient = kbnServer.coreStart.elasticsearch.client.asInternalUser;
    const res = await esClient.search({
      index: '.fleet-agents',
      query: {
        bool: {
          must: {
            terms: {
              policy_id: [POLICY_ID],
            },
          },
        },
      },
    });

    for (const hit of res.hits.hits) {
      expect((hit._source as any).active).toBe(false);
    }
  }

  describe('Reset all policy', () => {
    it('Works and reset all preconfigured policies', async () => {
      const resetAPI = getSupertestWithAdminUser(
        kbnServer.root,
        'post',
        '/internal/fleet/reset_preconfigured_agent_policies'
      );
      await resetAPI
        .set('kbn-sxrf', 'xx')
        .set('Elastic-Api-Version', `${API_VERSIONS.public.v1}`)
        .expect(200)
        .send();

      const agentPolicies = await kbnServer.coreStart.savedObjects
        .createInternalRepository()
        .find<AgentPolicySOAttributes>({
          type: agentPolicyType,
          perPage: 10000,
        });
      expect(agentPolicies.saved_objects).toHaveLength(2);
      expect(agentPolicies.saved_objects.map((ap) => ap.attributes)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Elastic Cloud agent policy 0001',
          }),
          expect.objectContaining({
            name: 'Second preconfigured policy',
          }),
        ])
      );
    });
  });

  describe('Reset one preconfigured policy', () => {
    beforeEach(() => addAgents());
    it('Works and reset one preconfigured policies if the policy is already deleted (with a ghost package policy)', async () => {
      const soClient = kbnServer.coreStart.savedObjects.createInternalRepository();

      await soClient.delete(agentPolicyType, POLICY_ID);

      const oldAgentPolicies = await soClient.find<AgentPolicySOAttributes>({
        type: agentPolicyType,
        perPage: 10000,
      });

      const secondAgentPoliciesUpdatedAt = oldAgentPolicies.saved_objects[0].updated_at;

      const resetAPI = getSupertestWithAdminUser(
        kbnServer.root,
        'post',
        '/internal/fleet/reset_preconfigured_agent_policies/test-12345'
      );

      await resetAPI
        .set('kbn-sxrf', 'xx')
        .set('Elastic-Api-Version', `${API_VERSIONS.public.v1}`)
        .expect(200)
        .send();

      const agentPolicies = await kbnServer.coreStart.savedObjects
        .createInternalRepository()
        .find<AgentPolicySOAttributes>({
          type: agentPolicyType,
          perPage: 10000,
        });
      expect(agentPolicies.saved_objects).toHaveLength(2);
      expect(
        agentPolicies.saved_objects.map((ap) => ({ ...ap.attributes, updated_at: ap.updated_at }))
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Elastic Cloud agent policy 0001',
          }),
          expect.objectContaining({
            name: 'Second preconfigured policy',
            updated_at: secondAgentPoliciesUpdatedAt, // Check that policy was not updated
          }),
        ])
      );
    });

    it('Works if the preconfigured policies already exists with a missing package policy', async () => {
      const soClient = kbnServer.coreStart.savedObjects.createInternalRepository();

      await soClient.update(agentPolicyType, POLICY_ID, {});

      const resetAPI = getSupertestWithAdminUser(
        kbnServer.root,
        'post',
        '/internal/fleet/reset_preconfigured_agent_policies/test-12345'
      );
      await resetAPI
        .set('kbn-sxrf', 'xx')
        .set('Elastic-Api-Version', `${API_VERSIONS.public.v1}`)
        .expect(200)
        .send();

      const agentPolicies = await soClient.find<AgentPolicySOAttributes>({
        type: agentPolicyType,
        perPage: 10000,
      });
      expect(agentPolicies.saved_objects).toHaveLength(2);
      expect(agentPolicies.saved_objects.map((ap) => ap.attributes)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Elastic Cloud agent policy 0001',
          }),
          expect.objectContaining({
            name: 'Second preconfigured policy',
          }),
        ])
      );
      await expectAllAgentUnenrolled();
    });

    it('Works and reset one preconfigured policies if the policy was deleted with a preconfiguration deletion record', async () => {
      const soClient = kbnServer.coreStart.savedObjects.createInternalRepository();

      await soClient.delete(agentPolicyType, POLICY_ID);
      await soClient.create(PRECONFIGURATION_DELETION_RECORD_SAVED_OBJECT_TYPE, {
        id: POLICY_ID,
      });

      const resetAPI = getSupertestWithAdminUser(
        kbnServer.root,
        'post',
        `/internal/fleet/reset_preconfigured_agent_policies/${POLICY_ID}`
      );
      await resetAPI
        .set('kbn-sxrf', 'xx')
        .set('Elastic-Api-Version', `${API_VERSIONS.public.v1}`)
        .expect(200)
        .send();

      const agentPolicies = await kbnServer.coreStart.savedObjects
        .createInternalRepository()
        .find<AgentPolicySOAttributes>({
          type: agentPolicyType,
          perPage: 10000,
        });
      expect(agentPolicies.saved_objects).toHaveLength(2);
      expect(agentPolicies.saved_objects.map((ap) => ({ ...ap.attributes }))).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Elastic Cloud agent policy 0001',
          }),
          expect.objectContaining({
            name: 'Second preconfigured policy',
          }),
        ])
      );
    });
  });
});

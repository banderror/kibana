/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { v4 as uuidV4 } from 'uuid';
import { INGEST_SAVED_OBJECT_INDEX } from '@kbn/core-saved-objects-server';
import { PACKAGE_POLICY_SAVED_OBJECT_TYPE } from '@kbn/fleet-plugin/common/constants';

import { FtrProviderContext } from '../../api_integration/ftr_provider_context';
import { skipIfNoDockerRegistry } from '../helpers';
import { SpaceTestApiClient } from './space_awareness/api_helper';

export default function (providerContext: FtrProviderContext) {
  const { getService } = providerContext;
  const supertest = getService('supertest');
  const es = getService('es');
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const retry = getService('retry');

  describe('fleet_setup', () => {
    skipIfNoDockerRegistry(providerContext);
    before(async () => {
      await kibanaServer.savedObjects.cleanStandardList();
      await esArchiver.load('x-pack/platform/test/fixtures/es_archives/fleet/empty_fleet_server');
    });

    after(async () => {
      await kibanaServer.savedObjects.cleanStandardList();
      await esArchiver.unload('x-pack/platform/test/fixtures/es_archives/fleet/empty_fleet_server');
    });
    beforeEach(async () => {
      try {
        await es.security.deleteUser({
          username: 'fleet_enroll',
        });
      } catch (e) {
        if (e.meta?.statusCode !== 404) {
          throw e;
        }
      }
      try {
        await es.security.deleteRole({
          name: 'fleet_enroll',
        });
      } catch (e) {
        if (e.meta?.statusCode !== 404) {
          throw e;
        }
      }
    });

    it('should install default packages', async () => {
      await supertest.post(`/api/fleet/setup`).set('kbn-xsrf', 'xxxx').expect(200);

      const { body: apiResponse } = await supertest
        .get(`/api/fleet/epm/packages?prerelease=true`)
        .expect(200);
      const installedPackages = apiResponse.items
        .filter((p: any) => p.status === 'installed')
        .map((p: any) => p.name)
        .sort();

      expect(installedPackages).to.eql(['endpoint']);
    });

    describe('upgrade managed package policies', () => {
      const apiClient = new SpaceTestApiClient(supertest);
      before(async () => {
        await apiClient.setup();
        const pkgRes = await apiClient.getPackage({
          pkgName: 'synthetics',
        });
        await apiClient.installPackage({
          pkgName: 'synthetics',
          pkgVersion: pkgRes.item.version,
          force: true,
        });
        await apiClient.updatePackage({
          pkgName: 'synthetics',
          pkgVersion: pkgRes.item.version,
          data: {
            keepPoliciesUpToDate: true,
          },
        });

        const agentPolicyRes = await apiClient.createAgentPolicy();

        await es.bulk({
          index: INGEST_SAVED_OBJECT_INDEX,
          refresh: 'wait_for',
          operations: [...new Array(10).keys()].flatMap((_, index) => [
            {
              create: {
                _id: `${PACKAGE_POLICY_SAVED_OBJECT_TYPE}:${uuidV4()}`,
              },
            },
            {
              type: PACKAGE_POLICY_SAVED_OBJECT_TYPE,
              namespaces: ['default'],
              [PACKAGE_POLICY_SAVED_OBJECT_TYPE]: {
                name: `test-${index}`,
                policy_ids: [agentPolicyRes.item.id],
                inputs: [],
                package: {
                  name: 'synthetics',
                  version: '1.2.1',
                },
                latest_revision: true,
              },
            },
          ]),
        });

        return await apiClient.getPackage({
          pkgName: 'synthetics',
        });
      });
      it('should upgrade managed package policies', async () => {
        await apiClient.setup();
        await retry.tryWithRetries(
          'Searching for managed package policies to be upgraded',
          async () => {
            const res = await es.search({
              index: INGEST_SAVED_OBJECT_INDEX,
              track_total_hits: true,
              query: {
                bool: {
                  must: {
                    term: {
                      [`${PACKAGE_POLICY_SAVED_OBJECT_TYPE}.package.version`]: '1.2.1',
                    },
                  },
                  filter: {
                    term: {
                      [`${PACKAGE_POLICY_SAVED_OBJECT_TYPE}.package.name`]: 'synthetics',
                    },
                  },
                },
              },
            });
            const packagePolicies = res.hits.hits.filter(
              (so) => so._id && !so._id.includes(':prev')
            );
            if (packagePolicies.length > 0) {
              throw new Error(`Managed package policies not upgraded ${packagePolicies.length}.`);
            }
          },
          {
            retryCount: 25,
            retryDelay: 10000,
            timeout: 60_000,
          }
        );
      });
    });
  });
}

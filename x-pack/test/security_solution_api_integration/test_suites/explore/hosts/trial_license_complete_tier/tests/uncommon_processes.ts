/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

import {
  HostsQueries,
  HostsUncommonProcessesStrategyResponse,
} from '@kbn/security-solution-plugin/common/search_strategy';
import TestAgent from 'supertest/lib/agent';
import { SearchService } from '@kbn/ftr-common-functional-services';
import { FtrProviderContextWithSpaces } from '../../../../../ftr_provider_context_with_spaces';

const FROM = '2000-01-01T00:00:00.000Z';
const TO = '3000-01-01T00:00:00.000Z';

// typical values that have to change after an update from "scripts/es_archiver"
const TOTAL_COUNT = 3;

export default function ({ getService }: FtrProviderContextWithSpaces) {
  const esArchiver = getService('esArchiver');
  const utils = getService('securitySolutionUtils');

  describe('hosts', () => {
    let supertest: TestAgent;
    let search: SearchService;
    before(async () => {
      supertest = await utils.createSuperTest();
      search = await utils.createSearch();
      await esArchiver.load(
        'x-pack/platform/test/fixtures/es_archives/auditbeat/uncommon_processes'
      );
    });
    after(async () => {
      await esArchiver.unload(
        'x-pack/platform/test/fixtures/es_archives/auditbeat/uncommon_processes'
      );
    });

    it('should return an edge of length 1 when given a pagination of length 1', async () => {
      const response = await search.send<HostsUncommonProcessesStrategyResponse>({
        supertest,
        options: {
          factoryQueryType: HostsQueries.uncommonProcesses,
          sourceId: 'default',
          timerange: {
            interval: '12h',
            to: TO,
            from: FROM,
          },
          pagination: {
            activePage: 0,
            cursorStart: 0,
            fakePossibleCount: 3,
            querySize: 1,
          },
          defaultIndex: ['auditbeat-uncommon-processes'],
          inspect: false,
        },
        strategy: 'securitySolutionSearchStrategy',
      });

      expect(response.edges.length).to.be(1);
    });

    describe('when given a pagination of length 2', () => {
      it('should return an edge of length 2 ', async () => {
        const response = await search.send<HostsUncommonProcessesStrategyResponse>({
          supertest,
          options: {
            factoryQueryType: HostsQueries.uncommonProcesses,
            sourceId: 'default',
            timerange: {
              interval: '12h',
              to: TO,
              from: FROM,
            },
            pagination: {
              activePage: 0,
              cursorStart: 0,
              fakePossibleCount: 3,
              querySize: 2,
            },
            defaultIndex: ['auditbeat-uncommon-processes'],
            inspect: false,
          },
          strategy: 'securitySolutionSearchStrategy',
        });
        expect(response.edges.length).to.be(2);
      });
    });

    describe('when given a pagination of length 1', () => {
      let response: HostsUncommonProcessesStrategyResponse | null = null;
      before(async () => {
        response = await search.send<HostsUncommonProcessesStrategyResponse>({
          supertest,
          options: {
            factoryQueryType: HostsQueries.uncommonProcesses,
            sourceId: 'default',
            timerange: {
              interval: '12h',
              to: TO,
              from: FROM,
            },
            pagination: {
              activePage: 0,
              cursorStart: 0,
              fakePossibleCount: 3,
              querySize: 1,
            },
            defaultIndex: ['auditbeat-uncommon-processes'],
            inspect: false,
          },
          strategy: 'securitySolutionSearchStrategy',
        });
      });

      it('should return an edge of length 1 ', () => {
        expect(response?.edges.length).to.be(1);
      });

      it('should return a total count of elements', () => {
        expect(response?.totalCount).to.be(TOTAL_COUNT);
      });

      it('should return a single data set with pagination of 1', () => {
        const expected = {
          _id: 'HCFxB2kBR346wHgnL4ik',
          instances: 1,
          process: {
            name: ['kworker/u2:0'],
          },
          user: {
            id: ['0'],
            name: ['root'],
          },
          hosts: [
            {
              id: ['zeek-sensor-san-francisco'],
              name: ['zeek-sensor-san-francisco'],
            },
          ],
        };
        expect(response?.edges[0].node).to.eql(expected);
      });
    });
  });
}

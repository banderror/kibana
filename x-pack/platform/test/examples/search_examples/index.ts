/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { PluginFunctionalProviderContext } from '@kbn/test-suites-src/plugin_functional/services';

// eslint-disable-next-line import/no-default-export
export default function ({ getService, loadTestFile }: PluginFunctionalProviderContext) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');

  describe('search examples', function () {
    before(async () => {
      await esArchiver.emptyKibanaIndex();
      await esArchiver.loadIfNeeded(
        'x-pack/platform/test/fixtures/es_archives/logstash_functional'
      );
      await kibanaServer.importExport.load(
        'x-pack/test/functional/fixtures/kbn_archiver/lens/lens_basic.json'
      ); // need at least one index pattern
    });

    after(async () => {
      await esArchiver.unload('x-pack/platform/test/fixtures/es_archives/logstash_functional');
      await kibanaServer.importExport.unload(
        'x-pack/test/functional/fixtures/kbn_archiver/lens/lens_basic.json'
      );
    });

    loadTestFile(require.resolve('./search_session_example'));
    loadTestFile(require.resolve('./search_example'));
    loadTestFile(require.resolve('./search_sessions_cache'));
    loadTestFile(require.resolve('./partial_results_example'));
    loadTestFile(require.resolve('./sql_search_example'));
  });
}

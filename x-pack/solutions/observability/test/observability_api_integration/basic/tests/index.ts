/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrProviderContext } from '../../common/ftr_provider_context';

export default function observabilityApiIntegrationTests({ loadTestFile }: FtrProviderContext) {
  describe('Observability specs (basic)', function () {
    this.tags('skipFIPS');
    loadTestFile(require.resolve('./annotations'));
  });
}

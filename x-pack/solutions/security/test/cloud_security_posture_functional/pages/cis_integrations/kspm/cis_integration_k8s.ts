/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import type { FtrProviderContext } from '../../../ftr_provider_context';
import { policiesSavedObjects } from '../constants';

// eslint-disable-next-line import/no-default-export
export default function (providerContext: FtrProviderContext) {
  const { getPageObjects, getService } = providerContext;
  const pageObjects = getPageObjects(['cloudPostureDashboard', 'cisAddIntegration', 'header']);
  const retry = getService('retry');
  const kibanaServer = getService('kibanaServer');
  const saveIntegrationPolicyTimeout = 1000 * 30; // 30 seconds

  // Failing: See https://github.com/elastic/kibana/issues/229403
  describe.skip('Test adding Cloud Security Posture Integrations KSPM K8S', function () {
    this.tags(['cloud_security_posture_cis_integration_kspm_k8s']);
    let cisIntegration: typeof pageObjects.cisAddIntegration;

    before(async () => {
      await kibanaServer.savedObjects.clean({ types: policiesSavedObjects });
    });

    beforeEach(async () => {
      cisIntegration = pageObjects.cisAddIntegration;
      await cisIntegration.navigateToAddIntegrationKspmPage();
    });

    describe('KSPM K8S', () => {
      it('KSPM K8S Workflow', async () => {
        await cisIntegration.inputUniqueIntegrationName();
        await cisIntegration.clickSaveButton();
        await retry.tryForTime(saveIntegrationPolicyTimeout, async () => {
          await pageObjects.header.waitUntilLoadingHasFinished();
          expect((await cisIntegration.getPostInstallModal()) !== undefined).to.be(true);
          await cisIntegration.navigateToIntegrationCspList();
          await cisIntegration.clickFirstElementOnIntegrationTable();
          expect(
            (await cisIntegration.isOptionChecked('cisK8sTestId', 'cloudbeat/cis_k8s')) === 'true'
          ).to.be(true);
        });
      });
    });
  });
}

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { MlJobCompatibilityLink } from '../../../../../../common/components/links_to_docs';

export const ML_JOB_UPGRADE_MODAL_TITLE = i18n.translate(
  'xpack.securitySolution.detectionEngine.mlJobUpgradeModal.messageTitle',
  {
    defaultMessage: 'ML rule updates may override your existing rules',
  }
);

export const ML_JOB_UPGRADE_MODAL_CANCEL = i18n.translate(
  'xpack.securitySolution.detectionEngine.mlJobUpgradeModal.cancelTitle',
  {
    defaultMessage: 'Cancel',
  }
);

export const ML_JOB_UPGRADE_MODAL_CONFIRM = i18n.translate(
  'xpack.securitySolution.detectionEngine.mlJobUpgradeModal.confirmTitle',
  {
    defaultMessage: 'Load rules',
  }
);

export const ML_JOB_UPGRADE_MODAL_AFFECTED_JOBS = i18n.translate(
  'xpack.securitySolution.detectionEngine.mlJobUpgradeModal.affectedJobsTitle',
  {
    defaultMessage: 'Affected jobs:',
  }
);

export const MlJobUpgradeModalBody = () => (
  <FormattedMessage
    id="xpack.securitySolution.detectionEngine.mlJobUpgradeModal.messageBody"
    defaultMessage="{summary} Documentation: {docs}"
    values={{
      summary: (
        <p>
          <FormattedMessage
            id="xpack.securitySolution.detectionEngine.mlJobUpgradeModal.messageBody.summary"
            defaultMessage="Some of your installed machine learning jobs are an earlier
            generation that the latest Elastic prebuilt rules no longer use. Updating these
            rules repoints them to newer ML jobs, so the affected rules may stop using your
            existing jobs. To keep detection coverage from the older jobs, duplicate or
            recreate the affected rules before updating. See the documentation below for how
            to keep using your current jobs and how to move to the newer ones."
          />
        </p>
      ),
      docs: (
        <ul>
          <li>
            <MlJobCompatibilityLink />
          </li>
        </ul>
      ),
    }}
  />
);

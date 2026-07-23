/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiCallOut, EuiCheckbox, EuiSpacer, useGeneratedHtmlId } from '@elastic/eui';
import { MlJobCompatibilityLink } from '../../../../../common/components/links_to_docs';
import { useRulePreviewContext } from './rule_preview_context';

export const ML_JOB_COVERAGE_LOSS_CALLOUT_TITLE = i18n.translate(
  'xpack.securitySolution.detectionEngine.rules.upgradeRules.mlCoverageLossCallout.title',
  {
    defaultMessage: 'Updating this rule may reduce machine learning detection coverage',
  }
);

export const ML_JOB_COVERAGE_LOSS_ACKNOWLEDGE_LABEL = i18n.translate(
  'xpack.securitySolution.detectionEngine.rules.upgradeRules.mlCoverageLossCallout.acknowledgeLabel',
  {
    defaultMessage: 'I understand this rule will stop using my existing machine learning job(s)',
  }
);

interface MlJobCoverageLossCalloutProps {
  /**
   * When `true`, renders the acknowledgment checkbox that gates the upgrade. Below-Enterprise
   * users can only take the target version, so they must acknowledge the coverage loss before
   * upgrading. Enterprise users resolve the conflict through the three-way diff instead.
   */
  showAcknowledgment?: boolean;
}

export function MlJobCoverageLossCallout({
  showAcknowledgment = false,
}: MlJobCoverageLossCalloutProps) {
  const { isCoverageLossAcknowledged, setCoverageLossAcknowledged } = useRulePreviewContext();
  const checkboxId = useGeneratedHtmlId({ prefix: 'mlJobCoverageLossAcknowledge' });

  return (
    <EuiCallOut
      title={ML_JOB_COVERAGE_LOSS_CALLOUT_TITLE}
      size="s"
      color="warning"
      iconType="warning"
      data-test-subj="mlJobCoverageLossCallout"
    >
      <p>
        <FormattedMessage
          id="xpack.securitySolution.detectionEngine.rules.upgradeRules.mlCoverageLossCallout.body"
          defaultMessage="This rule uses a machine learning job from an earlier generation that the
          updated rule no longer references. Updating repoints the rule to a newer machine learning
          job, so it will stop using your existing job and its anomaly detection coverage may be
          lost. To keep that coverage, duplicate or recreate this rule before updating. Documentation: {docs}"
          values={{
            docs: <MlJobCompatibilityLink />,
          }}
        />
      </p>
      {showAcknowledgment && (
        <>
          <EuiSpacer size="s" />
          <EuiCheckbox
            id={checkboxId}
            label={ML_JOB_COVERAGE_LOSS_ACKNOWLEDGE_LABEL}
            checked={isCoverageLossAcknowledged}
            onChange={(event) => setCoverageLossAcknowledged(event.target.checked)}
            data-test-subj="mlJobCoverageLossAcknowledgeCheckbox"
          />
        </>
      )}
    </EuiCallOut>
  );
}

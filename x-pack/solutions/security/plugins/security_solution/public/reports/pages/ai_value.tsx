/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useMemo, useState } from 'react';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner } from '@elastic/eui';
import type { DocLinks } from '@kbn/doc-links';
import { pick } from 'lodash/fp';
import { useSyncTimerangeUrlParam } from '../../common/hooks/search_bar/use_sync_timerange_url_param';
import { ValueReportExporter } from '../components/ai_value/value_report_exporter';
import { EXPORT_REPORT, METRICS_OVER_TIME } from '../components/ai_value/translations';
import { useDeepEqualSelector } from '../../common/hooks/use_selector';
import { SuperDatePicker } from '../../common/components/super_date_picker';
import { AIValueMetrics } from '../components/ai_value';
import { APP_ID } from '../../../common';
import { InputsModelId } from '../../common/store/inputs/constants';
import { useIsExperimentalFeatureEnabled } from '../../common/hooks/use_experimental_features';
import { SecuritySolutionPageWrapper } from '../../common/components/page_wrapper';
import { useSourcererDataView } from '../../sourcerer/containers';
import { useAlertsPrivileges } from '../../detections/containers/detection_engine/alerts/use_alerts_privileges';
import { HeaderPage } from '../../common/components/header_page';
import * as i18n from './translations';
import { NoPrivileges } from '../../common/components/no_privileges';
import { useKibana } from '../../common/lib/kibana';
import { useDataView } from '../../data_view_manager/hooks/use_data_view';
import { PageLoader } from '../../common/components/page_loader';
import { inputsSelectors } from '../../common/store';
import { getTimeRangeAsDays } from '../components/ai_value/metrics';

/**
 * The dashboard includes key performance metrics such as:
 * Cost savings (e.g., based on time saved × analyst hourly rate)
 * Analyst time saved (e.g., minutes saved per alert × volume)
 * Total alerts filtered vs escalated
 * Real attacks detected by AI
 * Alert response time trends
 *
 * Metrics are calculated using dynamic values from the user’s actual data and can be customized per deployment.
 * Visualizations are executive-friendly: concise, interactive, and exportable.
 * Time range selection and historical trend views are supported.
 * Data sources and calculation methods are transparent and documented for auditability.
 */

const AIValueComponent = () => {
  const { cases } = useKibana().services;

  const { loading: oldIsSourcererLoading } = useSourcererDataView();
  const { from, to } = useDeepEqualSelector((state) =>
    pick(['from', 'to'], inputsSelectors.valueReportTimeRangeSelector(state))
  );

  const newDataViewPickerEnabled = useIsExperimentalFeatureEnabled('newDataViewPickerEnabled');
  const { status } = useDataView();

  const isSourcererLoading = newDataViewPickerEnabled ? status !== 'ready' : oldIsSourcererLoading;

  const { hasKibanaREAD, hasIndexRead } = useAlertsPrivileges();
  const userCasesPermissions = cases.helpers.canUseCases([APP_ID]);
  const canReadCases = userCasesPermissions.read;
  const canReadAlerts = hasKibanaREAD && hasIndexRead;

  const [hasAttackDiscoveries, setHasAttackDiscoveries] = useState(false);
  const subtitle = useMemo(() => METRICS_OVER_TIME(getTimeRangeAsDays({ from, to })), [from, to]);
  // since we do not have a search bar in the AI Value page, we need to sync the timerange
  useSyncTimerangeUrlParam();
  if (!canReadAlerts && !canReadCases) {
    return <NoPrivileges docLinkSelector={(docLinks: DocLinks) => docLinks.siem.privileges} />;
  }

  if (newDataViewPickerEnabled && status === 'pristine') {
    return <PageLoader />;
  }

  return (
    <ValueReportExporter>
      {(exportPDF) => (
        <SecuritySolutionPageWrapper data-test-subj="aiValuePage">
          <HeaderPage
            title={i18n.AI_VALUE_DASHBOARD}
            subtitle={subtitle}
            rightSideItems={[
              <SuperDatePicker
                id={InputsModelId.valueReport}
                showUpdateButton="iconOnly"
                width="auto"
                compressed
              />,
              ...(hasAttackDiscoveries
                ? [
                    <EuiButtonEmpty
                      className="exportPdfButton"
                      iconType="download"
                      onClick={exportPDF}
                      size="s"
                    >
                      {EXPORT_REPORT}
                    </EuiButtonEmpty>,
                  ]
                : []),
            ]}
          />
          {isSourcererLoading ? (
            <EuiLoadingSpinner size="l" data-test-subj="aiValueLoader" />
          ) : (
            <EuiFlexGroup direction="column" data-test-subj="aiValueSections">
              <EuiFlexItem>
                <AIValueMetrics
                  from={from}
                  to={to}
                  setHasAttackDiscoveries={setHasAttackDiscoveries}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        </SecuritySolutionPageWrapper>
      )}
    </ValueReportExporter>
  );
};

export const AIValue = React.memo(AIValueComponent);

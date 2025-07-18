/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { stringify } from 'querystring';
import { encode } from '@kbn/rison';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { useKibanaContextForPlugin } from '../../../hooks/use_kibana';

export interface LinkToApmServicesProps {
  entityId: string;
  apmField: string;
}

export const LinkToApmServices = ({ entityId, apmField }: LinkToApmServicesProps) => {
  const { services } = useKibanaContextForPlugin();
  const { http } = services;

  const queryString = new URLSearchParams(
    encode(
      stringify({
        kuery: `${apmField}:"${entityId}"`,
      })
    )
  );

  const linkToApmServices = http.basePath.prepend(`/app/apm/services?${queryString}`);

  return (
    <EuiButtonEmpty
      aria-label={i18n.translate('xpack.infra.assetDetails.apmServicesLink.ariaLabel', {
        defaultMessage: 'Show all APM services',
      })}
      data-test-subj="infraAssetDetailsViewAPMShowAllServicesButton"
      size="xs"
      flush="both"
      href={linkToApmServices}
      iconSide="right"
      iconType="sortRight"
    >
      <FormattedMessage
        id="xpack.infra.hostsViewPage.flyout.viewApmServicesLinkLabel"
        defaultMessage="Show all"
      />
    </EuiButtonEmpty>
  );
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FunctionComponent } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';
import {
  EuiButtonEmpty,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiInMemoryTable,
  EuiLink,
  EuiTitle,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { getTemplateDetailsLink } from '@kbn/index-management-plugin/public';
import { useKibana } from '../../shared_imports';

interface Props {
  policyName: string;
  indexTemplates: string[];
  close: () => void;
}
export const IndexTemplatesFlyout: FunctionComponent<Props> = ({
  policyName,
  indexTemplates,
  close,
}) => {
  const modalTitleId = useGeneratedHtmlId();
  const {
    services: { getUrlForApp },
  } = useKibana();
  const getUrlForIndexTemplate = (name: string) => {
    return getUrlForApp('management', {
      path: `data/index_management${getTemplateDetailsLink(name)}`,
    });
  };
  return (
    <EuiFlyout onClose={close} aria-labelledby={modalTitleId}>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m" data-test-subj="indexTemplatesFlyoutHeader">
          <h2 id={modalTitleId}>
            <FormattedMessage
              id="xpack.indexLifecycleMgmt.policyTable.indexTemplatesFlyout.headerText"
              defaultMessage="Index templates that apply {policyName}"
              values={{ policyName }}
            />
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiInMemoryTable
          pagination={true}
          // @ts-expect-error - EuiInMemoryTable wants an array of objects, but will accept strings if coerced
          items={indexTemplates ?? []}
          columns={[
            {
              name: i18n.translate(
                'xpack.indexLifecycleMgmt.policyTable.indexTemplatesTable.nameHeader',
                { defaultMessage: 'Index template name' }
              ),
              // @ts-expect-error - EuiInMemoryTable wants an array of objects, but will accept strings if coerced
              render: (value: string) => {
                return (
                  <EuiLink
                    data-test-subj="indexTemplateLink"
                    className="eui-textBreakAll"
                    href={getUrlForIndexTemplate(value)}
                  >
                    {value}
                  </EuiLink>
                );
              },
            },
          ]}
        />
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiButtonEmpty iconType="cross" onClick={close} flush="left">
          <FormattedMessage
            id="xpack.indexLifecycleMgmt.indexTemplatesFlyout.closeButtonLabel"
            defaultMessage="Close"
          />
        </EuiButtonEmpty>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};

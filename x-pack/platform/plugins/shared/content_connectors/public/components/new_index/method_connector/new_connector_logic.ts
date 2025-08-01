/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { kea, MakeLogicType } from 'kea';

import { Connector, ConnectorDefinition } from '@kbn/search-connectors';

import { HttpSetup, NavigateToUrlOptions } from '@kbn/core/public';
import {
  AddConnectorApiLogic,
  AddConnectorApiLogicActions,
  AddConnectorApiLogicArgs,
  AddConnectorApiLogicResponse,
} from '../../../api/connector/add_connector_api_logic';

import {
  GenerateConfigApiActions,
  GenerateConfigApiLogic,
} from '../../../api/connector/generate_connector_config_api_logic';
import {
  GenerateConnectorNamesApiLogic,
  GenerateConnectorNamesApiLogicActions,
  GenerateConnectorNamesApiResponse,
} from '../../../api/connector/generate_connector_names_api_logic';

import { CONNECTOR_DETAIL_TAB_PATH } from '../../routes';
import {
  ConnectorViewActions,
  ConnectorViewLogic,
} from '../../connector_detail/connector_view_logic';
import { ConnectorCreationSteps } from '../../connectors/create_connector/create_connector';
import { APIKeyResponse, Status } from '../../../../common/types/api';
import { Actions } from '../../../api/api_logic/create_api_logic';
import { generateEncodedPath } from '../../shared/encode_path_params';
import { SearchIndexTabId } from '../../../../common/constants';

export interface NewConnectorValues {
  canConfigureConnector: boolean;
  connectorId: string;
  connectorName: string;
  createConnectorApiStatus: Status;
  currentStep: ConnectorCreationSteps;
  generateConfigurationStatus: Status;
  generatedConfigData:
    | {
        apiKey: APIKeyResponse['apiKey'];
        connectorId: Connector['id'];
        indexName: string;
      }
    | undefined;
  generatedNameData: GenerateConnectorNamesApiResponse | undefined;
  isCreateLoading: boolean;
  isFormDirty: boolean;
  isGenerateLoading: boolean;
  rawName: string;
  selectedConnector: ConnectorDefinition | null;
  shouldGenerateConfigAfterCreate: boolean;
}

type NewConnectorActions = {
  generateConnectorName: GenerateConnectorNamesApiLogicActions['makeRequest'];
} & {
  configurationGenerated: GenerateConfigApiActions['apiSuccess'];
  generateConfiguration: GenerateConfigApiActions['makeRequest'];
} & {
  connectorCreated: Actions<AddConnectorApiLogicArgs, AddConnectorApiLogicResponse>['apiSuccess'];
  createConnector: ({
    isSelfManaged,
    shouldGenerateAfterCreate,
    shouldNavigateToConnectorAfterCreate,
  }: {
    isSelfManaged: boolean;
    shouldGenerateAfterCreate?: boolean;
    shouldNavigateToConnectorAfterCreate?: boolean;
  }) => {
    isSelfManaged: boolean;
    shouldGenerateAfterCreate?: boolean;
    shouldNavigateToConnectorAfterCreate?: boolean;
  };
  createConnectorApi: AddConnectorApiLogicActions['makeRequest'];
  fetchConnector: ConnectorViewActions['fetchConnector'];
  setCurrentStep(step: ConnectorCreationSteps): { step: ConnectorCreationSteps };
  setFormDirty: (isDirty: boolean) => { isDirty: boolean };
  setRawName(rawName: string): { rawName: string };
  setSelectedConnector(connector: ConnectorDefinition | null): {
    connector: ConnectorDefinition | null;
  };
};

export interface NewConnectorLogicProps {
  http?: HttpSetup;
  navigateToUrl?: (url: string, options?: NavigateToUrlOptions) => Promise<void>;
}

export const NewConnectorLogic = kea<
  MakeLogicType<NewConnectorValues, NewConnectorActions, NewConnectorLogicProps>
>({
  key: (props) => ({
    http: props.http,
    navigateToUrl: props.navigateToUrl,
  }),
  actions: {
    createConnector: ({
      isSelfManaged,
      shouldGenerateAfterCreate,
      shouldNavigateToConnectorAfterCreate,
    }) => ({
      isSelfManaged,
      shouldGenerateAfterCreate,
      shouldNavigateToConnectorAfterCreate,
    }),
    setCurrentStep: (step) => ({ step }),
    setFormDirty: (isDirty) => ({ isDirty }),
    setRawName: (rawName) => ({ rawName }),
    setSelectedConnector: (connector) => ({ connector }),
  },
  connect: {
    actions: [
      GenerateConnectorNamesApiLogic,
      ['makeRequest as generateConnectorName', 'apiSuccess as connectorNameGenerated'],
      AddConnectorApiLogic,
      ['makeRequest as createConnectorApi', 'apiSuccess as connectorCreated'],
      GenerateConfigApiLogic,
      ['makeRequest as generateConfiguration', 'apiSuccess as configurationGenerated'],
      ConnectorViewLogic,
      ['fetchConnector'],
    ],
    values: [
      GenerateConnectorNamesApiLogic,
      ['data as generatedNameData'],
      GenerateConfigApiLogic,
      ['data as generatedConfigData', 'status as generateConfigurationStatus'],
      AddConnectorApiLogic,
      ['status as createConnectorApiStatus'],
    ],
    keys: [ConnectorViewLogic, ['http']],
  },
  listeners: ({ actions, values, props }) => ({
    connectorCreated: ({ id, uiFlags }) => {
      if (uiFlags?.shouldNavigateToConnectorAfterCreate && props.navigateToUrl) {
        props.navigateToUrl(
          generateEncodedPath(
            `app/management/data/content_connectors${CONNECTOR_DETAIL_TAB_PATH}`,
            {
              connectorId: id,
              tabId: SearchIndexTabId.CONFIGURATION,
            }
          )
        );
      } else {
        actions.fetchConnector({ connectorId: id, http: props.http });
        if (!uiFlags || uiFlags.shouldGenerateAfterCreate) {
          actions.generateConfiguration({ connectorId: id, http: props.http });
        }
      }
    },
    connectorNameGenerated: ({ connectorName }) => {
      actions.setRawName(connectorName);
    },
    createConnector: ({
      isSelfManaged,
      shouldGenerateAfterCreate = true,
      shouldNavigateToConnectorAfterCreate = false,
    }) => {
      if (
        !values.rawName &&
        values.selectedConnector &&
        values.connectorName &&
        values.generatedNameData
      ) {
        // name is generated, use everything generated
        actions.createConnectorApi({
          deleteExistingConnector: false,
          indexName: values.connectorName,
          isNative: !values.selectedConnector.isNative ? false : !isSelfManaged,
          language: null,
          name: values.generatedNameData.connectorName,
          serviceType: values.selectedConnector.serviceType,
          uiFlags: {
            shouldGenerateAfterCreate,
            shouldNavigateToConnectorAfterCreate,
          },
          http: props.http,
        });
      } else {
        if (values.generatedNameData && values.selectedConnector) {
          actions.createConnectorApi({
            deleteExistingConnector: false,
            indexName: values.generatedNameData.indexName,
            isNative: !values.selectedConnector.isNative ? false : !isSelfManaged,
            language: null,
            name: values.connectorName,
            serviceType: values.selectedConnector?.serviceType,
            uiFlags: {
              shouldGenerateAfterCreate,
              shouldNavigateToConnectorAfterCreate,
            },
            http: props.http,
          });
        }
      }
    },
    setSelectedConnector: ({ connector }) => {
      if (connector) {
        actions.generateConnectorName({
          connectorType: connector.serviceType,
          isManagedConnector: connector.isNative,
          http: props.http,
        });
      }
    },
  }),
  path: ['content_connectors', 'content', 'new_search_connector'],
  reducers: {
    connectorId: [
      '',
      {
        connectorCreated: (
          _: NewConnectorValues['connectorId'],
          { id }: { id: NewConnectorValues['connectorId'] }
        ) => id,
      },
    ],
    currentStep: [
      'start',
      {
        setCurrentStep: (
          _: NewConnectorValues['currentStep'],
          { step }: { step: NewConnectorValues['currentStep'] }
        ) => step,
      },
    ],
    isFormDirty: [
      false, // Initial state (form is not dirty)
      {
        setFormDirty: (_, { isDirty }) => isDirty,
      },
    ],
    rawName: [
      '',
      {
        setRawName: (_, { rawName }) => rawName,
      },
    ],
    selectedConnector: [
      null,
      {
        setSelectedConnector: (
          _: NewConnectorValues['selectedConnector'],
          { connector }: { connector: NewConnectorValues['selectedConnector'] }
        ) => connector,
      },
    ],
  },
  selectors: ({ selectors }) => ({
    canConfigureConnector: [
      () => [selectors.connectorName, selectors.selectedConnector],
      (connectorName: string, selectedConnector: NewConnectorValues['selectedConnector']) =>
        (connectorName && selectedConnector?.name) ?? false,
    ],
    connectorName: [
      () => [selectors.rawName, selectors.generatedNameData],
      (name: string, generatedName: NewConnectorValues['generatedNameData']) =>
        name ? name : generatedName?.connectorName ?? '',
    ],
    isCreateLoading: [
      () => [selectors.createConnectorApiStatus],
      (status) => status === Status.LOADING,
    ],
    isGenerateLoading: [
      () => [selectors.generateConfigurationStatus],
      (status) => status === Status.LOADING,
    ],
  }),
});

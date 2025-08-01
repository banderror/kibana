/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { Reference } from '@kbn/content-management-utils';
import type { StartServicesAccessor } from '@kbn/core-lifecycle-browser';
import {
  APPLY_FILTER_TRIGGER,
  generateFilters,
  type DataPublicPluginStart,
} from '@kbn/data-plugin/public';
import type { DataViewField } from '@kbn/data-views-plugin/common';
import { DATA_VIEW_SAVED_OBJECT_TYPE } from '@kbn/data-views-plugin/common';
import type { EmbeddableFactory } from '@kbn/embeddable-plugin/public';
import { i18n } from '@kbn/i18n';
import {
  type SerializedPanelState,
  apiHasExecutionContext,
  fetch$,
  initializeTimeRangeManager,
  initializeTitleManager,
  useBatchedPublishingSubjects,
  useFetchContext,
  titleComparators,
  timeRangeComparators,
} from '@kbn/presentation-publishing';
import { initializeUnsavedChanges } from '@kbn/presentation-containers';
import { cloneDeep } from 'lodash';
import React, { useEffect } from 'react';
import useObservable from 'react-use/lib/useObservable';
import {
  BehaviorSubject,
  map,
  skipWhile,
  Subscription,
  skip,
  switchMap,
  distinctUntilChanged,
  merge,
} from 'rxjs';
import { openLazyFlyout } from '@kbn/presentation-util';
import type { DataView } from '@kbn/data-views-plugin/public';
import { dynamic } from '@kbn/shared-ux-utility';
import { isDefined } from '@kbn/ml-is-defined';
import { EuiCallOut, EuiEmptyPrompt, EuiFlexItem } from '@elastic/eui';
import { css } from '@emotion/react';
import type { ActionExecutionContext } from '@kbn/ui-actions-plugin/public';
import type { Filter } from '@kbn/es-query';
import { FilterStateStore } from '@kbn/es-query';
import { ENABLE_ESQL, getESQLAdHocDataview } from '@kbn/esql-utils';
import { ACTION_GLOBAL_APPLY_FILTER } from '@kbn/unified-search-plugin/public';
import { FormattedMessage } from '@kbn/i18n-react';
import type { DataVisualizerTableState } from '../../../../../common/types';
import type { DataVisualizerPluginStart } from '../../../../plugin';
import type { FieldStatisticsTableEmbeddableState } from '../grid_embeddable/types';
import { FieldStatsInitializerViewType } from '../grid_embeddable/types';
import { FIELD_STATS_EMBEDDABLE_TYPE, FIELD_STATS_DATA_VIEW_REF_NAME } from './constants';
import { initializeFieldStatsControls } from './initialize_field_stats_controls';
import type { DataVisualizerStartDependencies } from '../../../common/types/data_visualizer_plugin';
import type { FieldStatisticsTableEmbeddableApi } from './types';
import { isESQLQuery } from '../../search_strategy/requests/esql_utils';
import { FieldStatsComponentType } from '../../constants/field_stats_component_type';

export interface EmbeddableFieldStatsChartStartServices {
  data: DataPublicPluginStart;
}

const FieldStatisticsWrapper = dynamic(() => import('../grid_embeddable/field_stats_wrapper'));

const ERROR_MSG = {
  APPLY_FILTER_ERR: i18n.translate('xpack.dataVisualizer.fieldStats.errors.errorApplyingFilter', {
    defaultMessage: 'Error applying filter',
  }),
  UPDATE_CONFIG_ERROR: i18n.translate(
    'xpack.dataVisualizer.fieldStats.errors.errorUpdatingConfig',
    {
      defaultMessage: 'Error updating settings for field statistics.',
    }
  ),
};

export const getDependencies = async (
  getStartServices: StartServicesAccessor<
    DataVisualizerStartDependencies,
    DataVisualizerPluginStart
  >
) => {
  const [
    { http, uiSettings, notifications, ...startServices },
    { lens, data, usageCollection, fieldFormats },
  ] = await getStartServices();

  return {
    http,
    uiSettings,
    data,
    notifications,
    lens,
    usageCollection,
    fieldFormats,
    ...startServices,
  };
};

export const getFieldStatsChartEmbeddableFactory = (
  getStartServices: StartServicesAccessor<
    DataVisualizerStartDependencies,
    DataVisualizerPluginStart
  >
) => {
  const factory: EmbeddableFactory<
    FieldStatisticsTableEmbeddableState,
    FieldStatisticsTableEmbeddableApi
  > = {
    type: FIELD_STATS_EMBEDDABLE_TYPE,
    buildEmbeddable: async ({ uuid, initialState, parentApi, finalizeApi }) => {
      const [coreStart, pluginStart] = await getStartServices();

      const { http, uiSettings, notifications, ...startServices } = coreStart;
      const { lens, data, usageCollection, fieldFormats } = pluginStart;

      const deps = {
        http,
        uiSettings,
        data,
        notifications,
        lens,
        usageCollection,
        fieldFormats,
        ...startServices,
      };
      const timeRangeManager = initializeTimeRangeManager(initialState.rawState);
      const titleManager = initializeTitleManager(initialState.rawState);

      const deserializeState = (
        state: SerializedPanelState<FieldStatisticsTableEmbeddableState>
      ) => {
        const serializedState = cloneDeep(state.rawState);
        // inject the reference
        const dataViewIdRef = state.references?.find(
          (ref) => ref.name === FIELD_STATS_DATA_VIEW_REF_NAME
        );
        // if the serializedState already contains a dataViewId, we don't want to overwrite it. (Unsaved state can cause this)
        if (dataViewIdRef && serializedState && !serializedState.dataViewId) {
          serializedState.dataViewId = dataViewIdRef?.id;
        }
        return serializedState;
      };

      const state = deserializeState(initialState);

      const {
        fieldStatsControlsApi,
        dataLoadingApi,
        fieldStatsControlsComparators,
        serializeFieldStatsChartState,
        onFieldStatsTableDestroy,
        resetData$,
        fieldStatsStateManager,
      } = initializeFieldStatsControls(state, deps.uiSettings);
      const { onError, dataLoading$, blockingError$ } = dataLoadingApi;

      const validDataViewId: string | undefined =
        isDefined(state.dataViewId) && state.dataViewId !== '' ? state.dataViewId : undefined;
      let initialDataView: DataView | undefined;
      try {
        const dataView = isESQLQuery(state.query)
          ? await getESQLAdHocDataview(state.query.esql, deps.data.dataViews)
          : validDataViewId
          ? await deps.data.dataViews.get(validDataViewId)
          : undefined;
        initialDataView = dataView;
      } catch (error) {
        // Only need to publish blocking error if viewtype is data view, and no data view found
        if (state.viewType === FieldStatsInitializerViewType.DATA_VIEW) {
          onError(error);
        }
      }

      const dataViews$ = new BehaviorSubject<DataView[] | undefined>(
        initialDataView ? [initialDataView] : undefined
      );

      const subscriptions = new Subscription();
      if (fieldStatsControlsApi.dataViewId$) {
        subscriptions.add(
          fieldStatsControlsApi.dataViewId$
            .pipe(
              skip(1),
              skipWhile((dataViewId) => !dataViewId),
              switchMap(async (dataViewId) => {
                try {
                  return await deps.data.dataViews.get(dataViewId);
                } catch (error) {
                  return undefined;
                }
              })
            )
            .subscribe((nextSelectedDataView) => {
              if (nextSelectedDataView) {
                dataViews$.next([nextSelectedDataView]);
              }
            })
        );
      }

      const { toasts } = deps.notifications;

      const serializeState = () => {
        const dataViewId = fieldStatsControlsApi.dataViewId$?.getValue();
        const references: Reference[] = dataViewId
          ? [
              {
                type: DATA_VIEW_SAVED_OBJECT_TYPE,
                name: FIELD_STATS_DATA_VIEW_REF_NAME,
                id: dataViewId,
              },
            ]
          : [];
        return {
          rawState: {
            ...titleManager.getLatestState(),
            ...timeRangeManager.getLatestState(),
            ...serializeFieldStatsChartState(),
          },
          references,
        };
      };

      const unsavedChangesApi = initializeUnsavedChanges({
        uuid,
        parentApi,
        serializeState,
        anyStateChange$: merge(
          titleManager.anyStateChange$,
          timeRangeManager.anyStateChange$,
          fieldStatsStateManager.anyStateChange$
        ),
        getComparators: () => ({
          ...titleComparators,
          ...fieldStatsControlsComparators,
          ...timeRangeComparators,
        }),
        onReset: (lastSaved) => {
          titleManager.reinitializeState(lastSaved?.rawState);
          timeRangeManager.reinitializeState(lastSaved?.rawState);
          fieldStatsStateManager.reinitializeState(lastSaved?.rawState);
        },
      });

      const api = finalizeApi({
        ...timeRangeManager.api,
        ...titleManager.api,
        ...fieldStatsControlsApi,
        ...unsavedChangesApi,
        // PublishesDataLoading
        dataLoading$,
        // PublishesBlockingError
        blockingError$,
        getTypeDisplayName: () =>
          i18n.translate('xpack.dataVisualizer.fieldStats.typeDisplayName', {
            defaultMessage: 'field statistics',
          }),
        isEditingEnabled: () => true,
        onEdit: async () => {
          openLazyFlyout({
            core: coreStart,
            parentApi,
            flyoutProps: {
              hideCloseButton: true,
              'data-test-subj': 'fieldStatisticsInitializerFlyout',
              focusedPanelId: uuid,
            },
            loadContent: async ({ closeFlyout }) => {
              const { EmbeddableFieldStatsUserInput } = await import(
                './field_stats_embeddable_input'
              );
              return (
                <EmbeddableFieldStatsUserInput
                  coreStart={coreStart}
                  pluginStart={pluginStart}
                  isNewPanel={false}
                  initialState={serializeFieldStatsChartState()}
                  fieldStatsControlsApi={fieldStatsControlsApi}
                  onUpdate={fieldStatsControlsApi.updateUserInput}
                  closeFlyout={closeFlyout}
                />
              );
            },
          });
        },
        dataViews$,
        serializeState,
      });

      const reload$ = fetch$(api).pipe(
        skipWhile((fetchContext) => !fetchContext.isReload),
        map(() => Date.now())
      );
      const reset$ = resetData$.pipe(skip(1), distinctUntilChanged());

      const onTableUpdate = (changes: Partial<DataVisualizerTableState>) => {
        if (isDefined(changes?.showDistributions)) {
          fieldStatsControlsApi.showDistributions$.next(changes.showDistributions);
        }
      };

      const addFilters = async (
        filters: Filter[],
        actionId: string = ACTION_GLOBAL_APPLY_FILTER
      ) => {
        if (!pluginStart.uiActions) {
          toasts.addWarning(ERROR_MSG.APPLY_FILTER_ERR);
          return;
        }
        const trigger = pluginStart.uiActions.getTrigger(APPLY_FILTER_TRIGGER);
        if (!trigger) {
          toasts.addWarning(ERROR_MSG.APPLY_FILTER_ERR);
          return;
        }
        const actionContext = {
          embeddable: api,
          trigger,
        } as ActionExecutionContext;

        const executeContext = {
          ...actionContext,
          filters,
        };
        try {
          const action = await pluginStart.uiActions.getAction(actionId);
          action.execute(executeContext);
        } catch (error) {
          toasts.addWarning(ERROR_MSG.APPLY_FILTER_ERR);
        }
      };

      const statsTableCss = css({
        width: '100%',
        height: '100%',
        overflowY: 'auto',
      });

      return {
        api,
        Component: () => {
          if (!apiHasExecutionContext(parentApi)) {
            onError(new Error('Parent API does not have execution context'));
          }

          const { filters: globalFilters, query: globalQuery, timeRange } = useFetchContext(api);
          const [dataViews, esqlQuery, viewType, showPreviewByDefault] =
            useBatchedPublishingSubjects(
              api.dataViews$,
              api.query$,
              api.viewType$,
              api.showDistributions$
            );
          const isEsqlEnabled = deps.uiSettings.get(ENABLE_ESQL);

          const lastReloadRequestTime = useObservable(reload$, Date.now());

          const isEsqlMode = viewType === FieldStatsInitializerViewType.ESQL;

          const dataView =
            Array.isArray(dataViews) && dataViews.length > 0 ? dataViews[0] : undefined;
          const onAddFilter = (
            field: string | DataViewField,
            value: string,
            operator: '+' | '-'
          ) => {
            if (!dataView || !pluginStart.data) {
              toasts.addWarning(ERROR_MSG.APPLY_FILTER_ERR);
              return;
            }

            let filters = generateFilters(
              pluginStart.data.query.filterManager,
              field,
              value,
              operator,
              dataView
            );
            filters = filters.map((filter) => ({
              ...filter,
              $state: { store: FilterStateStore.APP_STATE },
            }));
            addFilters(filters);
          };

          // On destroy
          useEffect(() => {
            return () => {
              subscriptions?.unsubscribe();
              onFieldStatsTableDestroy();
            };
          }, []);

          if (viewType === FieldStatsInitializerViewType.DATA_VIEW && !dataViews) {
            return (
              <EuiEmptyPrompt
                color="primary"
                title={
                  <h3>
                    <FormattedMessage
                      id="xpack.dataVisualizer.dashboard.fieldStats.noDataViewSelected"
                      defaultMessage="No data view selected"
                    />
                  </h3>
                }
                body={
                  <p>
                    <FormattedMessage
                      id="xpack.dataVisualizer.dashboard.fieldStats.noDataViewSelectedDescription"
                      defaultMessage="Pick a data view to view field statistics."
                    />
                  </p>
                }
              />
            );
          }

          if (isEsqlMode && !isEsqlEnabled) {
            return (
              <EuiFlexItem css={statsTableCss} data-test-subj="dashboardFieldStatsEmbeddedContent">
                <EuiCallOut
                  title={
                    <h3>
                      <FormattedMessage
                        id="xpack.dataVisualizer.fieldStats.noDataViewSelected"
                        defaultMessage="ES|QL is disabled"
                      />
                    </h3>
                  }
                  color="warning"
                  iconType="alert"
                />
              </EuiFlexItem>
            );
          }

          return (
            <EuiFlexItem css={statsTableCss} data-test-subj="dashboardFieldStatsEmbeddedContent">
              <FieldStatisticsWrapper
                id={FieldStatsComponentType.DashboardEmbeddable}
                shouldGetSubfields={false}
                dataView={dataView}
                esqlQuery={esqlQuery}
                query={globalQuery}
                filters={globalFilters}
                lastReloadRequestTime={lastReloadRequestTime}
                isEsqlMode={isEsqlMode}
                onTableUpdate={onTableUpdate}
                showPreviewByDefault={showPreviewByDefault}
                onAddFilter={onAddFilter}
                resetData$={reset$}
                timeRange={timeRange}
                onRenderComplete={dataLoadingApi.onRenderComplete}
              />
            </EuiFlexItem>
          );
        },
      };
    },
  };

  return factory;
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { isEqual } from 'lodash';
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { EuiOutsideClickDetector } from '@elastic/eui';
import { useDispatch } from 'react-redux';
import { css } from '@emotion/css';

import { useEnableExperimental } from '../../../../../common/hooks/use_experimental_features';
import { useDataView } from '../../../../../data_view_manager/hooks/use_data_view';
import type { EqlOptions } from '../../../../../../common/search_strategy';
import { useDeepEqualSelector } from '../../../../../common/hooks/use_selector';
import { SourcererScopeName } from '../../../../../sourcerer/store/model';
import { EqlQueryEdit } from '../../../../../detection_engine/rule_creation/components/eql_query_edit';
import type { FieldValueQueryBar } from '../../../../../detection_engine/rule_creation_ui/components/query_bar_field';

import type { FormSchema, FormSubmitHandler } from '../../../../../shared_imports';
import { Form, UseField, useForm } from '../../../../../shared_imports';
import { timelineActions } from '../../../../store';
import { getEqlOptions } from './selectors';
import { useSelectedPatterns } from '../../../../../data_view_manager/hooks/use_selected_patterns';
import { useSourcererDataView } from '../../../../../sourcerer/containers';

interface TimelineEqlQueryBar {
  index: string[];
  eqlQueryBar: FieldValueQueryBar;
  eqlOptions: EqlOptions;
}

const defaultValues = {
  index: [],
  eqlQueryBar: {
    query: { query: '', language: 'eql' },
    filters: [],
    saved_id: null,
  },
  eqlOptions: {},
};

const schema: FormSchema<TimelineEqlQueryBar> = {
  index: {
    fieldsToValidateOnChange: ['index', 'eqlQueryBar'],
    validations: [],
  },
  eqlOptions: {
    fieldsToValidateOnChange: ['eqlOptions', 'eqlQueryBar'],
  },
};

const hiddenUseFieldClassName = css`
  display: none;
`;

// eslint-disable-next-line react/display-name
export const EqlQueryBarTimeline = memo(({ timelineId }: { timelineId: string }) => {
  const dispatch = useDispatch();
  const getOptionsSelected = useMemo(() => getEqlOptions(), []);
  const eqlOptions = useDeepEqualSelector((state) => getOptionsSelected(state, timelineId));

  const {
    loading: oldIndexPatternsLoading,
    sourcererDataView: oldSourcererDataViewSpec,
    selectedPatterns: oldSelectedPatterns,
  } = useSourcererDataView(SourcererScopeName.timeline);

  const { newDataViewPickerEnabled } = useEnableExperimental();

  const { dataView: experimentalDataView, status } = useDataView(SourcererScopeName.timeline);
  const experimentalSelectedPatterns = useSelectedPatterns(SourcererScopeName.timeline);

  const indexPatternsLoading = useMemo(
    () => (newDataViewPickerEnabled ? status !== 'ready' : oldIndexPatternsLoading),
    [newDataViewPickerEnabled, oldIndexPatternsLoading, status]
  );
  const selectedPatterns = useMemo(
    () => (newDataViewPickerEnabled ? experimentalSelectedPatterns : oldSelectedPatterns),
    [experimentalSelectedPatterns, newDataViewPickerEnabled, oldSelectedPatterns]
  );

  const initialState = useMemo(
    () => ({
      ...defaultValues,
      index: [...selectedPatterns].sort(),
      eqlQueryBar: {
        ...defaultValues.eqlQueryBar,
        query: { query: eqlOptions.query ?? '', language: 'eql' },
      },
      eqlOptions,
    }),
    [eqlOptions, selectedPatterns]
  );

  const handleSubmit = useCallback<FormSubmitHandler<TimelineEqlQueryBar>>(
    async (formData, isValid) => {
      if (!isValid) {
        return;
      }

      if (eqlOptions.query !== `${formData.eqlQueryBar.query.query}`) {
        dispatch(
          timelineActions.updateEqlOptions({
            id: timelineId,
            field: 'query',
            value: `${formData.eqlQueryBar.query.query}`,
          })
        );
      }

      for (const fieldName of Object.keys(formData.eqlOptions) as Array<
        keyof typeof formData.eqlOptions
      >) {
        if (formData.eqlOptions[fieldName] !== eqlOptions[fieldName]) {
          dispatch(
            timelineActions.updateEqlOptions({
              id: timelineId,
              field: fieldName,
              value: formData.eqlOptions[fieldName],
            })
          );
        }
      }
    },
    [dispatch, timelineId, eqlOptions]
  );

  const { form } = useForm<TimelineEqlQueryBar>({
    defaultValue: initialState,
    options: { stripEmptyFields: false },
    schema,
    onSubmit: handleSubmit,
  });
  const { getFields } = form;
  const handleOutsideEqlQueryEditClick = useCallback(() => form.submit(), [form]);

  // Reset the form when new EQL Query came from the state
  useEffect(() => {
    getFields().eqlQueryBar.setValue({
      ...defaultValues.eqlQueryBar,
      query: { query: eqlOptions.query ?? '', language: 'eql' },
    });
  }, [getFields, eqlOptions.query]);

  // Reset the form when new EQL Options came from the state
  useEffect(() => {
    getFields().eqlOptions.setValue({
      eventCategoryField: eqlOptions.eventCategoryField,
      tiebreakerField: eqlOptions.tiebreakerField,
      timestampField: eqlOptions.timestampField,
      size: eqlOptions.size,
    });
  }, [
    getFields,
    eqlOptions.eventCategoryField,
    eqlOptions.tiebreakerField,
    eqlOptions.timestampField,
    eqlOptions.size,
  ]);

  useEffect(() => {
    const { index: indexField } = getFields();
    const newIndexValue = [...selectedPatterns].sort();
    const indexFieldValue = (indexField.value as string[]).sort();

    if (!isEqual(indexFieldValue, newIndexValue)) {
      indexField.setValue(newIndexValue);
    }
  }, [getFields, selectedPatterns]);

  const dataView = useMemo(() => {
    return newDataViewPickerEnabled
      ? experimentalDataView || { title: '', fields: [] }
      : {
          title: oldSourcererDataViewSpec.title ?? '',
          fields: Object.values(oldSourcererDataViewSpec.fields || {}),
        };
  }, [experimentalDataView, newDataViewPickerEnabled, oldSourcererDataViewSpec]);

  /* Force casting `dataViewSpec` to `DataViewBase` is required since EqlQueryEdit
     accepts DataViewBase but `useSourcererDataView()` returns `DataViewSpec`. Since
     the DataView class inherits from DataViewBase, it is safe to use directly and the prioir statement is only valid
     while sourcerer is not migrated to the new data view picker.

     When using `UseField` with `EqlQueryBar` such casting isn't required by TS since
     `UseField` component props are types as `Record<string, any>`. */
  return (
    <Form form={form} data-test-subj="EqlQueryBarTimeline">
      <UseField key="Index" path="index" className={hiddenUseFieldClassName} />
      <EuiOutsideClickDetector onOutsideClick={handleOutsideEqlQueryEditClick}>
        <EqlQueryEdit
          key="EqlQueryBar"
          path="eqlQueryBar"
          eqlOptionsPath="eqlOptions"
          showEqlSizeOption
          dataView={dataView}
          loading={indexPatternsLoading}
          disabled={indexPatternsLoading}
        />
      </EuiOutsideClickDetector>
    </Form>
  );
});

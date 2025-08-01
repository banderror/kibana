/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiDataGridCellValueElementProps } from '@elastic/eui';
import React, { useCallback, useMemo } from 'react';
import { useExpandableFlyoutApi } from '@kbn/expandable-flyout';
import { LeftPanelNotesTab } from '../../../../flyout/document_details/left';
import { useKibana } from '../../../lib/kibana';
import {
  DocumentDetailsLeftPanelKey,
  DocumentDetailsRightPanelKey,
} from '../../../../flyout/document_details/shared/constants/panel_keys';
import type {
  SetEventsDeleted,
  SetEventsLoading,
  ControlColumnProps,
} from '../../../../../common/types';
import type { TimelineItem, TimelineNonEcsData } from '../../../../../common/search_strategy';
import type { ColumnHeaderOptions, OnRowSelected } from '../../../../../common/types/timeline';
import { useIsExperimentalFeatureEnabled } from '../../../hooks/use_experimental_features';
import { NotesEventTypes, DocumentEventTypes } from '../../../lib/telemetry';
import { getMappedNonEcsValue } from '../../../utils/get_mapped_non_ecs_value';
import { useUserPrivileges } from '../../user_privileges';

export type RowActionProps = EuiDataGridCellValueElementProps & {
  columnHeaders: ColumnHeaderOptions[];
  controlColumn: ControlColumnProps;
  data: TimelineItem;
  disabled: boolean;
  index: number;
  isEventViewer: boolean;
  loadingEventIds: Readonly<string[]>;
  onRowSelected: OnRowSelected;
  onRuleChange?: () => void;
  selectedEventIds: Readonly<Record<string, TimelineNonEcsData[]>>;
  showCheckboxes: boolean;
  tabType?: string;
  tableId: string;
  width: number;
  setEventsLoading: SetEventsLoading;
  setEventsDeleted: SetEventsDeleted;
  pageRowIndex: number;
  refetch?: () => void;
};

const RowActionComponent = ({
  columnHeaders,
  controlColumn,
  data,
  disabled,
  index,
  isEventViewer,
  loadingEventIds,
  onRowSelected,
  onRuleChange,
  pageRowIndex,
  rowIndex,
  selectedEventIds,
  showCheckboxes,
  tabType,
  tableId,
  setEventsLoading,
  setEventsDeleted,
  width,
  refetch,
}: RowActionProps) => {
  const { data: timelineNonEcsData, ecs: ecsData, _id: eventId, _index: indexName } = data ?? {};
  const { telemetry } = useKibana().services;
  const { openFlyout } = useExpandableFlyoutApi();

  const columnValues = useMemo(
    () =>
      timelineNonEcsData &&
      columnHeaders
        .map(
          (header) =>
            getMappedNonEcsValue({
              data: timelineNonEcsData,
              fieldName: header.id,
            }) ?? []
        )
        .join(' '),
    [columnHeaders, timelineNonEcsData]
  );

  const securitySolutionNotesDisabled = useIsExperimentalFeatureEnabled(
    'securitySolutionNotesDisabled'
  );
  const {
    notesPrivileges: { read: canReadNotes },
    timelinePrivileges: { read: canReadTimelines },
  } = useUserPrivileges();
  const showNotes = canReadNotes && !securitySolutionNotesDisabled;

  const handleOnEventDetailPanelOpened = useCallback(() => {
    openFlyout({
      right: {
        id: DocumentDetailsRightPanelKey,
        params: {
          id: eventId,
          indexName,
          scopeId: tableId,
        },
      },
    });
    telemetry.reportEvent(DocumentEventTypes.DetailsFlyoutOpened, {
      location: tableId,
      panel: 'right',
    });
  }, [eventId, indexName, tableId, openFlyout, telemetry]);

  const toggleShowNotes = useCallback(() => {
    openFlyout({
      right: {
        id: DocumentDetailsRightPanelKey,
        params: {
          id: eventId,
          indexName,
          scopeId: tableId,
        },
      },
      left: {
        id: DocumentDetailsLeftPanelKey,
        path: {
          tab: LeftPanelNotesTab,
        },
        params: {
          id: eventId,
          indexName,
          scopeId: tableId,
        },
      },
    });
    telemetry.reportEvent(NotesEventTypes.OpenNoteInExpandableFlyoutClicked, {
      location: tableId,
    });
    telemetry.reportEvent(DocumentEventTypes.DetailsFlyoutOpened, {
      location: tableId,
      panel: 'left',
    });
  }, [eventId, indexName, openFlyout, tableId, telemetry]);

  const Action = controlColumn.rowCellRender;

  if (!timelineNonEcsData || !ecsData || !eventId) {
    return <span data-test-subj="noData" />;
  }

  return (
    <>
      {Action && (
        <Action
          ariaRowindex={pageRowIndex + 1}
          checked={Object.keys(selectedEventIds).includes(eventId)}
          columnId={controlColumn.id || ''}
          columnValues={columnValues || ''}
          data={timelineNonEcsData}
          data-test-subj="actions"
          disabled={disabled}
          ecsData={ecsData}
          eventId={eventId}
          index={index}
          isEventViewer={isEventViewer}
          loadingEventIds={loadingEventIds}
          onEventDetailsPanelOpened={handleOnEventDetailPanelOpened}
          onRowSelected={onRowSelected}
          onRuleChange={onRuleChange}
          rowIndex={rowIndex}
          showCheckboxes={showCheckboxes}
          tabType={tabType}
          timelineId={tableId}
          toggleShowNotes={securitySolutionNotesDisabled ? undefined : toggleShowNotes}
          width={width}
          setEventsLoading={setEventsLoading}
          setEventsDeleted={setEventsDeleted}
          refetch={refetch}
          showNotes={showNotes}
          disableTimelineAction={!canReadTimelines}
        />
      )}
    </>
  );
};

export const RowAction = React.memo(RowActionComponent);

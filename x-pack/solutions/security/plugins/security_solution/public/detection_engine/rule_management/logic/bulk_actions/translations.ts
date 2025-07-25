/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HTTPError } from '../../../../../common/detection_engine/types';
import type {
  BulkActionEditPayload,
  BulkActionType,
} from '../../../../../common/api/detection_engine/rule_management';
import {
  BulkActionEditTypeEnum,
  BulkActionTypeEnum,
} from '../../../../../common/api/detection_engine/rule_management';
import * as i18n from '../../../common/translations';
import type { BulkActionResponse, BulkActionSummary } from '../../api/api';

export function summarizeBulkSuccess(action: BulkActionType, summary: BulkActionSummary): string {
  switch (action) {
    case BulkActionTypeEnum.export:
      return i18n.RULES_BULK_EXPORT_SUCCESS;

    case BulkActionTypeEnum.duplicate:
      return i18n.RULES_BULK_DUPLICATE_SUCCESS;

    case BulkActionTypeEnum.delete:
      return i18n.RULES_BULK_DELETE_SUCCESS;

    case BulkActionTypeEnum.enable:
      return i18n.RULES_BULK_ENABLE_SUCCESS;

    case BulkActionTypeEnum.disable:
      return i18n.RULES_BULK_DISABLE_SUCCESS;

    case BulkActionTypeEnum.run:
      return i18n.RULES_BULK_MANUAL_RULE_RUN_SUCCESS;

    case BulkActionTypeEnum.fill_gaps:
      if (summary.succeeded === 0 && summary.skipped > 0) {
        return i18n.RULES_BULK_FILL_GAPS_SUCCESS_ALL_SKIPPED;
      }
      return i18n.RULES_BULK_FILL_GAPS_SUCCESS;

    case BulkActionTypeEnum.edit:
      return i18n.RULES_BULK_EDIT_SUCCESS;
  }
}

export function explainBulkSuccess(
  action: Exclude<BulkActionType, BulkActionTypeEnum['edit']>,
  summary: BulkActionSummary
): string {
  switch (action) {
    case BulkActionTypeEnum.export:
      return getExportSuccessToastMessage(summary.succeeded, summary.total);

    case BulkActionTypeEnum.duplicate:
      return i18n.RULES_BULK_DUPLICATE_SUCCESS_DESCRIPTION(summary.succeeded);

    case BulkActionTypeEnum.delete:
      return i18n.RULES_BULK_DELETE_SUCCESS_DESCRIPTION(summary.succeeded);

    case BulkActionTypeEnum.enable:
      return i18n.RULES_BULK_ENABLE_SUCCESS_DESCRIPTION(summary.succeeded);

    case BulkActionTypeEnum.disable:
      return i18n.RULES_BULK_DISABLE_SUCCESS_DESCRIPTION(summary.succeeded);

    case BulkActionTypeEnum.run:
      return i18n.RULES_BULK_MANUAL_RULE_RUN_SUCCESS_DESCRIPTION(summary.succeeded);

    case BulkActionTypeEnum.fill_gaps:
      if (summary.succeeded === 0 && summary.skipped > 0) {
        return i18n.RULES_BULK_FILL_GAPS_SUCCESS_ALL_RULES_SKIPPED_DESCRIPTION;
      }
      return i18n.RULES_BULK_FILL_GAPS_SUCCESS_DESCRIPTION(summary.succeeded, summary.skipped);
  }
}

export function explainBulkEditSuccess(
  editPayload: BulkActionEditPayload[],
  summary: BulkActionSummary
): string {
  const dataViewSkipDetail =
    summary.skipped > 0 ? ` ${i18n.RULES_BULK_EDIT_SUCCESS_DATA_VIEW_RULES_SKIPPED_DETAIL}` : null;
  if (
    editPayload.some(
      (x) =>
        x.type === BulkActionEditTypeEnum.add_index_patterns ||
        x.type === BulkActionEditTypeEnum.set_index_patterns ||
        x.type === BulkActionEditTypeEnum.delete_index_patterns
    )
  ) {
    return `${i18n.RULES_BULK_EDIT_SUCCESS_DESCRIPTION(
      summary.succeeded,
      summary.skipped
    )}${dataViewSkipDetail}`;
  }

  return i18n.RULES_BULK_EDIT_SUCCESS_DESCRIPTION(summary.succeeded, summary.skipped);
}

export function summarizeBulkError(action: BulkActionType): string {
  switch (action) {
    case BulkActionTypeEnum.export:
      return i18n.RULES_BULK_EXPORT_FAILURE;

    case BulkActionTypeEnum.duplicate:
      return i18n.RULES_BULK_DUPLICATE_FAILURE;

    case BulkActionTypeEnum.delete:
      return i18n.RULES_BULK_DELETE_FAILURE;

    case BulkActionTypeEnum.enable:
      return i18n.RULES_BULK_ENABLE_FAILURE;

    case BulkActionTypeEnum.disable:
      return i18n.RULES_BULK_DISABLE_FAILURE;

    case BulkActionTypeEnum.run:
      return i18n.RULES_BULK_MANUAL_RULE_RUN_FAILURE;

    case BulkActionTypeEnum.fill_gaps:
      return i18n.RULES_BULK_FILL_GAPS_FAILURE;

    case BulkActionTypeEnum.edit:
      return i18n.RULES_BULK_EDIT_FAILURE;
  }
}

export function explainBulkError(action: BulkActionType, error: HTTPError): string {
  // if response doesn't have number of failed rules, it means the whole bulk action failed
  const summary = (error.body as BulkActionResponse)?.attributes?.summary;

  if (!summary) {
    return '';
  }

  switch (action) {
    case BulkActionTypeEnum.export:
      return i18n.RULES_BULK_EXPORT_FAILURE_DESCRIPTION(summary.failed);

    case BulkActionTypeEnum.duplicate:
      return i18n.RULES_BULK_DUPLICATE_FAILURE_DESCRIPTION(summary.failed);

    case BulkActionTypeEnum.delete:
      return i18n.RULES_BULK_DELETE_FAILURE_DESCRIPTION(summary.failed);

    case BulkActionTypeEnum.enable:
      return i18n.RULES_BULK_ENABLE_FAILURE_DESCRIPTION(summary.failed);

    case BulkActionTypeEnum.disable:
      return i18n.RULES_BULK_DISABLE_FAILURE_DESCRIPTION(summary.failed);

    case BulkActionTypeEnum.run:
      return i18n.RULES_BULK_MANUAL_RULE_RUN_FAILURE_DESCRIPTION(summary.failed);

    case BulkActionTypeEnum.fill_gaps:
      return i18n.RULES_BULK_FILL_GAPS_FAILURE_DESCRIPTION(summary.failed);

    case BulkActionTypeEnum.edit:
      return i18n.RULES_BULK_EDIT_FAILURE_DESCRIPTION(summary.failed, summary.skipped);
  }
}

const getExportSuccessToastMessage = (succeeded: number, total: number) => {
  const message = [i18n.RULES_BULK_EXPORT_SUCCESS_DESCRIPTION(succeeded, total)];

  // if not all rules are successfully exported it means there included prebuilt rules
  // display message to users that prebuilt rules were excluded
  if (total > succeeded) {
    message.push(i18n.RULES_BULK_EXPORT_PREBUILT_RULES_EXCLUDED_DESCRIPTION);
  }

  return message.join(' ');
};

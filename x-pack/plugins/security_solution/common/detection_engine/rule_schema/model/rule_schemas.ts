/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';

import {
  concurrent_searches,
  items_per_search,
  machine_learning_job_id,
  RiskScore,
  RiskScoreMapping,
  RuleActionArray,
  RuleActionThrottle,
  RuleInterval,
  RuleIntervalFrom,
  RuleIntervalTo,
  Severity,
  SeverityMapping,
  threat_filters,
  threat_index,
  threat_indicator_path,
  threat_mapping,
  threat_query,
} from '@kbn/securitysolution-io-ts-alerting-types';

import { RuleExecutionSummary } from '../../rule_monitoring';
import { ResponseActionArray } from '../../rule_response_actions/schemas';
import {
  AlertsIndex,
  AlertsIndexNamespace,
  BuildingBlockType,
  DataViewId,
  EventCategoryOverride,
  ExceptionListArray,
  IndexPatternArray,
  InvestigationGuide,
  IsRuleEnabled,
  IsRuleImmutable,
  MaxSignals,
  RelatedIntegrationArray,
  RequiredFieldArray,
  RuleAuthorArray,
  RuleDescription,
  RuleFalsePositiveArray,
  RuleFilterArray,
  RuleLicense,
  RuleMetadata,
  RuleName,
  RuleNameOverride,
  RuleObjectId,
  RuleQuery,
  RuleReferenceArray,
  RuleSignatureId,
  RuleTagArray,
  RuleVersion,
  SavedObjectResolveAliasPurpose,
  SavedObjectResolveAliasTargetId,
  SavedObjectResolveOutcome,
  SetupGuide,
  ThreatArray,
  TiebreakerField,
  TimelineTemplateId,
  TimelineTemplateTitle,
  TimestampField,
  TimestampOverride,
  TimestampOverrideFallbackDisabled,
} from '..';
import {
  saved_id,
  threshold,
  anomaly_threshold,
  updated_at,
  updated_by,
  created_at,
  created_by,
  newTermsFields,
  historyWindowStart,
} from '../../schemas/common';

import { buildRuleSchemas } from './build_rule_schemas';

// -------------------------------------------------------------------------------------------------
// Base rule fields

const baseRuleFields = {
  required: {
    name: RuleName,
    description: RuleDescription,
    severity: Severity,
    risk_score: RiskScore,
  },
  optional: {
    // Field overrides
    rule_name_override: RuleNameOverride,
    timestamp_override: TimestampOverride,
    timestamp_override_fallback_disabled: TimestampOverrideFallbackDisabled,
    // Timeline template
    timeline_id: TimelineTemplateId,
    timeline_title: TimelineTemplateTitle,
    // Atributes related to SavedObjectsClient.resolve API
    outcome: SavedObjectResolveOutcome,
    alias_target_id: SavedObjectResolveAliasTargetId,
    alias_purpose: SavedObjectResolveAliasPurpose,
    // Misc attributes
    license: RuleLicense,
    note: InvestigationGuide,
    building_block_type: BuildingBlockType,
    output_index: AlertsIndex,
    namespace: AlertsIndexNamespace,
    meta: RuleMetadata,
  },
  defaultable: {
    // Main attributes
    version: RuleVersion,
    tags: RuleTagArray,
    enabled: IsRuleEnabled,
    // Field overrides
    risk_score_mapping: RiskScoreMapping,
    severity_mapping: SeverityMapping,
    // Rule schedule
    interval: RuleInterval,
    from: RuleIntervalFrom,
    to: RuleIntervalTo,
    // Rule actions
    actions: RuleActionArray,
    throttle: RuleActionThrottle,
    // Rule exceptions
    exceptions_list: ExceptionListArray,
    // Misc attributes
    author: RuleAuthorArray,
    false_positives: RuleFalsePositiveArray,
    references: RuleReferenceArray,
    // maxSignals not used in ML rules but probably should be used
    max_signals: MaxSignals,
    threat: ThreatArray,
  },
};

const responseRequiredFields = {
  id: RuleObjectId,
  rule_id: RuleSignatureId,
  immutable: IsRuleImmutable,
  updated_at,
  updated_by,
  created_at,
  created_by,

  // NOTE: For now, Related Integrations, Required Fields and Setup Guide are supported for prebuilt
  // rules only. We don't want to allow users to edit these 3 fields via the API. If we added them
  // to baseParams.defaultable, they would become a part of the request schema as optional fields.
  // This is why we add them here, in order to add them only to the response schema.
  related_integrations: RelatedIntegrationArray,
  required_fields: RequiredFieldArray,
  setup: SetupGuide,
};

const responseOptionalFields = {
  execution_summary: RuleExecutionSummary,
};

const {
  create: baseCreateParams,
  patch: basePatchParams,
  response: baseResponseParams,
} = buildRuleSchemas(baseRuleFields);

export { baseCreateParams };

// -------------------------------------------------------------------------------------------------
// Helper types and schemas

// "Shared" types are the same across all rule types, and built from "baseParams" above
// with some variations for each route. These intersect with type specific schemas below
// to create the full schema for each route.

type SharedCreateProps = t.TypeOf<typeof SharedCreateProps>;
const SharedCreateProps = t.intersection([
  baseCreateParams,
  t.exact(t.partial({ rule_id: RuleSignatureId })),
]);

type SharedUpdateProps = t.TypeOf<typeof SharedUpdateProps>;
const SharedUpdateProps = t.intersection([
  baseCreateParams,
  t.exact(t.partial({ rule_id: RuleSignatureId })),
  t.exact(t.partial({ id: RuleObjectId })),
]);

export type SharedPatchProps = t.TypeOf<typeof SharedPatchProps>;
export const SharedPatchProps = t.intersection([
  basePatchParams,
  t.exact(t.partial({ rule_id: RuleSignatureId, id: RuleObjectId })),
]);

export type SharedResponseSchema = t.TypeOf<typeof sharedResponseSchema>;
const sharedResponseSchema = t.intersection([
  baseResponseParams,
  t.exact(t.type(responseRequiredFields)),
  t.exact(t.partial(responseOptionalFields)),
]);

type CreateSchema<T> = SharedCreateProps & T;
type UpdateSchema<T> = SharedUpdateProps & T;
type PatchSchema<T> = SharedPatchProps & T;
type ResponseSchema<T> = SharedResponseSchema & T;

// -------------------------------------------------------------------------------------------------
// EQL rule fields

const eqlRuleParams = {
  required: {
    type: t.literal('eql'),
    language: t.literal('eql'),
    query: RuleQuery,
  },
  optional: {
    index: IndexPatternArray,
    data_view_id: DataViewId,
    filters: RuleFilterArray,
    event_category_override: EventCategoryOverride,
    timestamp_field: TimestampField,
    tiebreaker_field: TiebreakerField,
  },
  defaultable: {},
};

const {
  create: eqlCreateParams,
  patch: eqlPatchParams,
  response: eqlResponseParams,
} = buildRuleSchemas(eqlRuleParams);

export type EqlCreateSchema = CreateSchema<t.TypeOf<typeof eqlCreateParams>>;
export type EqlPatchParams = t.TypeOf<typeof eqlPatchParams>;
export type EqlResponseSchema = ResponseSchema<t.TypeOf<typeof eqlResponseParams>>;

export { eqlCreateParams, eqlPatchParams, eqlResponseParams };

// -------------------------------------------------------------------------------------------------
// Indicator Match rule fields

const threatMatchRuleParams = {
  required: {
    type: t.literal('threat_match'),
    query: RuleQuery,
    threat_query,
    threat_mapping,
    threat_index,
  },
  optional: {
    index: IndexPatternArray,
    data_view_id: DataViewId,
    filters: RuleFilterArray,
    saved_id,
    threat_filters,
    threat_indicator_path,
    threat_language: t.keyof({ kuery: null, lucene: null }),
    concurrent_searches,
    items_per_search,
  },
  defaultable: {
    language: t.keyof({ kuery: null, lucene: null }),
  },
};

const {
  create: threatMatchCreateParams,
  patch: threatMatchPatchParams,
  response: threatMatchResponseParams,
} = buildRuleSchemas(threatMatchRuleParams);

export type ThreatMatchCreateSchema = CreateSchema<t.TypeOf<typeof threatMatchCreateParams>>;
export type ThreatMatchPatchParams = t.TypeOf<typeof threatMatchPatchParams>;
export type ThreatMatchResponseSchema = ResponseSchema<t.TypeOf<typeof threatMatchResponseParams>>;

export { threatMatchCreateParams, threatMatchPatchParams, threatMatchResponseParams };

// -------------------------------------------------------------------------------------------------
// Custom Query rule fields

const queryRuleParams = {
  required: {
    type: t.literal('query'),
  },
  optional: {
    index: IndexPatternArray,
    data_view_id: DataViewId,
    filters: RuleFilterArray,
    saved_id,
    response_actions: ResponseActionArray,
  },
  defaultable: {
    query: RuleQuery,
    language: t.keyof({ kuery: null, lucene: null }),
  },
};

const {
  create: queryCreateParams,
  patch: queryPatchParams,
  response: queryResponseParams,
} = buildRuleSchemas(queryRuleParams);

export type QueryCreateSchema = CreateSchema<t.TypeOf<typeof queryCreateParams>>;
export type QueryUpdateSchema = UpdateSchema<t.TypeOf<typeof queryCreateParams>>;
export type QueryPatchParams = t.TypeOf<typeof queryPatchParams>;
export type QueryResponseSchema = ResponseSchema<t.TypeOf<typeof queryResponseParams>>;

export { queryCreateParams, queryPatchParams, queryResponseParams };

// -------------------------------------------------------------------------------------------------
// Saved Query rule fields

const savedQueryRuleParams = {
  required: {
    type: t.literal('saved_query'),
    saved_id,
  },
  optional: {
    // Having language, query, and filters possibly defined adds more code confusion and probably user confusion
    // if the saved object gets deleted for some reason
    index: IndexPatternArray,
    data_view_id: DataViewId,
    query: RuleQuery,
    filters: RuleFilterArray,
    response_actions: ResponseActionArray,
  },
  defaultable: {
    language: t.keyof({ kuery: null, lucene: null }),
  },
};

const {
  create: savedQueryCreateParams,
  patch: savedQueryPatchParams,
  response: savedQueryResponseParams,
} = buildRuleSchemas(savedQueryRuleParams);

export type SavedQueryCreateSchema = CreateSchema<t.TypeOf<typeof savedQueryCreateParams>>;
export type SavedQueryPatchParams = t.TypeOf<typeof savedQueryPatchParams>;
export type SavedQueryResponseSchema = ResponseSchema<t.TypeOf<typeof savedQueryResponseParams>>;

export { savedQueryCreateParams, savedQueryPatchParams, savedQueryResponseParams };

// -------------------------------------------------------------------------------------------------
// Threshold rule fields

const thresholdRuleParams = {
  required: {
    type: t.literal('threshold'),
    query: RuleQuery,
    threshold,
  },
  optional: {
    index: IndexPatternArray,
    data_view_id: DataViewId,
    filters: RuleFilterArray,
    saved_id,
  },
  defaultable: {
    language: t.keyof({ kuery: null, lucene: null }),
  },
};

const {
  create: thresholdCreateParams,
  patch: thresholdPatchParams,
  response: thresholdResponseParams,
} = buildRuleSchemas(thresholdRuleParams);

export type ThresholdCreateSchema = CreateSchema<t.TypeOf<typeof thresholdCreateParams>>;
export type ThresholdPatchParams = t.TypeOf<typeof thresholdPatchParams>;
export type ThresholdResponseSchema = ResponseSchema<t.TypeOf<typeof thresholdResponseParams>>;

export type PatchThresholdRuleProps = t.TypeOf<typeof PatchThresholdRuleProps>;
export const PatchThresholdRuleProps = t.intersection([thresholdPatchParams, SharedPatchProps]);

export { thresholdCreateParams, thresholdPatchParams, thresholdResponseParams };

// -------------------------------------------------------------------------------------------------
// Machine Learning rule fields

const machineLearningRuleParams = {
  required: {
    type: t.literal('machine_learning'),
    anomaly_threshold,
    machine_learning_job_id,
  },
  optional: {},
  defaultable: {},
};

const {
  create: machineLearningCreateParams,
  patch: machineLearningPatchParams,
  response: machineLearningResponseParams,
} = buildRuleSchemas(machineLearningRuleParams);

export type MachineLearningCreateSchema = CreateSchema<
  t.TypeOf<typeof machineLearningCreateParams>
>;
export type MachineLearningUpdateSchema = UpdateSchema<
  t.TypeOf<typeof machineLearningCreateParams>
>;
export type MachineLearningPatchParams = t.TypeOf<typeof machineLearningPatchParams>;
export type MachineLearningResponseSchema = ResponseSchema<
  t.TypeOf<typeof machineLearningResponseParams>
>;

export { machineLearningCreateParams, machineLearningPatchParams, machineLearningResponseParams };

// -------------------------------------------------------------------------------------------------
// New Terms rule fields

const newTermsRuleParams = {
  required: {
    type: t.literal('new_terms'),
    query: RuleQuery,
    new_terms_fields: newTermsFields,
    history_window_start: historyWindowStart,
  },
  optional: {
    index: IndexPatternArray,
    data_view_id: DataViewId,
    filters: RuleFilterArray,
  },
  defaultable: {
    language: t.keyof({ kuery: null, lucene: null }),
  },
};

const {
  create: newTermsCreateParams,
  patch: newTermsPatchParams,
  response: newTermsResponseParams,
} = buildRuleSchemas(newTermsRuleParams);

export type NewTermsCreateSchema = CreateSchema<t.TypeOf<typeof newTermsCreateParams>>;
export type NewTermsUpdateSchema = UpdateSchema<t.TypeOf<typeof newTermsCreateParams>>;
export type NewTermsPatchParams = t.TypeOf<typeof newTermsPatchParams>;
export type NewTermsResponseSchema = ResponseSchema<t.TypeOf<typeof newTermsResponseParams>>;

export { newTermsCreateParams, newTermsPatchParams, newTermsResponseParams };

// -------------------------------------------------------------------------------------------------
// Final combined schemas

export type CreateTypeSpecific = t.TypeOf<typeof createTypeSpecific>;
export const createTypeSpecific = t.union([
  eqlCreateParams,
  threatMatchCreateParams,
  queryCreateParams,
  savedQueryCreateParams,
  thresholdCreateParams,
  machineLearningCreateParams,
  newTermsCreateParams,
]);

export const patchTypeSpecific = t.union([
  eqlPatchParams,
  threatMatchPatchParams,
  queryPatchParams,
  savedQueryPatchParams,
  thresholdPatchParams,
  machineLearningPatchParams,
  newTermsPatchParams,
]);

export type ResponseTypeSpecific = t.TypeOf<typeof responseTypeSpecific>;
const responseTypeSpecific = t.union([
  eqlResponseParams,
  threatMatchResponseParams,
  queryResponseParams,
  savedQueryResponseParams,
  thresholdResponseParams,
  machineLearningResponseParams,
  newTermsResponseParams,
]);

export type CreateRulesSchema = t.TypeOf<typeof createRulesSchema>;
export const createRulesSchema = t.intersection([SharedCreateProps, createTypeSpecific]);

export type UpdateRulesSchema = t.TypeOf<typeof updateRulesSchema>;
export const updateRulesSchema = t.intersection([createTypeSpecific, SharedUpdateProps]);

export type PatchRuleProps = t.TypeOf<typeof PatchRuleProps>;
export const PatchRuleProps = t.intersection([patchTypeSpecific, SharedPatchProps]);

export const fullResponseSchema = t.intersection([sharedResponseSchema, responseTypeSpecific]);
export type FullResponseSchema = t.TypeOf<typeof fullResponseSchema>;

// -------------------------------------------------------------------------------------------------
// Rule preview schemas

export type PreviewRulesSchema = t.TypeOf<typeof previewRulesSchema>;
export const previewRulesSchema = t.intersection([
  SharedCreateProps,
  createTypeSpecific,
  t.type({ invocationCount: t.number, timeframeEnd: t.string }),
]);

export interface RulePreviewLogs {
  errors: string[];
  warnings: string[];
  startedAt?: string;
  duration: number;
}

export interface PreviewResponse {
  previewId: string | undefined;
  logs: RulePreviewLogs[] | undefined;
  isAborted: boolean | undefined;
}
